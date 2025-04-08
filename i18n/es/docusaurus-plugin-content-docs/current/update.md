# Actualizar

Esta guía te guiará a través del proceso de actualización de tu instalación de Picstome a la versión más reciente.

## Método de Actualización Automática

Hemos creado un script de actualización simple que gestiona todo el proceso automáticamente. Esta es la forma más sencilla y fiable de actualizar Picstome.

### Paso 1: Conectar a Tu Servidor

Primero, conecta a tu servidor vía SSH:

### En Windows:
1. Abre PuTTY
2. Introduce la dirección IP de tu servidor
3. Haz clic en "Open" e introduce tus datos de acceso cuando se te solicite:
   - **Usuario**: root
   - **Contraseña**: (tu contraseña del servidor)

### En Mac o Linux:
1. Abre Terminal
2. Escribe: `ssh root@TU_IP_SERVIDOR` (reemplaza `TU_IP_SERVIDOR` con tu IP real)
3. Introduce tu contraseña cuando se te solicite

### Paso 2: Ejecutar el Script de Actualización

Una vez conectado a tu servidor, ejecuta el siguiente comando:

```bash
curl -fsSL https://picstome.com/update.sh | sh
```

Este script:
- Descargará el código más reciente de nuestro repositorio
- Actualizará todas las dependencias
- Ejecutará migraciones de base de datos
- Reconstruirá los assets
- Actualizará los permisos
- Reiniciará los servicios necesarios

### Paso 3: Verificar la Actualización

Después de que la actualización se complete, visita tu sitio web de Picstome para verificar que todo funciona correctamente.


## Solución de Problemas de Actualización

Si encuentras algún problema durante el proceso de actualización:

1. **Revisa los logs**: La mayoría de los errores se registrarán en el archivo de log de Laravel:
   ```bash
   tail -n 100 /var/www/picstome/storage/logs/laravel.log
   ```

2. **Errores de base de datos**: Si encuentras errores de migración de base de datos, prueba:
   ```bash
   php artisan migrate:status
   ```

3. **Problemas de permisos**: Si estás viendo errores de permisos, ejecuta:
   ```bash
   chown -R www-data:www-data /var/www/picstome
   chmod -R 775 /var/www/picstome/storage /var/www/picstome/bootstrap/cache
   ```

4. **Comprueba conflictos**: Si has realizado cambios locales, es posible que necesites resolver conflictos de git:
   ```bash
   git status
   ```

## Obtener Ayuda

Si continúas experimentando problemas con el proceso de actualización:

1. Visita nuestro [repositorio de GitHub](https://github.com/picstome/picstome/issues) para informar del problema
2. Consulta nuestra [documentación](https://picstome.com/docs) para más información
3. Revisa nuestras [opciones de soporte](./support.md) para asistencia adicional

Recuerda incluir cualquier mensaje de error y detalles sobre tu entorno cuando solicites ayuda.
