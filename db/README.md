# Base de datos — Fase 1

Motor: **MariaDB 10.11** (Ubuntu 24.04 LTS), instalado y administrado
por el grupo sobre la misma VM donde corren la app y Nginx (requisito
de la consigna: sin servicio de base de datos gestionado por el
proveedor).

## 1. Instalación

```bash
sudo apt update
sudo apt install -y mariadb-server
sudo systemctl enable --now mariadb
```

## 2. Aseguramiento

```bash
sudo mysql_secure_installation
```

Configuración aplicada:

- Autenticación de `root` vía `unix_socket` (no hay password de root
  expuesta; solo se puede administrar con `sudo mysql` desde dentro de
  la propia VM).
- Usuarios anónimos eliminados.
- Login remoto de `root` deshabilitado.
- Base `test` eliminada.

`bind-address` en `/etc/mysql/mariadb.conf.d/50-server.cnf` queda en
`127.0.0.1` por configuración por defecto de Ubuntu — se verificó
explícitamente que el motor solo escucha en localhost, ya que la app
corre en la misma VM y no necesita exponer el puerto 3306 a la red.

## 3. Usuario dedicado de la aplicación

Se creó un usuario separado de `root`, con privilegios mínimos, para
que lo use exclusivamente la app Node/Express:

```sql
CREATE USER 'inventario_app'@'localhost' IDENTIFIED BY '<password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON inventario_db.* TO 'inventario_app'@'localhost';
FLUSH PRIVILEGES;
```

- Solo puede conectarse desde `localhost` (no hay acceso remoto).
- Solo tiene privilegios de `SELECT, INSERT, UPDATE, DELETE` sobre
  `inventario_db` — **no** tiene `CREATE`, `DROP`, `GRANT` ni acceso a
  otras bases. La creación/modificación del esquema queda reservada a
  `root` (administración), no a la app.
- La contraseña real **no se sube al repo**; se define como variable
  de entorno en la VM donde corre la app (`.env`, fuera de control de
  versiones), a cargo de quien trabaje la Fase 2.

## 4. Esquema

Ver [`schema.sql`](./schema.sql). Tabla única `articulos` con el
mínimo pedido por la consigna (`id`, `nombre`, `cantidad`,
`ubicacion`/`estado`, timestamps):

| Campo        | Tipo                                                             | Notas                                   |
|--------------|-------------------------------------------------------------------|------------------------------------------|
| `id`         | `INT AUTO_INCREMENT`                                             | Clave primaria                            |
| `nombre`     | `VARCHAR(150)`                                                    | Obligatorio                               |
| `cantidad`   | `INT`                                                             | Default `0`                               |
| `ubicacion`  | `VARCHAR(100)`                                                    | Texto libre (bodega, camión, etc.)        |
| `estado`     | `ENUM('disponible','reservado','agotado','en_transito')`         | Default `disponible`                      |
| `created_at` | `TIMESTAMP`                                                       | Se define solo al insertar                |
| `updated_at` | `TIMESTAMP`                                                       | Se actualiza solo en cada `UPDATE`        |

## Para cargar el esquema en una VM nueva

```bash
sudo mysql < db/schema.sql
```

## Pendiente (fuera de la Fase 1)

- Conexión desde la app vía variables de entorno (Fase 2, a cargo de
  otro integrante).
- Respaldo automatizado hacia Azure Blob Storage (Fase 4).