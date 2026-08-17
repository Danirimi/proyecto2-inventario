# Despliegue — Fase 3

Cómo la app de inventario queda corriendo de forma persistente detrás
de Nginx, en la misma VM donde ya vive `Pagina_Proyecto` (Proyecto 1).

## 1. Servicio persistente (systemd)

Se eligió **systemd** en lugar de pm2: viene con Ubuntu (sin dependencia
global adicional), arranca solo en cada reboot de la VM y es coherente
con el enfoque de "administración propia del motor" que exige la
consigna del proyecto.

Archivo: [`inventario-app.service`](./inventario-app.service), instalado en
`/etc/systemd/system/inventario-app.service`.

```bash
sudo cp deploy/inventario-app.service /etc/systemd/system/inventario-app.service
sudo systemctl daemon-reload
sudo systemctl enable --now inventario-app
sudo systemctl status inventario-app
```

Notas:

- Corre como el usuario `UTNti` (no root), lee credenciales desde
  `app/.env` (fuera de git).
- `Restart=on-failure` — si el proceso muere, systemd lo reinicia.
- `After=/Requires=mariadb.service` — no intenta arrancar antes de que
  la base de datos esté lista.
- Endurecido con `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=full`.

## 2. Nginx como reverse proxy

La VM ya servía `Pagina_Proyecto` (Proyecto 1) como `default_server`
en el puerto 80. En vez de pelear por el puerto 80 o abrir uno nuevo,
se agregaron **subrutas** al mismo `server{}` existente
(`/etc/nginx/sites-available/default`), sin tocar el comportamiento de
`/`:

- `http://<IP>/` → sigue siendo Proyecto 1, sin cambios.
- `http://<IP>/inventario/` → frontend de la app de inventario
  (proxy a `127.0.0.1:3000/`).
- `http://<IP>/api/...` → API REST del CRUD (proxy a
  `127.0.0.1:3000/api/...`), usada por el frontend vía `fetch`.

Config completa de referencia: [`nginx-default.conf`](./nginx-default.conf)
(copia de la que quedó activa en `/etc/nginx/sites-available/default`).

```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak.$(date +%Y%m%d%H%M%S)
sudo cp deploy/nginx-default.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx
```

Se probó que ambos sitios responden correctamente en paralelo:
`/`, `/inventario/`, `/inventario/css/style.css` y `/api/health` /
`/api/articulos` devuelven 200 con el contenido esperado.

## 3. Acceso por IP pública y desde móvil (pendiente de confirmar en equipo)

- IP pública de la VM: `52.162.223.117`
- URL de la app: `http://52.162.223.117/inventario/`
- Health check: `http://52.162.223.117/api/health`

Se verificó acceso a la IP pública **desde dentro de la misma VM**
(200 OK en las tres rutas), pero esa prueba no reemplaza la real: falta
confirmar acceso desde un dispositivo externo (teléfono, datos
móviles) antes de dar la Fase 3 por cerrada.

## Pendiente (fuera de esta fase)

- HTTPS (Fase 6).
- Dominio propio vs IP pública desnuda (pendiente abierto del proyecto).
