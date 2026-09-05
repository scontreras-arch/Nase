#!/usr/bin/env bash
#
# Exporta la base D1 `nase-inventario` de Cloudflare a archivos JSON, uno por
# tabla, para luego convertirlos a MySQL con d1-a-mysql.php.
#
# Requisitos: Node y wrangler con sesión iniciada en la cuenta de Cloudflare
# (`npx wrangler login`).
#
# Uso:
#   ./exportar-d1.sh [carpeta-de-salida]        (por defecto: ./export-d1)
#
# Este es el ÚNICO paso que todavía necesita Cloudflare. Una vez hecho, y con
# los datos ya en MySQL, la cuenta se puede dar de baja.

set -euo pipefail

BASE="${NASE_D1:-nase-inventario}"
SALIDA="${1:-./export-d1}"
TABLAS=(productos movimientos imagenes config pedidos ventas venta_items conteos conteo_items)

mkdir -p "$SALIDA"

echo "Exportando la base D1 «$BASE» a $SALIDA/"
for t in "${TABLAS[@]}"; do
  printf '  %-14s ' "$t"
  # --remote: la base de producción, no la copia local de wrangler.
  if npx --yes wrangler d1 execute "$BASE" --remote --json \
       --command "SELECT * FROM $t" > "$SALIDA/$t.json" 2>"$SALIDA/$t.err"; then
    filas=$(node -e "
      const d = require('$PWD/$SALIDA/$t.json');
      const r = Array.isArray(d) ? (d[0]?.results ?? d) : (d.results ?? []);
      console.log(r.length);
    " 2>/dev/null || echo '?')
    echo "$filas filas"
    rm -f "$SALIDA/$t.err"
  else
    # Una tabla que no exista en D1 no es un problema: se anota y se sigue.
    echo "no se pudo leer (ver $t.err)"
    rm -f "$SALIDA/$t.json"
  fi
done

echo
echo "Listo. Siguiente paso:"
echo "  php d1-a-mysql.php $SALIDA ../sql/03-datos.sql"
