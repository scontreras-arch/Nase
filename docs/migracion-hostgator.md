# Migración de Cloudflare a HostGator

Guía paso a paso para dejar de depender de Cloudflare y servir todo el sitio de
NASE Agrotech —páginas, catálogo, panel de inventario y panel de bodega— desde
el hosting contratado en HostGator.

Todo lo necesario está en `site/hostgator/`. Esta guía es el orden en que hay
que usarlo.

---

## Qué hay hoy en Cloudflare

| Pieza | Dónde vive | Qué hace |
|---|---|---|
| Worker `curly-feather-8a3c` | Cloudflare Workers | Sirve el sitio y responde `/api/*` |
| Base D1 `nase-inventario` | Cloudflare D1 (SQLite) | 28 productos, textos publicados, pedidos, ventas |
| DNS de `naseagrotech.cl` | Cloudflare (`bryce`/`nadia.ns.cloudflare.com`) | Apunta el dominio y filtra el tráfico |

El sitio no es estático del todo: `site.js` pide `/api/config` y `/api/imagenes`
en cada visita —de ahí salen los textos publicados, incluidas las correcciones
C1–C13—, la tienda pide `/api/vitrina` y el carrito envía a `/api/pedidos`. Por
eso la migración incluye portar la API, no solo copiar archivos.

## Qué queda después

| Pieza | Dónde vive | Equivalente |
|---|---|---|
| Sitio + API | `public_html/` en HostGator, Apache + PHP 8 | Worker |
| Base de datos | MySQL en cPanel | D1 |
| Clave de administración | `~/nase-config.php`, fuera de public_html | secret `ADMIN_TOKEN` |
| DNS | HostGator (o cualquier DNS que no sea Cloudflare) | Cloudflare DNS |

---

## Paso 1 · Revisar qué plan hay contratado

Entrar a cPanel (HostGator → «Hosting» → «Administrar»/cPanel) y confirmar:

- [ ] **Es un plan con cPanel.** Si lo contratado fuera el *Creador de sitios
      web* de HostGator, no sirve: no permite subir PHP propio ni crear bases
      MySQL. Habría que cambiar a un plan de Hosting Web.
- [ ] **PHP 8.0 o superior.** cPanel → *MultiPHP Manager* → elegir 8.1 o 8.2
      para el dominio. La API avisa con un mensaje claro si encuentra PHP 7.
- [ ] **MySQL disponible.** cPanel → *Bases de datos MySQL®*.
- [ ] **Espacio en disco:** el sitio ocupa unos 80 MB (267 imágenes y un PDF),
      más lo que pese la base. Cualquier plan pago sobra.
- [ ] **El dominio `naseagrotech.cl` figura** como dominio principal o como
      dominio adicional (*Addon Domain*), y se sabe qué carpeta usa
      (normalmente `public_html`).

Anotar también el **usuario de cPanel** y la **IP del servidor** (aparecen en la
barra lateral derecha de cPanel, «Información general»). Ambos se necesitan más
adelante.

---

## Paso 2 · Crear la base de datos

cPanel → **Bases de datos MySQL®**:

1. Crear una base: por ejemplo `nase`. cPanel le antepone el usuario, quedando
   algo como `usuario_nase`.
2. Crear un usuario MySQL con una contraseña larga y generada al azar.
3. En «Agregar usuario a la base de datos», asignarlo con **TODOS LOS
   PRIVILEGIOS**.

Anotar los tres datos: nombre de la base, usuario y contraseña.

---

## Paso 3 · Crear las tablas

cPanel → **phpMyAdmin** → seleccionar la base → pestaña **Importar** → subir:

```
site/hostgator/sql/01-esquema.sql
```

Al terminar deben aparecer nueve tablas: `productos`, `movimientos`, `imagenes`,
`config`, `pedidos`, `ventas`, `venta_items`, `conteos` y `conteo_items`.

---

## Paso 4 · Traer los datos desde D1

Este es el **único paso que todavía necesita Cloudflare**. Desde el computador,
con Node instalado y dentro del repositorio:

```bash
npx wrangler login                       # abre el navegador para iniciar sesión
cd site/hostgator/migracion
./exportar-d1.sh                         # deja un JSON por tabla en ./export-d1
php d1-a-mysql.php ./export-d1 ../sql/03-datos.sql
```

Después, en phpMyAdmin → **Importar** → `03-datos.sql`.

Notas:

- `03-datos.sql` contiene datos reales (nombres y teléfonos de pedidos) y por eso
  está excluido del repositorio en `.gitignore`. No subirlo a GitHub.
- Si el archivo supera el límite de subida de phpMyAdmin (suelen ser 50 MB, y
  las imágenes guardadas en base64 abultan), comprimirlo en `.zip` —phpMyAdmin
  acepta comprimidos— o importarlo por SSH con
  `mysql -u USUARIO -p BASE < 03-datos.sql`.
- **Si no hay acceso a la cuenta de Cloudflare**, se puede migrar igual:
  importar `sql/02-config-inicial.sql`, que trae los 52 textos publicados
  (las correcciones C1–C13 incluidas) reconstruidos desde el respaldo
  `site/worker/config-publicada-2026-08-21.json`, y volver a cargar los 28
  productos desde el panel de inventario. El sitio se ve correcto igual; lo que
  se pierde es el historial de pedidos y ventas.

---

## Paso 5 · Subir el sitio

Desde el repositorio:

```bash
./site/hostgator/empaquetar.sh
```

Deja `site/hostgator/nase-public_html-AAAAMMDD.zip` (unos 80 MB) con el sitio,
la API y el `.htaccess` ya ordenados.

cPanel → **Administrador de archivos** → entrar a `public_html` → **Cargar** el
ZIP → volver, seleccionarlo y **Extraer**. Borrar el ZIP del servidor al
terminar.

Si el archivo excede el límite de carga del Administrador de archivos, usar FTP:

```bash
./site/hostgator/empaquetar.sh --solo-carpeta   # deja site/hostgator/dist/
```

y subir el **contenido** de `dist/` a `public_html/`.

Comprobar que en el servidor quedaron:

```
public_html/index.html
public_html/.htaccess          (archivo oculto: activar «Mostrar archivos ocultos»)
public_html/api/index.php
public_html/api/db.php
public_html/assets/…           267 imágenes, js y css
public_html/admin/  public_html/bodega/  public_html/crm/
```

---

## Paso 6 · Configurar las credenciales

El archivo con la clave **no va dentro de public_html**. En el Administrador de
archivos, subir un nivel (a `/home/USUARIO`, donde se ve la carpeta
`public_html`) y crear ahí `nase-config.php` con el contenido de
`site/hostgator/api/config.example.php`, completando:

```php
'db_name' => 'usuario_nase',
'db_user' => 'usuario_nase',
'db_pass' => 'la contraseña del paso 2',
'admin_token' => 'un token largo y aleatorio',
'acceso_abierto' => '0',
```

Sobre `admin_token`:

- Es la clave con la que se entra a `/admin` y a `/bodega`. Si se quiere seguir
  usando la misma de hoy, poner esa; si no se recuerda, se elige una nueva
  (Cloudflare no muestra el valor de un secret ya guardado).
- Para generar una: `php -r 'echo bin2hex(random_bytes(24)), "\n";'`

Sobre `acceso_abierto`: **debe quedarse en `'0'`**. Con `'1'`, `/api/login`
entrega el token sin pedir clave y el panel de inventario —crear y borrar
productos, registrar ventas, ajustar stock— queda abierto a cualquiera. Es el
mismo incidente del 20-08-2026 descrito en el README del repositorio.

---

## Paso 7 · Probar antes de tocar el dominio

Todavía no hay que mover el DNS. Para ver el sitio en HostGator con el dominio
real, editar el archivo `hosts` del computador y apuntar el dominio a la IP del
servidor (paso 1):

- Windows: `C:\Windows\System32\drivers\etc\hosts` (Bloc de notas como
  administrador)
- macOS o Linux: `/etc/hosts` (`sudo nano /etc/hosts`)

```
203.0.113.10   naseagrotech.cl www.naseagrotech.cl      ← poner la IP real
```

Con eso, solo en ese computador el dominio resuelve al servidor nuevo. Probar:

- [ ] `http://naseagrotech.cl/api/salud` responde
      `{"ok":true,"productos":28,"protegido":true}`
- [ ] La portada carga con sus imágenes y los textos publicados (por ejemplo
      «Distribuidor Oficial DJI Agriculture - Enterprise» bajo el logo).
- [ ] `/repuestos.html` muestra el catálogo con las etiquetas «Disponible» y
      «A pedido».
- [ ] `/comparador.html`, `/t100.html`, `/t70p.html`, `/t55.html`, `/t25p.html`,
      `/dock3.html` y `/matrice4.html` abren sin error.
- [ ] `/admin/` pide la clave, entra con el token y muestra los 28 productos.
- [ ] `/bodega/` abre un conteo y lo cierra.
- [ ] Agregar algo al carrito y enviar el pedido: aparece como pendiente en el
      panel.

Si algo falla, el detalle queda en cPanel → *Errores* (o `~/logs`). Para ver el
error concreto en la respuesta JSON, poner `'debug' => true` en
`nase-config.php` **temporalmente**.

Al terminar, borrar la línea del archivo `hosts`.

---

## Paso 8 · Mover el dominio fuera de Cloudflare

`naseagrotech.cl` usa hoy los nameservers de Cloudflare. **Antes de cambiar
nada**, entrar a Cloudflare → dominio → **DNS** → botón **Export** y guardar el
archivo de la zona: es la lista completa de registros que hay que recrear.

> ⚠️ **El correo de la empresa depende de esos registros.** `naseagrotech.cl`
> usa Titan Email (`mx1.titan.email` y `mx2.titan.email`) y un SPF
> `v=spf1 include:spf.titan.email ~all`. Si los nameservers cambian a HostGator
> y esos registros no se recrean allí, **el correo @naseagrotech.cl deja de
> llegar**. Recrearlos ANTES de cambiar los nameservers.

Registros que hay hoy y que deben quedar iguales (verificar contra el export,
que manda sobre esta tabla):

| Tipo | Nombre | Valor | Para qué |
|---|---|---|---|
| MX (10) | `naseagrotech.cl` | `mx1.titan.email` | Correo |
| MX (20) | `naseagrotech.cl` | `mx2.titan.email` | Correo |
| TXT | `naseagrotech.cl` | `v=spf1 include:spf.titan.email ~all` | SPF del correo |
| A | `mail.naseagrotech.cl` | `69.6.225.245` | Webmail de Titan |
| A | `naseagrotech.cl` | **IP de HostGator** | El sitio (cambia) |
| A | `www.naseagrotech.cl` | **IP de HostGator** | El sitio (cambia) |

Hay dos caminos:

**A. Cambiar los nameservers a HostGator** (salida completa de Cloudflare)

1. En cPanel, anotar los nameservers de la cuenta (algo como `ns1.hostgator.cl`
   y `ns2.hostgator.cl`).
2. En cPanel → *Editor de zona* (Zone Editor), crear los registros MX, TXT y el
   A de `mail` de la tabla anterior, además de los A del sitio.
3. Entrar donde está **registrado** el dominio —para un `.cl`, NIC Chile o el
   agente registrador que se haya usado— y reemplazar los nameservers de
   Cloudflare por los de HostGator.
4. La propagación toma entre unos minutos y 24 horas.

**B. Dejar el DNS en Cloudflare pero sin proxy** (salida parcial, más rápida de
revertir)

En Cloudflare → DNS, cambiar los registros A de `naseagrotech.cl` y `www` a la
IP de HostGator y poner la nube en **gris (DNS only)**, no naranja. El correo no
se toca. Sirve como paso intermedio para probar en producción; cuando todo esté
estable, hacer el camino A.

Consejo: uno o dos días antes, bajar el TTL de los registros A a 5 minutos para
que el cambio se note enseguida y la vuelta atrás sea rápida.

---

## Paso 9 · Certificado SSL

Cuando el dominio ya apunte a HostGator:

1. cPanel → **SSL/TLS Status** → seleccionar el dominio → **Run AutoSSL**.
2. Esperar a que quede emitido (suele tardar entre minutos y un par de horas).
3. Comprobar que `https://naseagrotech.cl` abre con candado.
4. Recién entonces, editar `public_html/.htaccess` y **descomentar** las tres
   líneas del bloque «HTTPS obligatorio». Si se descomentan antes de tener el
   certificado, el sitio deja de abrirse.

---

## Paso 10 · Verificación final

- [ ] `https://naseagrotech.cl` y `https://www.naseagrotech.cl` abren con candado
- [ ] `http://` redirige a `https://`
- [ ] Las siete páginas de modelo y el comparador cargan con sus imágenes
- [ ] Los textos publicados (C1–C13) se ven en la portada
- [ ] El catálogo de repuestos carga desde la base
- [ ] Un pedido de prueba llega al panel y se puede aprobar
- [ ] `/admin/` y `/bodega/` piden clave y funcionan
- [ ] Enviar y recibir un correo de prueba a `@naseagrotech.cl`
- [ ] `https://naseagrotech.cl/api/config.php` y `/api/salud` **no** exponen
      credenciales (el primero debe dar 403 o 404)

---

## Paso 11 · Apagar Cloudflare

Solo cuando el sitio lleve al menos una semana estable en HostGator:

1. Volver a exportar D1 (`./exportar-d1.sh`) por si entraron pedidos nuevos
   mientras el DNS terminaba de propagarse, y cargar en MySQL lo que falte.
2. Eliminar el Worker `curly-feather-8a3c` y la base D1 `nase-inventario`.
3. Quitar el dominio de Cloudflare y, si no se usa para nada más, cerrar la
   cuenta.

**Vuelta atrás:** mientras no se haga este paso, revertir es cuestión de minutos
—devolver los nameservers a Cloudflare, o volver a poner la nube naranja— porque
el Worker sigue en pie y con sus datos.

---

## Diferencias que conviene tener presentes

- **Ya no hay CDN ni protección DDoS.** Cloudflare servía las imágenes desde su
  red y filtraba tráfico; HostGator entrega todo desde un solo servidor. El
  `.htaccess` compensa con compresión gzip y caché de navegador (30 días para
  imágenes, 7 para JS y CSS, nada para el HTML, que debe reflejar de inmediato
  lo que se publica desde el panel).
- **El sitio sigue llamando a servicios externos** que no dependen del hosting:
  Google Fonts, los videos del CDN de DJI y un documento incrustado de Google
  Drive.
- **Los pedidos siguen saliendo por WhatsApp** (`cart.js` abre `wa.me`) y el
  contacto por `mailto:servicios@naseagrotech.cl`. No hay envío de correo desde
  el servidor, así que no hay nada que configurar en ese frente.
- **`robots.txt` viene de Cloudflare**: son las «content signals» que Cloudflare
  añadía, y en la práctica no contiene ninguna regla. Se puede dejar como está o
  reemplazarlo por uno propio, por ejemplo:

  ```
  User-agent: *
  Allow: /
  Disallow: /admin/
  Disallow: /bodega/
  ```

- **Precios en `DOUBLE`**: es el equivalente más cercano a cómo D1 y el Worker
  ya los manejaban (números de JavaScript). Para pesos chilenos, sin decimales,
  es exacto.
