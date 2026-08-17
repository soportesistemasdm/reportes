import pool from '../db.js';
// 1. OBTENER TODOS LOS ROLES
export const obtenerRoles = async (req, res) => {
    try {
        const query = 'SELECT id, nombre FROM roles ORDER BY nombre ASC;';
        const resultado = await pool.query(query);
        return res.json({
            success: true,
            data: resultado.rows
        });
    }
    catch (error) {
        console.error('Error al obtener roles:', error);
        return res.status(500).json({ success: false, message: 'Error interno al listar los roles.' });
    }
};
// 2. OBTENER PERMISOS DE CARPETAS DE UN ROL ESPECÍFICO
export const obtenerCarpetasPorRol = async (req, res) => {
    const { id } = req.params;
    try {
        // Traemos solo los IDs de las carpetas asociadas a este rol
        const query = 'SELECT carpeta_id FROM rol_carpetas WHERE rol_id = $1;';
        const resultado = await pool.query(query, [id]);
        // Mapeamos el resultado a un array simple [1, 5, 8] como lo espera el React
        const idsCarpetas = resultado.rows.map((row) => row.carpeta_id);
        return res.json({
            success: true,
            data: idsCarpetas
        });
    }
    catch (error) {
        console.error('Error al obtener carpetas del rol:', error);
        return res.status(500).json({ success: false, message: 'Error al recuperar los accesos del rol.' });
    }
};
// 3. CREAR ROL CON PERMISOS (Tu función optimizada)
export const crearRolConPermisos = async (req, res) => {
    const { nombre, carpetas } = req.body;
    if (!nombre || !carpetas || !Array.isArray(carpetas)) {
        return res.status(400).json({ success: false, message: 'Datos de entrada no válidos.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Insertar el nuevo rol (limpiando espacios y forzando mayúsculas para consistencia)
        const queryNuevoRol = 'INSERT INTO roles (nombre) VALUES ($1) RETURNING id;';
        const resultadoRol = await client.query(queryNuevoRol, [nombre.trim().toUpperCase()]);
        const nuevoRolId = resultadoRol.rows[0].id;
        // Insertar las relaciones
        const queryInsertarPermisos = 'INSERT INTO rol_carpetas (rol_id, carpeta_id) VALUES ($1, $2);';
        for (const carpetaId of carpetas) {
            await client.query(queryInsertarPermisos, [nuevoRolId, carpetaId]);
        }
        await client.query('COMMIT');
        return res.status(201).json({
            success: true,
            message: 'Rol y mapeo de carpetas creados correctamente.'
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.constraint === 'roles_nombre_key' ? 'Ese nombre de rol ya existe.' : 'Error interno del servidor.'
        });
    }
    finally {
        client.release();
    }
};
// 4. ACTUALIZAR ROL Y SUS PERMISOS (Sincronización total)
export const actualizarRolConPermisos = async (req, res) => {
    const { id } = req.params;
    const { nombre, carpetas } = req.body;
    if (!nombre || !carpetas || !Array.isArray(carpetas)) {
        return res.status(400).json({ success: false, message: 'Estructura de petición incorrecta.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // A. Actualizar el nombre del Rol
        const queryUpdateRol = 'UPDATE roles SET nombre = $1 WHERE id = $2;';
        await client.query(queryUpdateRol, [nombre.trim().toUpperCase(), id]);
        // B. Limpiar todos los accesos anteriores de este rol específico
        const queryBorrarPermisos = 'DELETE FROM rol_carpetas WHERE rol_id = $1;';
        await client.query(queryBorrarPermisos, [id]);
        // C. Insertar el nuevo set de carpetas seleccionadas en el Front
        const queryInsertarPermisos = 'INSERT INTO rol_carpetas (rol_id, carpeta_id) VALUES ($1, $2);';
        for (const carpetaId of carpetas) {
            await client.query(queryInsertarPermisos, [id, carpetaId]);
        }
        await client.query('COMMIT');
        return res.json({
            success: true,
            message: 'Rol y mapeo de carpetas sincronizados correctamente.'
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.constraint === 'roles_nombre_key' ? 'Ese nombre de rol ya está siendo usado por otro perfil.' : 'Error al actualizar los privilegios.'
        });
    }
    finally {
        client.release();
    }
};
//# sourceMappingURL=roles.controller.js.map