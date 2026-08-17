# Respaldo automatizado — Fase 4

Estrategia de respaldo de `inventario_db` hacia **Azure Blob Storage**,
implementada con un script propio (no un servicio gestionado de backup),
en línea con la restricción del proyecto de administrar el motor de
base de datos por cuenta del grupo.

## 1. Recursos de Azure

| Recurso | Valor |
|---|---|
| Suscripción | Azure for Students (créditos del grupo) |
| Resource group | `Server1_group` (el mismo de la VM `server1`) |
| Región | `northcentralus` (misma región que la VM — sin costo/latencia de egress al subir) |
| Storage Account | `invbackupsgrp2` |
| Redundancia | `Standard_LRS` (3 copias dentro del mismo datacenter; la opción más económica, suficiente para el alcance de un proyecto estudiantil) |
| Access tier | `Cool` (más barato para datos que se escriben seguido y se leen poco, como un backup) |
| Contenedor Blob | `backups` — **privado**, sin acceso público |

## 2. Script (`backup_db.sh`)

1. Vuelca `inventario_db` con `mysqldump --single-transaction` (snapshot
   consistente en InnoDB, sin bloquear tablas ni requerir privilegio de
   `LOCK TABLES` — corre con el mismo usuario `inventario_app` de la
   Fase 1, no con `root`).
2. Comprime el volcado (`gzip`).
3. Sube el archivo al contenedor `backups` autenticando con la **clave
   de cuenta** del Storage Account (no con el login interactivo de
   `az`, que expira — necesario para que corra desapercibido por cron).
4. Poda localmente los volcados de más de 7 días (el respaldo "real"
   vive en Blob Storage, fuera de la VM; la copia local es solo caché
   de corto plazo).
5. Registra cada corrida en `backup.log`.

Credenciales (usuario de DB y clave de Azure) en `.env` en esta misma
carpeta — **no se sube al repo** (ver `.gitignore`), con permisos
`600` (solo lectura/escritura para el usuario `UTNti`).

## 3. Frecuencia: diaria, 2:00 AM

Programado por cron (`crontab -l`):
```
0 2 * * * /home/UTNti/proyecto2-inventario/backup/backup_db.sh >> /home/UTNti/proyecto2-inventario/backup/cron.log 2>&1
```

**Justificación (impacto en el negocio):**

- El sistema es de **conteo de inventario** (altas, bajas, cambios de
  estado/ubicación de artículos), no un sistema transaccional
  financiero de alto volumen. Perder como máximo 24 h de movimientos
  ante una falla es recuperable con un recuento manual rápido en
  bodega — no representa una pérdida crítica para la operación.
- El volumen de escrituras es bajo (los transportistas actualizan
  puntualmente, no hay un flujo constante de transacciones), así que
  un respaldo diario ya captura la enorme mayoría de los cambios
  reales del día.
- Se eligió la franja de **2:00 AM** por ser una ventana de uso
  mínimo (fuera del horario laboral de los transportistas), para no
  competir con tráfico real de la app.
- Es un punto de partida ajustable: si en la Fase 6 (RTO/RPO) se
  determina que el negocio no tolera perder más de unas pocas horas
  de datos, la frecuencia sube a cada 6–12 h cambiando una sola línea
  de cron (`0 */6 * * *`, por ejemplo), sin tocar el script.

## 4. Prueba realizada

Se corrió el script manualmente y se verificó el blob subido:

```
$ az storage blob list --account-name invbackupsgrp2 --container-name backups --auth-mode key --account-key "<clave>"
Name                                   Blob Type  Blob Tier  Length  Content Type      Last Modified
inventario_db_20260817_190311.sql.gz   BlockBlob  Cool       1117    application/sql   2026-08-17T19:03:11+00:00
```

## Pendiente (fuera de esta fase)

- Prueba de restauración real desde el Blob (Fase 5, obligatoria).
- RTO/RPO formalmente declarados y justificados (Fase 6).
