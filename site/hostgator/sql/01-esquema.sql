-- Esquema MySQL de NASE Agrotech para HostGator.
--
-- Equivale a la base D1 `nase-inventario` que usaba el Worker de Cloudflare.
-- D1 es SQLite: aquí se traducen los tipos (INTEGER/REAL/TEXT) y las cláusulas
-- propias de SQLite (`ON CONFLICT ... DO UPDATE`) a su forma de MySQL.
--
-- Los nombres de columna NO se pueden cambiar: el frontend y los paneles leen
-- exactamente estos campos (por ejemplo `fecha` en movimientos, ventas y
-- pedidos, y `creado_en` en conteos).
--
-- Importar en cPanel → phpMyAdmin → pestaña «Importar», o por consola:
--   mysql -u USUARIO -p BASE < 01-esquema.sql

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- --------------------------------------------------------------------------
-- Catálogo e inventario
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id          VARCHAR(190) NOT NULL,
  sku         VARCHAR(120) DEFAULT NULL,
  sku_summit  VARCHAR(120) DEFAULT NULL,
  pn_dji      VARCHAR(120) DEFAULT NULL,
  nombre      VARCHAR(255) DEFAULT NULL,
  modelo      VARCHAR(120) DEFAULT NULL,
  tipo        VARCHAR(60)  DEFAULT NULL,
  nota        TEXT                 NULL,
  descripcion TEXT                 NULL,
  ficha       LONGTEXT             NULL,  -- JSON en texto, igual que en D1
  imagen      LONGTEXT             NULL,  -- URL o data: URI en base64
  imagenes    LONGTEXT             NULL,  -- JSON en texto
  precio      DOUBLE       NOT NULL DEFAULT 0,
  moneda      VARCHAR(10)  DEFAULT 'CLP',
  stock       INT          NOT NULL DEFAULT 0,
  stock_min   INT          NOT NULL DEFAULT 0,
  ubicacion   VARCHAR(120) DEFAULT NULL,
  activo      TINYINT(1)   NOT NULL DEFAULT 1,
  vitrina     TINYINT(1)   NOT NULL DEFAULT 1,
  orden       INT          NOT NULL DEFAULT 0,
  origen      VARCHAR(60)  DEFAULT NULL,
  updated_at  DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_productos_vitrina (activo, vitrina, orden),
  KEY idx_productos_modelo (modelo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimientos (
  id               INT NOT NULL AUTO_INCREMENT,
  producto_id      VARCHAR(190) DEFAULT NULL,
  tipo             VARCHAR(20)  DEFAULT NULL,  -- entrada | salida | ajuste+ | ajuste- | inicial
  cantidad         INT          NOT NULL DEFAULT 0,
  stock_resultante INT          DEFAULT NULL,
  motivo           VARCHAR(255) DEFAULT NULL,
  usuario          VARCHAR(60)  DEFAULT NULL,
  fecha            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimientos_producto (producto_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Contenido editable del sitio (lo que publica el editor de textos)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imagenes (
  clave       VARCHAR(190) NOT NULL,
  url         LONGTEXT             NULL,  -- URL o data: URI en base64
  descripcion VARCHAR(255) DEFAULT NULL,
  updated_at  DATETIME     DEFAULT NULL,
  PRIMARY KEY (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS config (
  clave      VARCHAR(190) NOT NULL,  -- el sitio usa la fila 'sitio'
  valor      LONGTEXT             NULL,  -- JSON en texto
  updated_at DATETIME     DEFAULT NULL,
  PRIMARY KEY (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Pedidos del sitio y ventas
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id          INT NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(120) DEFAULT NULL,
  telefono    VARCHAR(40)  DEFAULT NULL,
  correo      VARCHAR(120) DEFAULT NULL,
  comuna      VARCHAR(120) DEFAULT NULL,
  comentario  TEXT                 NULL,
  items       LONGTEXT             NULL,  -- JSON en texto: el panel hace JSON.parse
  estado      VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
  venta_id    INT          DEFAULT NULL,
  resuelto_en DATETIME     DEFAULT NULL,
  fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pedidos_estado (estado, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas (
  id        INT NOT NULL AUTO_INCREMENT,
  numero    VARCHAR(60)  DEFAULT NULL,
  cliente   VARCHAR(190) DEFAULT NULL,
  contacto  VARCHAR(190) DEFAULT NULL,
  documento VARCHAR(60)  DEFAULT NULL,
  total     DOUBLE       NOT NULL DEFAULT 0,
  notas     TEXT                 NULL,
  origen    VARCHAR(30)  DEFAULT 'mostrador',  -- mostrador | web
  pedido_id INT          DEFAULT NULL,
  usuario   VARCHAR(60)  DEFAULT NULL,
  fecha     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ventas_pedido (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS venta_items (
  id          INT NOT NULL AUTO_INCREMENT,
  venta_id    INT          NOT NULL,
  producto_id VARCHAR(190) DEFAULT NULL,
  nombre      VARCHAR(255) DEFAULT NULL,
  cantidad    INT          NOT NULL DEFAULT 1,
  precio      DOUBLE       NOT NULL DEFAULT 0,
  subtotal    DOUBLE       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_venta_items_venta (venta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Conteos de bodega (panel /bodega)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conteos (
  id         INT NOT NULL AUTO_INCREMENT,
  nombre     VARCHAR(120) DEFAULT NULL,
  alcance    VARCHAR(120) DEFAULT NULL,
  usuario    VARCHAR(60)  DEFAULT NULL,
  notas      TEXT                 NULL,
  estado     VARCHAR(20)  NOT NULL DEFAULT 'abierto',  -- abierto | cerrado | anulado
  items      INT          NOT NULL DEFAULT 0,
  ajustados  INT          NOT NULL DEFAULT 0,
  cerrado_en DATETIME     DEFAULT NULL,
  creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_conteos_estado (estado, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conteo_items (
  id          INT NOT NULL AUTO_INCREMENT,
  conteo_id   INT          NOT NULL,
  producto_id VARCHAR(190) NOT NULL,
  esperado    INT          NOT NULL DEFAULT 0,
  contado     INT          NOT NULL DEFAULT 0,
  diferencia  INT          NOT NULL DEFAULT 0,
  usuario     VARCHAR(60)  DEFAULT NULL,
  updated_at  DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conteo_producto (conteo_id, producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
