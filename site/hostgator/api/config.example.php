<?php
/**
 * Plantilla de configuración de la API.
 *
 * DÓNDE PONERLA EN HOSTGATOR
 * --------------------------
 * Copiar este archivo como  /home/USUARIO/nase-config.php  — es decir, UN NIVEL
 * POR ENCIMA de public_html. Ahí Apache no lo puede servir, así que la clave no
 * queda expuesta ni aunque falle el intérprete de PHP.
 *
 * Si por alguna razón no se puede escribir fuera de public_html, sirve también
 * como  public_html/api/config.php  (el .htaccess bloquea su descarga directa).
 *
 * Este archivo NO se sube al repositorio: config.php está en .gitignore.
 */

return [
    // Datos de la base creada en cPanel → «Bases de datos MySQL».
    // HostGator antepone el usuario de cPanel al nombre: usuario_nase.
    'db_host' => 'localhost',
    'db_port' => 3306,
    'db_name' => 'usuario_nase',
    'db_user' => 'usuario_nase',
    'db_pass' => 'LA-CLAVE-DE-LA-BASE',

    // Equivale al secret ADMIN_TOKEN del Worker: es la clave con la que se
    // entra a /admin y a /bodega. Poner una larga y aleatoria, por ejemplo con
    //   php -r 'echo bin2hex(random_bytes(24)), "\n";'
    'admin_token' => 'CAMBIAR-POR-UN-TOKEN-LARGO-Y-ALEATORIO',

    // DEBE quedarse en '0'.
    // Con '1', POST /api/login entrega el token de administrador sin pedir
    // clave: el panel de inventario —crear y borrar productos, registrar
    // ventas, ajustar stock— queda accesible para cualquiera que abra /admin.
    'acceso_abierto' => '0',

    // Solo para diagnosticar un problema puntual: con true, los errores del
    // servidor viajan con el detalle técnico en la respuesta JSON.
    'debug' => false,
];
