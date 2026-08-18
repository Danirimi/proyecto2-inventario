# Fase 6 — Continuidad y seguridad

**Fecha:** 2026-08-18

## 1. RTO / RPO (formalizados)

| Métrica | Objetivo | Medido / evidencia |
|---|---|---|
| **RPO** (pérdida máxima de datos tolerable) | 24 horas | Backup diario vía `inventario-backup.timer` (2:00 AM). Justificación de negocio en `backup/README.md`: bajo volumen de escritura, recuperable con recuento manual ante una falla. |
| **RTO** (tiempo de recuperación) | < 15 minutos | **~64 segundos medidos** en la prueba real de restauración (ver `docs/fase5-prueba-restauracion.md`): descarga del blob → restauración → verificación funcional con la query real de la API. |

### Corrección de fiabilidad del RPO (encontrada y resuelta en esta fase)

El cron original (`0 2 * * *`) dependía de que la VM estuviera encendida
exactamente a las 2:00 AM. Se confirmó que la noche del 17 al 18 de
agosto la VM estuvo apagada en esa ventana y el backup **no corrió**,
sin que nada lo notificara. Esto invalidaba el RPO de 24h de forma
silenciosa.

**Solución aplicada:** se reemplazó el cron por un timer de systemd
(`inventario-backup.timer` + `inventario-backup.service`, en `deploy/`)
con `Persistent=true`. Si la VM está apagada en el horario programado,
el backup se dispara automáticamente apenas la VM vuelve a encender,
en vez de esperar silenciosamente al día siguiente. Probado
manualmente disparando el servicio — corre y sube el blob
correctamente (ver `backup/backup.log`).

## 2. HTTPS

- No hay dominio propio (solo IP pública `52.162.223.117`), por lo que
  Let's Encrypt/certbot no aplica directamente. Se generó un
  **certificado autofirmado** (`openssl x509`, RSA 2048, válido 1 año,
  SAN con la IP pública + localhost) en `/etc/nginx/ssl/`.
- Nginx amplía a un segundo `server{}` en el puerto 443 con las mismas
  rutas que el puerto 80 (`/`, `/inventario/`, `/api/`), usando ese
  certificado. El puerto 80 se dejó activo (no se forzó redirect) para
  no interrumpir accesos existentes durante el curso.
- Regla `Allow-HTTPS-443` agregada al NSG (`server1-nsg`), prioridad
  110, igual que la de HTTP.
- Verificado: `https://localhost/`, `/inventario/` y `/api/articulos`
  responden `200` (con `-k` porque el certificado es autofirmado, así
  que el navegador mostrará advertencia — esperado y documentado, no
  es un error).

**Nota para la demo:** al entrar por HTTPS desde el navegador va a
salir la advertencia de "certificado no confiable" (normal en
autofirmados sin CA reconocida) — hay que aceptar la excepción para
continuar. Si en algún momento se consigue un dominio propio, se
puede reemplazar por un certificado real de Let's Encrypt sin tocar
la configuración de `location`.

## 3. Cifrado en reposo

- **Disco de la VM:** ya viene cifrado por defecto por la plataforma
  Azure (`EncryptionAtRestWithPlatformKey`, verificado con
  `az disk list`). No requirió configuración adicional — es el
  comportamiento estándar de los managed disks de Azure.
- **Credenciales sensibles:** `backup/.env` y `app/.env` con permisos
  `600` (solo el usuario `UTNti`), fuera de control de versiones.
- **Blob Storage:** `server_encrypted: true` confirmado en la
  respuesta de Azure al subir cada backup — cifrado en reposo también
  del lado del storage account.
- No se configuró cifrado adicional a nivel de motor (InnoDB
  tablespace encryption): se consideró redundante dado que el disco
  completo ya está cifrado por la plataforma, y fuera del alcance
  razonable para este proyecto.

## 4. Firewall / NSG

**Antes:**
- NSG: solo 22 (SSH) y 80 (HTTP) permitidos.
- `ufw` local: activo pero con política `allow` por defecto en
  entrada — solo bloqueaba el puerto 8080 puntualmente, sin aportar
  una capa real de defensa.

**Después:**
- NSG: se agregó `Allow-HTTPS-443` (ver sección 2). Perímetro final:
  22, 80, 443 — nada más expuesto públicamente.
- `ufw`: se cambió a **`deny` por defecto en entrada**, con permisos
  explícitos para 22/80/443 (y se mantiene el `deny` explícito de
  8080). Verificado que SSH y los servicios web siguieron respondiendo
  después del cambio — no hubo interrupción.

## Resumen de archivos agregados/modificados en esta fase

- `deploy/inventario-backup.service`, `deploy/inventario-backup.timer` (nuevo)
- `/etc/nginx/sites-available/default` (bloque HTTPS agregado; backup del original en `default.bak.*`)
- `/etc/nginx/ssl/inventario-selfsigned.{crt,key}` (fuera del repo — son artefactos de la VM, no de código)
- NSG `server1-nsg`: regla `Allow-HTTPS-443`
- `ufw`: política por defecto + reglas 22/80/443
