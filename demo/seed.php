<?php

/**
 * Demo data for the screenshots and videos of the documentation.
 *
 * This script lives in the docs repository on purpose: the application repo
 * must stay untouched by the documentation work. It runs against the app's own
 * models through Artisan:
 *
 *     php artisan tinker /workspace/projects/picstome-docs/demo/seed.php
 *
 * What it creates (idempotent, safe to re-run):
 *
 * - a studio user: `docs@picstome.test` / `password`, handle `estudionorte`;
 * - three galleries with real photos uploaded to the configured S3 disk under
 *   `docs-demo/`: a shared wedding with a selection limit, a private portrait
 *   gallery with watermarked previews, and a public portfolio gallery;
 * - two photoshoots, three clients, a contract template and two contracts;
 * - invoice settings with real fiscal data and three invoices: draft, issued
 *   and a corrective one.
 *
 * Photos: Unsplash, free for commercial use, already resized to 1400 px and
 * committed in `demo/photos/`, so the seed also works offline.
 *
 * Nothing is written inside the application repo: the only side effect is the
 * demo rows in the database and the objects in the S3 bucket.
 */

use App\Models\Contract;
use App\Models\ContractTemplate;
use App\Models\Customer;
use App\Models\Gallery;
use App\Models\Invoice;
use App\Models\InvoiceSetting;
use App\Models\Photo;
use App\Models\PhotoComment;
use App\Models\Payment;
use App\Models\Photoshoot;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

$email = 'docs@picstome.test';
$password = 'password';
$desiredHandle = 'estudionorte';
$disk = config('picstome.disk', 's3');
$photoDir = '/workspace/projects/picstome-docs/demo/photos';

if (! is_dir($photoDir)) {
    echo "❌ No encuentro las fotos de demo en {$photoDir}\n";

    return;
}

/* ---------------------------------------------------------------------------
 * 1. Studio account
 * ------------------------------------------------------------------------ */

$user = User::query()->firstOrCreate(
    ['email' => $email],
    [
        'name' => 'Lucía Ferrer',
        'password' => Hash::make($password),
        'email_verified_at' => now(),
        'language' => 'es',
    ],
);

if (! $user->personalTeam()) {
    $handle = $desiredHandle;

    if (Team::query()->where('handle', $handle)->exists()) {
        $handle = $desiredHandle.'-docs';
    }

    $team = $user->ownedTeams()->create([
        'name' => 'Estudio Norte',
        'personal_team' => true,
        'handle' => $handle,
    ]);

    $user->switchTeam($team);
}

$user->switchTeam($user->personalTeam());
$user = $user->fresh();
$team = $user->currentTeam;

$team->forceFill([
    'name' => 'Estudio Norte',
    'bio' => 'Fotografía de boda y retrato en Madrid. Luz natural, sin poses rígidas.',
    'brand_color' => '#316d61',
    'instagram_handle' => 'estudionorte',
    'website_url' => 'https://estudionorte.example',
    'stripe_currency' => 'EUR',
    'show_pay_button' => true,
    // A real limit, not "unlimited": the plans article is about the storage bar
    // and the percentage, and an unlimited account has no bar to show.
    'custom_storage_limit' => 1073741824,
])->save();

echo "✅ Estudio: {$team->name} ({$team->handle}) · disco {$disk}\n";

/* ---------------------------------------------------------------------------
 * 2. Clients
 * ------------------------------------------------------------------------ */

$clientRows = [
    [
        'name' => 'Lucía Ferrer',
        'legal_name' => 'Lucía Ferrer Gómez',
        'tax_id' => '12345678Z',
        'email' => 'lucia@example.test',
        'phone' => '+34 611 223 344',
        'address' => 'Calle de Alcalá 42',
        'city' => 'Madrid',
        'state' => 'Madrid',
        'postal_code' => '28014',
        'country' => 'ES',
        'birthdate' => now()->addDays(5)->subYears(31),
    ],
    [
        'name' => 'Marc Vidal',
        'legal_name' => 'Marc Vidal Puig',
        'tax_id' => '87654321X',
        'email' => 'marc@example.test',
        'phone' => '+34 622 334 455',
        'address' => 'Carrer de Mallorca 210',
        'city' => 'Barcelona',
        'state' => 'Barcelona',
        'postal_code' => '08008',
        'country' => 'ES',
        'birthdate' => now()->addMonths(2)->subYears(34),
    ],
    [
        'name' => 'Agencia Bruma',
        'legal_name' => 'Agencia Bruma SL',
        'tax_id' => 'B87654322',
        'email' => 'produccion@bruma.example',
        'phone' => '+34 910 223 344',
        'address' => 'Calle de Serrano 5',
        'city' => 'Madrid',
        'state' => 'Madrid',
        'postal_code' => '28001',
        'country' => 'ES',
        'birthdate' => null,
    ],
];

$customers = [];

foreach ($clientRows as $row) {
    // Match on the email, which is unique per team: the tax id can change while
    // iterating on the demo and must not abort the whole seed.
    $customers[$row['name']] = Customer::query()->updateOrCreate(
        ['team_id' => $team->id, 'email' => $row['email']],
        $row,
    );
}

echo '✅ Clientes: '.count($customers)."\n";

/* ---------------------------------------------------------------------------
 * 3. Galleries with photos
 * ------------------------------------------------------------------------ */

/**
 * Upload a demo photo to the configured disk and build its WebP grid
 * thumbnail, which is what the gallery grid renders.
 *
 * @return array{path: string, thumb_path: string, size: int, stored_size: int, width: int, height: int}
 */
$stage = function (string $file, Gallery $gallery, Team $team) use ($disk): array {
    $bytes = (string) file_get_contents($file);
    $name = Str::random(40).'.jpg';
    $path = "docs-demo/teams/{$team->id}/galleries/{$gallery->ulid}/{$name}";
    $thumbPath = $path.'.thumb.webp';

    [$width, $height] = getimagesize($file) ?: [1400, 933];

    $source = imagecreatefromstring($bytes);
    $thumb = imagecreatetruecolor(500, 500);
    imagefill($thumb, 0, 0, imagecolorallocate($thumb, 27, 35, 32));

    $ratio = min(500 / $width, 500 / $height);
    $targetWidth = (int) round($width * $ratio);
    $targetHeight = (int) round($height * $ratio);

    imagecopyresampled(
        $thumb,
        $source,
        (int) ((500 - $targetWidth) / 2),
        (int) ((500 - $targetHeight) / 2),
        0,
        0,
        $targetWidth,
        $targetHeight,
        $width,
        $height,
    );

    ob_start();
    imagewebp($thumb, null, 82);
    $thumbBytes = (string) ob_get_clean();

    Storage::disk($disk)->put($path, $bytes);
    Storage::disk($disk)->put($thumbPath, $thumbBytes);

    return [
        'path' => $path,
        'thumb_path' => $thumbPath,
        'size' => strlen($bytes),
        'stored_size' => strlen($bytes) + strlen($thumbBytes),
        'width' => $width,
        'height' => $height,
    ];
};

$photos = glob($photoDir.'/*.jpg') ?: [];

if (count($photos) < 12) {
    echo '⚠️ Solo hay '.count($photos)." fotos en {$photoDir}\n";
}

$state = ['galleries' => [], 'login' => ['email' => $email, 'password' => $password]];

$galleryRows = [
    [
        'name' => 'Boda de Lucía y Marc',
        'attributes' => [
            'is_shared' => true,
            'is_share_selectable' => true,
            'is_share_downloadable' => true,
            'is_share_watermarked' => false,
            'is_share_versions_visible' => false,
            'share_selection_limit' => 40,
            'are_comments_enabled' => true,
            'are_annotations_enabled' => true,
            'share_description' => 'Selecciona tus 40 favoritas antes del 30 de noviembre.',
            'expiration_date' => now()->addMonths(2)->startOfDay(),
        ],
        'photos' => array_slice($photos, 0, 6),
        'ratings' => [5, 5, 4, 4, 3, null],
        'favorites' => 4,
        'comment' => true,
    ],
    [
        'name' => 'Retrato de estudio — Marta',
        'attributes' => [
            'is_shared' => true,
            'is_share_selectable' => true,
            'is_share_downloadable' => false,
            'is_share_watermarked' => true,
            'is_share_versions_visible' => true,
            'share_selection_limit' => 5,
            'are_comments_enabled' => true,
            'are_annotations_enabled' => false,
        ],
        'photos' => array_slice($photos, 6, 3),
        'ratings' => [5, 3, 2],
        'favorites' => 1,
    ],
    [
        'name' => 'Boda en la sierra',
        'attributes' => [
            'is_public' => true,
            'portfolio_order' => 1,
        ],
        'photos' => array_slice($photos, 9, 3),
        'ratings' => [5, 4, null],
        'favorites' => 0,
    ],
];

foreach ($galleryRows as $row) {
    $gallery = Gallery::query()->firstOrNew([
        'team_id' => $team->id,
        'name' => $row['name'],
    ]);

    $gallery->fill(array_merge([
        'is_public' => false,
        'is_shared' => false,
        'is_share_selectable' => false,
        'is_share_downloadable' => false,
        'is_share_watermarked' => false,
        'is_share_versions_visible' => false,
        'share_selection_limit' => null,
        'are_comments_enabled' => true,
        'are_annotations_enabled' => false,
        'share_description' => null,
        'expiration_date' => null,
        'keep_original_size' => false,
    ], $row['attributes']))->save();

    // Rebuild the set every run so the demo stays deterministic.
    foreach ($gallery->photos as $existing) {
        Storage::disk($existing->disk ?: $disk)->delete(array_filter([
            $existing->path,
            $existing->thumb_path,
            $existing->raw_path,
        ]));
    }

    $gallery->photos()->delete();

    $ids = [];

    foreach ($row['photos'] as $index => $file) {
        $uploaded = $stage($file, $gallery, $team);

        // The wedding gallery keeps its last photo archived: the Archived tab only
        // exists while something is archived, and the article needs to show it.
        $archived = $gallery->name === 'Boda de Lucía y Marc' && $index === count($row['photos']) - 1;

        $photo = $gallery->photos()->create(array_merge($uploaded, [
            'name' => basename($file),
            'source_name' => basename($file),
            'identity_key' => 'image:'.pathinfo($file, PATHINFO_FILENAME),
            'version_count' => 1,
            'uploaded_at' => now()->subDays(count($row['photos']) - $index),
            'disk' => $disk,
            'status' => 'processed',
            'rating' => $archived ? null : ($row['ratings'][$index] ?? null),
            'favorited_at' => ! $archived && $index < $row['favorites'] ? now()->subDays($index + 1) : null,
            'archived_at' => $archived ? now()->subDay() : null,
        ]));

        $ids[] = $photo->id;
    }

    if ($ids !== []) {
        $gallery->forceFill(['cover_photo_id' => $ids[0]])->save();
    }

    // Give the second photo a previous version: the file-versions article needs
    // a real stack to show, and versions are created by re-uploading a file with
    // the same name, which the seeder cannot do without a second file.
    if ($ids !== [] && $gallery->name === 'Boda de Lucía y Marc' && isset($ids[1])) {
        $current = App\Models\Photo::query()->find($ids[1]);

        if ($current) {
            $previous = $current->only([
                'name', 'source_name', 'path', 'thumb_path', 'raw_path', 'disk',
                'size', 'stored_size', 'stored_hash', 'status', 'uploaded_at',
            ]);

            $current->versions()->create(array_merge($previous, [
                'photo_id' => $current->id,
                'version_number' => 1,
                'uploaded_at' => now()->subDays(4),
            ]));

            $current->forceFill(['version_count' => 2])->save();
        }
    }

    if ($row['comment'] ?? false) {
        PhotoComment::query()->updateOrCreate(
            ['photo_id' => $ids[0], 'comment' => '¿Podemos rebajar un poco las sombras de la cara?'],
            ['x' => 0.46, 'y' => 0.34, 'annotated_version_number' => 1],
        );
    }

    $versioned = $gallery->photos()->where('version_count', '>', 1)->value('id');

    $state['galleries'][$row['name']] = [
        'id' => $gallery->id,
        'versioned_photo_id' => $versioned,
        'ulid' => $gallery->ulid,
        'slug' => $gallery->slug,
        'shared' => (bool) $gallery->is_shared,
        'share_url' => $gallery->is_shared ? route('shares.show', ['gallery' => $gallery, 'slug' => $gallery->slug]) : null,
    ];

    echo "✅ Galería: {$gallery->name} (".count($ids).' fotos)'."\n";
}

/* ---------------------------------------------------------------------------
 * 4. Photoshoots
 * ------------------------------------------------------------------------ */

$wedding = Gallery::query()->where('team_id', $team->id)->where('name', 'Boda de Lucía y Marc')->first();
$portrait = Gallery::query()->where('team_id', $team->id)->where('name', 'Retrato de estudio — Marta')->first();

foreach ([
    ['name' => 'Boda en El Escorial', 'customer' => 'Lucía Ferrer', 'gallery' => $wedding, 'price' => 245000],
    ['name' => 'Retrato de estudio', 'customer' => 'Marc Vidal', 'gallery' => $portrait, 'price' => 48000],
] as $row) {
    $customer = $customers[$row['customer']] ?? null;

    $photoshoot = Photoshoot::query()->updateOrCreate(
        ['team_id' => $team->id, 'name' => $row['name']],
        [
            'customer_id' => $customer?->id,
            'customer_name' => $customer?->name,
            'date' => now()->subWeeks(2),
            'location' => 'Estudio Norte, Madrid',
            'price' => $row['price'],
        ],
    );

    $row['gallery']?->forceFill(['photoshoot_id' => $photoshoot->id])->save();
}

echo "✅ Sesiones: 2\n";

/* ---------------------------------------------------------------------------
 * 5. Contract template + contracts
 * ------------------------------------------------------------------------ */

$body = <<<'MD'
# Contrato de reportaje

**Estudio:** Estudio Norte SL · B12345678
**Cliente:** Lucía Ferrer Gómez · 12345678Z

## Alcance

- Reportaje de 8 horas con dos fotógrafos.
- Entrega de 500 fotos editadas en una galería privada.
- Selección de 40 favoritas para retoque fino.

## Condiciones

El 30 % se abona a la firma y el resto dos semanas antes del enlace. Las fotos se
entregan en un plazo máximo de 30 días naturales.

## Derechos

El estudio conserva el derecho de usar una selección del reportaje en su
porfolio, salvo indicación contraria por escrito.
MD;

ContractTemplate::query()->updateOrCreate(
    ['team_id' => $team->id, 'title' => 'Contrato de boda'],
    ['markdown_body' => $body],
);

$draft = Contract::query()->updateOrCreate(
    ['team_id' => $team->id, 'title' => 'Boda de Lucía y Marc — contrato'],
    [
        'photoshoot_id' => $wedding?->photoshoot_id,
        'description' => 'Pendiente de firma',
        'location' => 'El Escorial, Madrid',
        'shooting_date' => now()->subWeeks(2),
        'markdown_body' => $body,
        'executed_at' => null,
    ],
);

$signed = Contract::query()->updateOrCreate(
    ['team_id' => $team->id, 'title' => 'Retrato de estudio — contrato'],
    [
        'photoshoot_id' => $portrait?->photoshoot_id,
        'description' => 'Firmado',
        'location' => 'Estudio Norte, Madrid',
        'shooting_date' => now()->subWeek(),
        'markdown_body' => $body,
        'executed_at' => now()->subWeeks(2),
    ],
);

// A contract needs its signature rows before it can look real: the list shows
// "signed/total", so an executed contract with 0/0 reads as broken.
foreach ([$draft, $signed] as $contract) {
    if ($contract->signatures()->count() === 0) {
        $contract->addSignatures(2);
    }
}

$signed->signatures()->update([
    'signed_at' => now()->subWeeks(2),
    'legal_name' => 'Marc Vidal Puig',
    'document_number' => '87654321X',
    'email' => 'marc@example.test',
]);

echo "✅ Contratos: 1 plantilla, 2 contratos (uno firmado)\n";

/* ---------------------------------------------------------------------------
 * 6. Invoice settings + invoices
 * ------------------------------------------------------------------------ */

InvoiceSetting::query()->updateOrCreate(
    ['team_id' => $team->id],
    array_merge(config('invoices.defaults'), [
        'legal_name' => 'Estudio Norte SL',
        'tax_id' => 'B12345678',
        'address' => 'Calle del Pez 12',
        'city' => 'Madrid',
        'state' => 'Madrid',
        'postal_code' => '28004',
        'country' => 'ES',
        'email' => 'hola@estudionorte.example',
        'phone' => '+34 910 000 000',
        'currency' => 'EUR',
        'vat_percent' => 21,
        'series' => 'F',
        'rectification_series' => 'R',
        'payment_terms' => 'Transferencia a 15 días',
        'notes' => 'Gracias por confiar en Estudio Norte.',
        'setup_completed_at' => now(),
    ]),
);

/** Shared snapshot so every demo invoice looks complete. */
$lineItems = [
    ['description' => 'Reportaje de boda — 8 horas', 'quantity' => 1, 'unit_price' => 2000, 'total' => 2000],
    ['description' => 'Álbum 30x30', 'quantity' => 1, 'unit_price' => 450, 'total' => 450],
];

$issuer = [
    'legal_name' => 'Estudio Norte SL',
    'tax_id' => 'B12345678',
    'address' => 'Calle del Pez 12',
    'city' => 'Madrid',
    'state' => 'Madrid',
    'postal_code' => '28004',
    'country' => 'ES',
    'email' => 'hola@estudionorte.example',
    'phone' => '+34 910 000 000',
];

$customer = $customers['Lucía Ferrer'];

$customerSnapshot = [
    'name' => $customer->name,
    'legal_name' => $customer->legal_name,
    'tax_id' => $customer->tax_id,
    'address' => $customer->address,
    'city' => $customer->city,
    'state' => $customer->state,
    'postal_code' => $customer->postal_code,
    'country' => $customer->country,
];

$invoiceBase = [
    'invoice_type' => Invoice::TYPE_FULL,
    'currency' => 'EUR',
    'customer_id' => $customer->id,
    'vat_percent' => 21,
    'subtotal' => 2450,
    'base_amount' => 2450,
    'vat_amount' => 514.5,
    'total' => 2964.5,
    'amount_due' => 2964.5,
    'invoice_data' => [
        'line_items' => $lineItems,
        'issuer' => $issuer,
        'customer' => $customerSnapshot,
    ],
];

$year = (int) now()->year;

$draft = Invoice::query()->updateOrCreate(
    ['team_id' => $team->id, 'series' => 'F', 'year' => $year, 'number' => 9001],
    array_merge($invoiceBase, [
        'status' => Invoice::STATUS_DRAFT,
        'issue_date' => now()->toDateString(),
        'issued_at' => null,
        'full_number' => null,
    ]),
);

// An issued invoice is immutable, so it is created once and then left alone.
$issued = Invoice::query()->firstOrCreate(
    ['team_id' => $team->id, 'series' => 'F', 'year' => $year, 'number' => 9002],
    array_merge($invoiceBase, [
        'status' => Invoice::STATUS_ISSUED,
        'issue_date' => now()->subDays(20)->toDateString(),
        'issued_at' => now()->subDays(20),
        'full_number' => "F-{$year}-9002",
        'public_token' => Str::random(40),
    ]),
);

echo "✅ Facturas: borrador y emitida ({$issued->full_number})\n";

$statePath = __DIR__.'/state.json';
file_put_contents($statePath, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

// A couple of completed payments: the Payments screen is an empty state without
// them, and the article talks about the list and the Stripe state.
Payment::query()->updateOrCreate(
    ['team_id' => $team->id, 'stripe_payment_intent_id' => 'pi_demo_0001'],
    [
        'amount' => 296450,
        'currency' => 'EUR',
        'description' => 'Boda de Lucía y Marc',
        'customer_email' => 'lucia@example.test',
        'completed_at' => now()->subDays(20),
    ],
);

Payment::query()->updateOrCreate(
    ['team_id' => $team->id, 'stripe_payment_intent_id' => 'pi_demo_0002'],
    [
        'amount' => 48000,
        'currency' => 'EUR',
        'description' => 'Retrato de estudio',
        'customer_email' => 'marc@example.test',
        'completed_at' => now()->subDays(6),
    ],
);

echo "✅ Pagos: 2 completados\n";

echo "\n🎉 Demo listo\n";
echo "   Login:   {$email} / {$password}\n";
echo "   Handle:  {$team->handle}\n";
echo '   Galerías: '.Gallery::query()->where('team_id', $team->id)->count()."\n";
echo '   Fotos:   '.Photo::query()->whereIn('gallery_id', Gallery::query()->where('team_id', $team->id)->pluck('id'))->count()."\n";
