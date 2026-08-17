#!/bin/bash
### ==============================================================
### backup_db.sh — Respaldo automatizado de inventario_db
### Fase 4, Proyecto 2 (ITI-522): mysqldump -> Azure Blob Storage
### ==============================================================
### Pensado para correr por cron como el usuario UTNti. Lee las
### credenciales (DB y Azure) desde .env en esta misma carpeta,
### que NUNCA se sube al repo (ver .gitignore).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
LOG_FILE="$SCRIPT_DIR/backup.log"

log() {
    echo "[$(date '+%F %T')] $1" | tee -a "$LOG_FILE"
}

if [ ! -f "$ENV_FILE" ]; then
    log "ERROR: no se encontró $ENV_FILE"
    exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

TS="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$SCRIPT_DIR/inventario_db_${TS}.sql"
DUMP_GZ="${DUMP_FILE}.gz"

log "Iniciando backup de ${DB_NAME}..."

# MYSQL_PWD en vez de -p en la línea de comando: evita que la
# contraseña quede visible en 'ps aux' mientras corre mysqldump.
export MYSQL_PWD="$DB_PASSWORD"
mysqldump \
    -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
    --single-transaction --routines --triggers \
    "$DB_NAME" > "$DUMP_FILE"
unset MYSQL_PWD

gzip "$DUMP_FILE"
log "Volcado creado: $(basename "$DUMP_GZ") ($(du -h "$DUMP_GZ" | cut -f1))"

if az storage blob upload \
    --account-name "$AZURE_STORAGE_ACCOUNT" \
    --account-key "$AZURE_STORAGE_KEY" \
    --container-name "$AZURE_CONTAINER" \
    --name "$(basename "$DUMP_GZ")" \
    --file "$DUMP_GZ" \
    --overwrite false >> "$LOG_FILE" 2>&1; then
    log "Subido a Azure Blob Storage: $AZURE_CONTAINER/$(basename "$DUMP_GZ")"
else
    log "ERROR al subir $(basename "$DUMP_GZ") a Azure Blob Storage"
    exit 1
fi

# Retención local: el respaldo "real" vive en Blob Storage (fuera de
# la VM). La copia local solo sirve de caché de corto plazo, así que
# se podan los volcados de más de 7 días para no llenar el disco.
find "$SCRIPT_DIR" -maxdepth 1 -name "inventario_db_*.sql.gz" -mtime +7 -delete

log "Backup completo."
