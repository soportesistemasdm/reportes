-- 1. Tabla Maestra de Carpetas
CREATE TABLE IF NOT EXISTS carpetas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,       -- Ejemplo: 'VENTAS', 'CARTERA'
    ruta_disco VARCHAR(255) NOT NULL          -- Ruta física: '/app/storage/sap_reports/(Z-SAP) VENTAS'
);

-- 2. Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL        -- Ejemplo: 'ADMINISTRADOR', 'CONSULTOR_VENTAS'
);

-- 3. Tabla Intermedia: Permisos de Carpetas por Rol
CREATE TABLE IF NOT EXISTS rol_carpetas (
    id SERIAL PRIMARY KEY,
    rol_id INT REFERENCES roles(id) ON DELETE CASCADE,
    carpeta_id INT REFERENCES carpetas(id) ON DELETE CASCADE,
    UNIQUE(rol_id, carpeta_id)                -- Evita duplicar el mismo permiso en un rol
);

-- 4. Tabla de Usuarios (Con ID Alfanumérico y Departamento)
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(30) PRIMARY KEY,               -- Generado en Node (Ej: 'USR-7E2A9F')
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    departamento VARCHAR(100) NOT NULL,       -- Ejemplo: 'Contabilidad'
    rol_id INT REFERENCES roles(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Reportes Indexados (Nueva: para el escáner nocturno)
CREATE TABLE IF NOT EXISTS reportes_indexados (
    id SERIAL PRIMARY KEY,
    nombre_archivo VARCHAR(255) NOT NULL,
    carpeta_id INT REFERENCES carpetas(id) ON DELETE CASCADE,
    tamano_mb NUMERIC(10, 2) NOT NULL,
    fecha_modificacion TIMESTAMP NOT NULL,
    indexado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre_archivo, carpeta_id)        -- Evita registrar el mismo archivo dos veces
);

-- --- DATOS SEMILLA (SEED) ---
-- Insertar las carpetas iniciales de SAP
INSERT INTO carpetas (nombre, ruta_disco) VALUES 
('VENTAS', '/app/storage/sap_reports/(Z-SAP) VENTAS'),
('CARTERA', '/app/storage/sap_reports/(Z-SAP) CARTERA'),
('INVENTARIO', '/app/storage/sap_reports/(Z-SAP) INVENTARIO'),
('TESORERIA', '/app/storage/sap_reports/(Z-SAP) TESORERIA')
ON CONFLICT (nombre) DO NOTHING;

-- Crear los roles base del sistema
INSERT INTO roles (nombre) VALUES 
('ADMINISTRADOR'), 
('CONSULTOR_VENTAS')
ON CONFLICT (nombre) DO NOTHING;

-- Asignar la carpeta 'VENTAS' (id: 1) al rol 'CONSULTOR_VENTAS' (id: 2)
INSERT INTO rol_carpetas (rol_id, carpeta_id) VALUES (2, 1)
ON CONFLICT DO NOTHING;