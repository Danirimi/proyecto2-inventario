# Fase 8 — Cierre para Entrega Final

Semana 15 (24–30 de agosto de 2026). Este documento cubre los tres
puntos pendientes de la ruta de trabajo: verificación de estabilidad
(condición crítica), evidencias y confirmación final de URL/repo/reparto
de la defensa.

---

## 21. Verificación de estabilidad (condición crítica)

> "La aplicación debe estar en funcionamiento al momento de la defensa.
> Un despliegue caído se evalúa como no entregado."

Última verificación completa: **2026-08-24, 22:02 UTC**.

| Componente | Estado |
|---|---|
| `inventario-app.service` | `active (running)` |
| `mariadb.service` | `active` |
| `nginx` | `active` |
| `inventario-backup.timer` | `active (waiting)`, próxima corrida 2026-08-25 02:01 UTC, con `Persistent=true` |
| `http://<IP>/` (tienda, Proyecto 1) | `200` |
| `http://<IP>/inventario/` (app inventario) | `200` |
| `http://<IP>/api/articulos` | `200` |
| `http://<IP>/api/health` | `200` |
| `https://<IP>/` , `/inventario/`, `/api/articulos` | `200` (certificado autofirmado, advertencia esperada) |
| `ufw` | activo, política deny por defecto, solo 22/80/443 permitidos |
| Disco de la VM | 18G libres de 29G (37% uso) — sin riesgo de quedarse sin espacio |
| Último backup subido a Blob Storage | `inventario_db_20260824_220137.sql.gz`, 22:01 UTC (corrida manual de verificación de esta misma sesión, además de las 9 corridas automáticas previas del timer entre el 17 y el 24 de agosto) |

**Recomendación para el día de la defensa:** repetir esta misma
verificación (`systemctl status inventario-app`, y los 3 `curl` a las
rutas públicas) 10–15 minutos antes de exponer, y tener a mano el
teléfono con datos móviles como prueba en vivo de acceso externo.

### Corrección de seguridad aplicada en este cierre

El pendiente ya identificado por el equipo ("contraseña real
commiteada en `app/.env.example`, rotar antes de la Entrega Final")
se resolvió en esta sesión:

1. Se rotó la contraseña del usuario `inventario_app` directamente en
   MariaDB (`ALTER USER ... IDENTIFIED BY`).
2. Se actualizaron `app/.env` y `backup/.env` (fuera de git) con la
   nueva contraseña.
3. Se reinició `inventario-app.service` y se verificó `200` en
   `/inventario/` y `/api/articulos` con la nueva credencial.
4. Se corrió `backup/backup_db.sh` manualmente para confirmar que el
   script de respaldo también funciona con la credencial nueva —
   subió el blob correctamente.
5. Se reemplazó el valor real en `app/.env.example` (commiteado al
   repo público) por un placeholder genérico (`cambiar_por_password_real`).

No hubo downtime del servicio durante la rotación.

---

## 22. Evidencias

Carpeta `docs/evidencias/` (nueva, agregada en este cierre):

| Archivo | Qué demuestra |
|---|---|
| `desktop-inventario-app.png` | App de inventario cargando en escritorio contra la IP pública |
| `desktop-inventario-listado-completo.png` | Listado completo de artículos, datos reales servidos por la API |
| `desktop-tienda-catalogo.png` / `desktop-tienda-catalogo-productos.png` | Catálogo de la tienda (Proyecto 1) alimentado en vivo por la misma base de datos |
| `mobile-inventario-app.png` | App de inventario en viewport y user-agent de iPhone (390×844) |
| `mobile-tienda-catalogo.png` | Tienda en viewport móvil |

**Nota honesta sobre el origen de las capturas móviles:** se generaron
con Chromium en modo headless emulando viewport y user-agent de iPhone
(no son una foto tomada desde un teléfono físico). Cumplen para dejar
evidencia funcional del diseño responsivo, pero la consigna pide
específicamente "la aplicación funcionando en un dispositivo móvil" —
**antes de armar la carpeta final de evidencias para la entrega**, se
recomienda reemplazar o complementar estas dos capturas con una foto o
captura de pantalla real tomada desde un celular del equipo accediendo
a `http://52.162.223.117/inventario/` por datos móviles. Es rápido de
hacer y cierra el punto sin ambigüedad.

**Prueba de restauración:** ya documentada completa, con evidencia
paso a paso, tiempos y hallazgos, en `docs/fase5-prueba-restauracion.md`
(Fase 5, obligatoria por consigna). No se repite aquí — ese documento
ya cumple el requisito de "evidencia de que un respaldo fue
efectivamente restaurado y el sistema volvió a operar".

**Evidencia adicional de continuidad del respaldo automatizado** (no
existía al cerrar la Fase 5/6, se agrega ahora): histórico de blobs en
Azure Storage entre el 17 y el 24 de agosto —

```
inventario_db_20260817_190311.sql.gz  17-ago 19:03
inventario_db_20260818_205459.sql.gz  18-ago 20:54  (corrida manual, cierre Fase 5)
inventario_db_20260818_205754.sql.gz  18-ago 20:57
inventario_db_20260820_234533.sql.gz  20-ago 23:45  (timer, con catch-up)
inventario_db_20260821_005141.sql.gz  21-ago 00:51
inventario_db_20260821_020206.sql.gz  21-ago 02:02  (horario normal 2 AM)
inventario_db_20260822_020022.sql.gz  22-ago 02:00  (horario normal 2 AM)
inventario_db_20260823_020022.sql.gz  23-ago 02:00  (horario normal 2 AM)
inventario_db_20260824_204534.sql.gz  24-ago 20:45  (catch-up tras encendido de VM)
inventario_db_20260824_220137.sql.gz  24-ago 22:01  (verificación manual, cierre Fase 8)
```

Esto confirma en la práctica lo que la Fase 6 corrigió: el timer con
`Persistent=true` efectivamente dispara el backup con catch-up cuando
la VM estuvo apagada durante la ventana de las 2 AM (ver corridas del
20 y 24 de agosto fuera del horario exacto), en vez de perder el
respaldo del día en silencio como pasaba con el cron simple original.

---

## 23. URL final, repositorio y reparto de la defensa

- **URL de la aplicación (Entrega Final):** http://52.162.223.117/inventario/
  (HTTPS disponible en `https://52.162.223.117/inventario/`, con
  advertencia de certificado autofirmado esperada).
- **Repositorio:** https://github.com/Danirimi/proyecto2-inventario
- **Rama de referencia para evaluación:** `main` (las ramas `kevin`,
  `samuel` y `franklin` existen pero no tienen commits propios aún —
  ver punto siguiente).

### Punto abierto para resolver como equipo antes de la defensa

Todo el código en `main` está firmado por dos integrantes (Daniel y
Kevin); `franklin` y `samuel` no tienen commits propios en el repo.
La rúbrica es explícita: *"un estudiante que no logre explicar la
parte del sistema que dice haber construido no recibe la nota
grupal."* Esto es independiente de quién escribió el código en git —
lo que se evalúa en la defensa es el dominio individual del
funcionamiento del sistema. Se recomienda repartir **ahora**, antes de
la defensa, qué bloque explica cada integrante, y que cada quien lo
repase con el resto del equipo al menos una vez:

| Bloque sugerido | Contenido a dominar |
|---|---|
| Arquitectura y decisiones | Por qué IaaS para la base de datos, tabla de cambios vs. Proyecto 1, responsabilidad compartida |
| Aplicación y base de datos | Esquema de `articulos`, endpoints CRUD, cómo se conecta Express a MariaDB, por qué el usuario de la app no es root |
| Respaldo y restauración | Cómo funciona `backup_db.sh`, por qué systemd timer y no cron simple, cómo se hizo y qué demostró la prueba de restauración de Fase 5 |
| Seguridad y continuidad | HTTPS autofirmado, NSG/ufw, cifrado en reposo, RTO/RPO y su justificación de negocio |

Cualquier integrante debe poder responder, como mínimo, "¿qué pasa si
la VM se apaga ahora mismo y vuelve a encender en 3 horas?" (respuesta:
el timer corre el backup atrasado por `Persistent=true`, se pierde como
máximo el RPO de 24h de datos, y la restauración documentada en Fase 5
tarda ~64s).

### Checklist final de entrega (sección 5.2 de la consigna)

- [x] Aplicación desplegada y en funcionamiento (verificado arriba).
- [x] URL de la aplicación confirmada.
- [x] Enlace al repositorio confirmado.
- [x] Evidencia de prueba de restauración (`docs/fase5-prueba-restauracion.md`).
- [x] Capturas de la app funcionando (`docs/evidencias/`) — pendiente
      reemplazar las dos móviles por una foto real de celular (ver
      nota en la sección 22).
- [ ] Documento técnico en PDF con los puntos de la sección 4 —
      documentado en `Documentos/revision/Proyecto2_kevin_Daniel_Samuel_Franklin.docx`
      (arquitectura revisada) más este repositorio (`docs/`, `README.md`
      de cada carpeta) para 4.2 y 4.3; falta consolidar y exportar todo
      a un único PDF antes de subirlo a la entrega.
- [ ] Confirmar que los 4 integrantes repasaron su bloque de la defensa
      (ver tabla de reparto arriba).
