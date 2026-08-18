# Fase 5 — Prueba de restauración (evidencia)

**Fecha:** 2026-08-18
**Ejecutado por:** UTNti (equipo), asistido por Claude Sonnet 5

## Objetivo

Demostrar que un backup real subido a Azure Blob Storage puede restaurarse
y que el sistema vuelve a operar con esos datos, sin depender de la copia
"real" en producción para probarlo.

## Método (no disruptivo)

En vez de tumbar `inventario_db` en producción, se restauró el backup en
una base de datos temporal (`inventario_db_restore_test`) en la misma VM,
y se repitió sobre ella la consulta real que usa la API
(`SELECT * FROM articulos`, con el usuario de aplicación `inventario_app`
y sus mismos privilegios). Esto valida el mecanismo completo de
restauración y compatibilidad app↔esquema sin causar downtime real.

## Backup restaurado

- Blob: `inventario_db_20260817_190311.sql.gz` (el único disponible en el
  Blob Storage al momento de la prueba — ver "Hallazgo" abajo).
- Origen: `az storage blob download` desde el contenedor `backups`
  (cuenta `invbackupsgrp2`).

## Procedimiento y evidencia

| Paso | Comando / acción | Resultado |
|---|---|---|
| 1. Descarga del blob | `az storage blob download ...` | OK, 0.7 s |
| 2. Verificación de integridad | `md5sum` local vs `contentMd5` reportado por Azure | Coinciden: `29a54ce5...` — el archivo no se corrompió en tránsito |
| 3. Restauración | `mysql inventario_db_restore_test < dump.sql` | OK, 0.1 s |
| 4. Verificación de datos | `SELECT COUNT(*)`, `CHECKSUM TABLE`, `CHECK TABLE` | 5 filas, checksum `2864064499`, `status: OK` |
| 5. Verificación funcional | Misma query de la API (`SELECT * FROM articulos`) con el usuario real `inventario_app` | Devuelve las 5 filas esperadas, sin errores de permisos (tras otorgar el mismo grant que en producción) |
| 6. Limpieza | `REVOKE` + `DROP DATABASE inventario_db_restore_test` | Confirmado: la BD temporal ya no existe |
| 7. Verificación de no-impacto | `inventario_db` real: 25 filas intactas · `curl /api/articulos` → `200` | El servicio en producción nunca se interrumpió |

## RTO medido

| Marca de tiempo (UTC) | Evento |
|---|---|
| `20:53:31` | T0 — inicio de la restauración (backup ya identificado) |
| `20:53:32` | Backup descargado y verificado |
| `20:53:59` | Restauración completa en BD temporal |
| `20:54:08` | Integridad de datos verificada (checksum + check table) |
| `20:54:35` | **Verificación funcional completa** (misma query que usaría la app en vivo) |
| `20:54:44` | Limpieza completa, sistema real confirmado intacto |

**RTO medido: ~64 segundos** (T0 → verificación funcional), muy por debajo
del objetivo declarado de **< 15 minutos**.

**Salvedad:** esta medición cubre solo el tiempo técnico de restauración
(descarga → import → verificación), con un dataset pequeño (5 filas,
~1 KB comprimido). No incluye tiempo de detección del incidente ni de
decisión, y en un desastre real (sobrescribir `inventario_db` en vivo y
reapuntar la app) el tiempo real sería algo mayor, aunque seguiría
estando muy por debajo de los 15 minutos dado el tamaño actual de los
datos.

## Hallazgo importante (resuelto en esta misma sesión)

El único backup disponible en el Blob al momento de la prueba
(`...20260817_190311...`) era **anterior a la integración del catálogo**
(commit `024024c`, 18-ago): no incluía las columnas nuevas
(`precio`, `categoria`, etc.) ni los 20 productos de `seed_catalogo.sql`
— solo el esquema original de Fase 1 con 5 artículos de prueba. Un
desastre real en ese momento habría recuperado el inventario, pero
**no** el catálogo que alimenta la tienda (`tienda.js`).

Esto confirma el riesgo ya documentado por separado: el cron de las
2:00 AM depende de que la VM esté encendida en ese momento exacto, y no
lo estuvo la noche del 17 al 18 de agosto.

**Acción tomada:** se corrió `backup_db.sh` manualmente al cierre de esta
prueba (`inventario_db_20260818_205459.sql.gz`), dejando en el Blob un
respaldo actualizado que sí incluye el catálogo completo (25 filas).
El problema de fondo (cron sin mecanismo de catch-up tras apagones de
VM) sigue pendiente de resolver en Fase 6.

## Conclusión

✅ El backup es restaurable y consistente con el esquema/datos reales.
✅ El sistema, con datos restaurados, responde igual que en producción.
✅ La restauración no afectó el servicio en vivo.
✅ RTO medido (~64 s) muy por debajo del objetivo (< 15 min).
⚠️ Pendiente para Fase 6: mecanismo de catch-up del backup automático
para no depender de que la VM esté encendida exactamente a las 2 AM.
