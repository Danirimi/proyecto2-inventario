# Fase 7 — Checkpoint: Avance Semana 14

**Formato:** presentación corta en clase, máximo 10 minutos por grupo.
**Qué se evalúa:** control de progreso — no se espera un sistema terminado,
sí evidencia de trabajo sostenido (arquitectura revisada, app accesible,
estrategia de respaldo definida, riesgos identificados).

Este documento es el guion de la demo y el respaldo de lo que se muestra
en pantalla. Todo lo que aparece aquí ya está implementado y verificado
en la VM al momento de escribir esto (2026-08-24).

---

## Guion (≈10 minutos)

### 1. Arquitectura revisada — 2 min

Continuidad del caso del Proyecto 1 (empresa de logística), con la
restricción legal nueva: el motor de base de datos **no puede** ser un
servicio gestionado por el proveedor (protege el licenciamiento vigente
de la empresa) y debe correr en una VM bajo administración propia del
grupo.

Documento formal de arquitectura revisada (diagrama + tabla de cambios
+ justificación por disponibilidad/operación): entregado aparte, fuera
de este repositorio (ver `Proyecto2_kevin_Daniel_Samuel_Franklin.docx`).
Resumen para la demo — **Cuadro comparativo Proyecto 1 → Proyecto 2**:

| Característica | Propuesta Inicial (Proyecto 1) | Propuesta Actualizada (Proyecto 2) |
|---|---|---|
| Enfoque principal | Modernización y migración a PaaS para el frontend | Ejecución técnica completa, foco en base de datos IaaS y movilidad |
| Gestión de Base de Datos | No definida explícitamente | **IaaS** — MariaDB en VM propia, administrada por el grupo |
| Acceso móvil | No mencionado | Aplicación responsiva para inventario en ruta |
| Estrategia de respaldo | Enfoque en código fuente y estáticos | Respaldo formal de base de datos: script + prueba de restauración real |

**Responsabilidad compartida (modelo IaaS de la base de datos):**

| Capa | Base de datos en VM | Blob Storage (backups) |
|---|---|---|
| Aplicación y datos | Grupo | Grupo |
| Motor de BD y parches | **Grupo** | Microsoft Azure |
| Sistema operativo y parches | **Grupo** | Microsoft Azure |
| Virtualización, servidores físicos y red | Microsoft Azure | Microsoft Azure |

### 2. App desplegada y accesible — 3 min (demo en vivo)

- **URL pública:** http://52.162.223.117/inventario/ (y `https://` con
  certificado autofirmado — el navegador va a marcar advertencia,
  aceptar la excepción es lo esperado).
- **API:** http://52.162.223.117/api/articulos
- Demo en vivo: registrar un artículo desde el celular (datos móviles,
  no WiFi de la sala, para probar acceso real externo), consultarlo y
  actualizar su cantidad.
- Mostrar también la integración con la tienda del Proyecto 1
  (http://52.162.223.117/) — el catálogo se sirve en vivo desde la
  misma base de datos vía API (commit `024024c`), evidencia de que la
  base de datos administrada por el grupo ya sostiene dos frontends.
- Capturas de respaldo si el WiFi de la sala falla: ver
  `docs/evidencias/`.

### 3. Estrategia de respaldo — 3 min

- Script propio (`backup/backup_db.sh`): `mysqldump --single-transaction`
  con el usuario de aplicación (no root) → gzip → sube a Azure Blob
  Storage (cuenta `invbackupsgrp2`, contenedor privado `backups`).
- Disparado por **systemd timer** (`inventario-backup.timer`), no cron
  simple: corre diario a las 2:00 AM y además tiene `Persistent=true`
  (si la VM estuvo apagada a esa hora, corre apenas vuelve a encender —
  evita perder el respaldo del día silenciosamente).
- **RPO objetivo:** 24 h, justificado en `backup/README.md` (sistema de
  conteo de inventario, bajo volumen de escritura, recuperable con
  recuento manual ante una falla puntual).
- **RTO objetivo:** < 15 min. Ya **medido y documentado** en Fase 5:
  ~64 segundos reales (`docs/fase5-prueba-restauracion.md`).
- Evidencia de que corre solo, sin intervención manual: 9 backups
  consecutivos en el Blob entre el 17 y el 24 de agosto, incluida la
  corrida automática de esta misma noche.

### 4. Riesgos / bloqueos identificados para el cierre — 2 min

Honestos, para que quede registro de qué falta resolver antes de la
Entrega Final (Semana 15):

1. **Certificado HTTPS autofirmado** (no hay dominio propio, solo IP
   pública) → el navegador muestra advertencia de "no confiable" al
   entrar por `https://`. Es esperado, pero hay que explicarlo en la
   defensa para que no se confunda con un fallo real.
2. **Contraseña real de la base de datos estaba commiteada** en
   `app/.env.example` (repo público) — **ya corregido** en el cierre:
   se rotó la contraseña real en MariaDB, se actualizaron los `.env`
   reales (fuera de git) y se reemplazó el placeholder en
   `.env.example` por un valor genérico. Ver `docs/fase8-cierre-entrega-final.md`.
3. **Punto único de fallo de infraestructura:** app, Nginx y base de
   datos viven en la misma VM. Si la VM cae, cae todo el sistema a la
   vez (no solo la base de datos). Mitigado parcialmente por el
   respaldo automatizado (se puede reconstruir en otra VM), pero no
   hay alta disponibilidad activa — es una limitación conocida y
   aceptada del alcance del proyecto (una sola VM, créditos de
   estudiante).
4. **Contribución desigual en el historial de commits:** todo el
   código en `main` está firmado por Daniel y Kevin; las ramas
   `franklin` y `samuel` existen pero no tienen commits propios
   todavía. Riesgo para la Fase 8 (todos los integrantes deben poder
   explicar cualquier parte del sistema en la defensa individual) —
   requiere que el equipo se reparta explícitamente qué explica cada
   quien antes de la defensa, independientemente de quién escribió el
   código.

---

## Checklist antes de presentar

- [ ] Confirmar que `inventario-app.service` está `active (running)`
  (`systemctl status inventario-app`).
- [ ] Confirmar acceso a `http://52.162.223.117/inventario/` desde un
  teléfono con datos móviles (no WiFi de la sala) justo antes de entrar
  a exponer.
- [ ] Tener `docs/evidencias/` abierto como respaldo por si falla la
  demo en vivo.
- [ ] Repartir quién explica cada bloque (arquitectura / app y BD /
  respaldo y continuidad) entre los cuatro integrantes.
