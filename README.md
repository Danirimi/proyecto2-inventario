# Proyecto 2 — Sistema de Inventario en la Nube

ITI-522 · Computación en la Nube · II Ciclo 2026 · Grupo 2

Implementación y operación de una solución de inventario para la empresa de logística (continuación del Proyecto 1), desplegada en Azure.

## Estructura

- `app/` — Aplicación web (Node.js + Express) de gestión de inventario.
- `db/` — Esquema y scripts de la base de datos (MySQL/MariaDB).
- `backup/` — Scripts de respaldo automatizado hacia Azure Blob Storage y procedimiento de restauración.
- `docs/` — Evidencias (capturas de restauración, app en móvil, etc.). La documentación técnica formal (arquitectura, justificaciones) vive fuera de este repo.

## Stack

- **Nube:** Azure (VM única para app, Nginx y base de datos)
- **Backend:** Node.js + Express
- **Base de datos:** MySQL/MariaDB (instalada y administrada por el grupo, no gestionada por el proveedor)
- **Servidor web:** Nginx (reverse proxy)

## Flujo de trabajo

Cada integrante trabaja en su propia rama y abre Pull Request hacia `main`.
