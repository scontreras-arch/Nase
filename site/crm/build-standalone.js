#!/usr/bin/env node
// Genera demo-standalone.html: TODO (css + js + datos + logo) en un archivo.
const fs = require('fs'), path = require('path');
const H = __dirname, read = p => fs.readFileSync(path.join(H, p), 'utf8');

const styles = read('styles.css');
const logo = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(H, 'assets/logo-nase.jpg')).toString('base64');
const APP = ['core/constants.js', 'core/auth.js', 'core/events.js', 'modules/crm/crm.js', 'main.js'];
const appJs = APP.map(f => '\n/* ' + f + ' */\n' + read(f)).join('\n');

// Body de demo.html: del <body> hasta antes de los <script>, con el logo inline
let body = read('demo.html');
body = body.slice(body.indexOf('<body>') + 6, body.indexOf('<!-- ===== SCRIPTS')).trim();
body = body.split('./assets/logo-nase.jpg').join(logo);

const out = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="NASE Agrotech · CRM demo standalone (datos de ejemplo, sin login)">
<meta name="robots" content="noindex,nofollow">
<title>NASE Agrotech · CRM — Demo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${styles}
</style>
</head>
<body>
${body}
<script>
${read('demo.data.js')}
</script>
<script>
${appJs}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(H, 'demo-standalone.html'), out);
console.log('OK · demo-standalone.html · ' + (Buffer.byteLength(out) / 1024).toFixed(0) + ' KB');
