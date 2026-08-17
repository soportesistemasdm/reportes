import pool from '../db.js';
import bcrypt from 'bcrypt';
// 1. OBTENER TODOS LOS USUARIOS (Mapeado exacto)
export const obtenerUsuarios = async (req, res) => {
    try {
        const query = `
      SELECT u.id, u.nombre, u.email, u.departamento, u.rol_id, r.nombre as rol_nombre 
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      ORDER BY u.nombre ASC;
    `;
        const resultado = await pool.query(query);
        return res.json({
            success: true,
            data: resultado.rows
        });
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({ success: false, message: 'Error interno al listar los usuarios.' });
    }
};
// 2. CREAR NUEVO USUARIO
export const crearUsuario = async (req, res) => {
    const { id, nombre, email, password, departamento, rol_id } = req.body;
    // Validación de los campos obligatorios según tu esquema
    if (!id || !nombre || !email || !password || !rol_id) {
        return res.status(400).json({ success: false, message: 'Campos requeridos incompletos.' });
    }
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        const query = `
      INSERT INTO usuarios (id, nombre, email, password_hash, departamento, rol_id)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
        await pool.query(query, [
            id.trim(),
            nombre.trim(),
            email.toLowerCase().trim(),
            hash,
            departamento ? departamento.trim() : null,
            rol_id
        ]);
        return res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.'
        });
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.constraint === 'usuarios_email_key' || error.detail?.includes('email')) {
            return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado.' });
        }
        if (error.constraint === 'usuarios_pkey' || error.detail?.includes('id')) {
            return res.status(400).json({ success: false, message: 'El ID de usuario ya existe.' });
        }
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
// 3. ACTUALIZAR USUARIO
export const actualizarUsuario = async (req, res) => {
    const { id } = req.params; // El ID original que viene en la URL
    const { nombre, email, password, departamento, rol_id } = req.body;
    if (!nombre || !email || !rol_id) {
        return res.status(400).json({ success: false, message: 'Estructura de petición incorrecta.' });
    }
    try {
        if (password) {
            // Si se proporciona contraseña, se actualiza el campo password_hash
            const saltRounds = 10;
            const hash = await bcrypt.hash(password, saltRounds);
            const query = `
        UPDATE usuarios 
        SET nombre = $1, email = $2, password_hash = $3, departamento = $4, rol_id = $5 
        WHERE id = $6;
      `;
            await pool.query(query, [nombre.trim(), email.toLowerCase().trim(), hash, departamento, rol_id, id]);
        }
        else {
            // Si no se altera la contraseña
            const query = `
        UPDATE usuarios 
        SET nombre = $1, email = $2, departamento = $3, rol_id = $4 
        WHERE id = $5;
      `;
            await pool.query(query, [nombre.trim(), email.toLowerCase().trim(), departamento, rol_id, id]);
        }
        return res.json({
            success: true,
            message: 'Usuario actualizado correctamente.'
        });
    }
    catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar los cambios del usuario en la base de datos.'
        });
    }
};
//# sourceMappingURL=usuarios.controllers.js.map