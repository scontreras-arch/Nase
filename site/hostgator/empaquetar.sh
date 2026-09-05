#!/usr/bin/env bash
#
# Arma el paquete que se sube a HostGator: el sitio de site/web/ más la API en
# PHP y el .htaccess, todo junto y en la estructura que espera public_html.
#
# Uso:
#   ./empaquetar.sh                 # deja dist/ y nase-public_html-AAAAMMDD.zip
#   ./empaquetar.sh --solo-carpeta  # deja únicamente dist/ (para subir por FTP)
#
# El ZIP se sube por cPanel → Administrador de archivos → public_html →
# «Cargar», y luego «Extraer». No incluye config.php: las credenciales van en
# ~/nase-config.php, fuera de public_html.

set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$AQUI/../web"
DIST="$AQUI/dist"
FECHA="$(date +%Y%m%d)"
ZIP="$AQUI/nase-public_html-$FECHA.zip"

if [ ! -d "$WEB" ]; then
  echo "No encuentro $WEB (el frontend respaldado). ¿Estás en el repo?" >&2
  exit 1
fi

echo "1/4  Limpiando dist/"
rm -rf "$DIST" "$ZIP"
mkdir -p "$DIST"

echo "2/4  Copiando el sitio (site/web/)"
cp -R "$WEB/." "$DIST/"

echo "3/4  Añadiendo la API en PHP y el .htaccess"
mkdir -p "$DIST/api"
cp "$AQUI/api/index.php" "$AQUI/api/db.php" "$AQUI/api/config.example.php" "$DIST/api/"
cp "$AQUI/public_html/.htaccess" "$DIST/.htaccess"

# Nunca empaquetar credenciales reales.
rm -f "$DIST/api/config.php"

if [ "${1:-}" = "--solo-carpeta" ]; then
  echo "4/4  Listo: $DIST"
  exit 0
fi

echo "4/4  Comprimiendo"
( cd "$DIST" && zip -qr "$ZIP" . -x '.DS_Store' '*/.DS_Store' )

echo
echo "Paquete listo:"
echo "  $ZIP  ($(du -h "$ZIP" | cut -f1), $(unzip -l "$ZIP" | tail -1 | awk '{print $2}') archivos)"
echo
echo "Subirlo a public_html en cPanel y extraerlo. Después, y solo una vez:"
echo "  · copiar api/config.example.php a ~/nase-config.php con los datos reales"
echo "  · importar sql/01-esquema.sql y los datos en phpMyAdmin"
