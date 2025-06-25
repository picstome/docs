# Instalación

## Guía sencilla de configuración para tu propio servidor

Esta guía te ayudará a instalar Picstome en tu propio servidor, incluso si no eres un experto técnico.

## Paso 1: Consigue un servidor (VPS)

Necesitas un servidor para alojar Picstome. Recomendamos [Contabo](https://www.dpbolvw.net/click-101387264-15239531) por su excelente relación calidad/precio.

1. Ve a [Contabo](https://www.dpbolvw.net/click-101387264-15239531) y regístrate
2. Selecciona **Storage VPS 1** (esto incluye 600GB SSD - perfecto para almacenar fotos)
3. Importante: Elige **Ubuntu 24.04** como tu sistema operativo
4. Completa tu compra

> 💡 **Proveedores alternativos**: DigitalOcean, Linode o Vultr también funcionan bien.

---

## Paso 2: Conecta tu dominio a tu servidor

Necesitarás un nombre de dominio que apunte a tu servidor.

1. **Encuentra la dirección IP de tu servidor**
   - Comprueba el correo de bienvenida de tu proveedor de hosting
   - La dirección IP se parece a `123.45.67.89`

2. **Apunta tu dominio a esta dirección IP**
   - Inicia sesión en tu proveedor de dominios (GoDaddy, Namecheap, etc.)
   - Busca la configuración DNS o la sección "Gestionar DNS"
   - Añade un **registro A** con estos ajustes:
     - **Host/Nombre**: Usa `@` para tu dominio principal o introduce `picstome` para un subdominio
     - **Apunta a/Valor**: La dirección IP de tu servidor
     - **TTL**: Usa el valor predeterminado o "1 hora"

> ⏱️ **Nota**: Los cambios en el DNS pueden tardar entre 15 minutos y algunas horas en funcionar.

---

## Paso 3: Conéctate a tu servidor

A continuación, necesitarás acceder a tu servidor para ejecutar la instalación.

### En Windows:
1. Descarga e instala [PuTTY](https://www.putty.org/)
2. Abre PuTTY e introduce:
   - **Nombre del host**: La dirección IP de tu servidor
   - **Puerto**: 22
   - **Tipo de conexión**: SSH
3. Haz clic en "Abrir" e introduce tus datos de acceso cuando se te solicite
   - **Nombre de usuario**: root
   - **Contraseña**: (la contraseña de tu proveedor de hosting)

### En Mac o Linux:
1. Abre la aplicación Terminal
2. Escribe: `ssh root@TU_IP_SERVIDOR` (reemplaza `TU_IP_SERVIDOR` con tu IP real)
3. Introduce tu contraseña cuando se te solicite

> 🔑 **Primer inicio de sesión**: Es posible que se te pida cambiar la contraseña. ¡Crea una contraseña fuerte y guárdala en un lugar seguro!

---

## Paso 4: Instala Picstome

Una vez conectado a tu servidor, la instalación es sencilla:

1. Copia y pega este comando exactamente como se muestra:
   ```bash
   curl -fsSL https://picstome.com/install.sh | bash
   ```

2. Cuando se te pregunte, escribe `y` para confirmar la instalación

3. Introduce tu nombre de dominio cuando se te solicite
   - Si estás usando un dominio principal, introduce: `tudominio.com`
   - Si estás usando un subdominio, introduce: `picstome.tudominio.com`

4. Espera a que se complete la instalación (unos 5-10 minutos)
   - El script instala automáticamente todo lo necesario
   - Configura la seguridad con HTTPS
   - Configura tu sitio para que funcione correctamente

> 🛑 **Importante**: ¡Asegúrate de que tu dominio apunta a la IP de tu servidor antes de ejecutar este paso!

---

## Paso 5: Inicia sesión en tu nuevo sitio Picstome

Una vez completada la instalación:

1. Abre tu navegador web y ve a tu dominio:
   ```
   https://tudominio.com
   ```

2. Inicia sesión con estas credenciales temporales:
   - **Email**: `admin@example.com`
   - **Contraseña**: `picstome`

3. Cambia tu contraseña **inmediatamente**:
   - Ve a Ajustes → Perfil
   - Crea una contraseña fuerte

> 🎉 ¡Enhorabuena! ¡Tu sitio Picstome ya está listo para usar!

---

## Solución de problemas

### ¿Aún no puedes ver tu sitio?
- **Propagación DNS**: Puede tardar unas horas para que tu dominio se conecte a tu servidor. Inténtalo de nuevo más tarde.
- **Comprueba el dominio**: Asegúrate de que has escrito el dominio exactamente como está configurado en los ajustes DNS.

### ¿Errores de instalación?
- Asegúrate de que tu servidor está ejecutando Ubuntu 24.04
- Comprueba que tu dominio apunta correctamente a la dirección IP de tu servidor
- Asegúrate de que tienes los permisos correctos (deberías haber iniciado sesión como root)

### ¿Necesitas más ayuda?
- Visita nuestra [documentación](https://picstome.com/docs)
