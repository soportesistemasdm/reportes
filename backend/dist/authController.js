import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';
// ==========================================
// 🚀 ENDPOINT DE LOGIN
// ==========================================
export const login = async (req, res) => {
    const { usuarioId, password } = req.body;
    try {
        if (!usuarioId || !password) {
            res.status(400).json({ success: false, message: 'ID de usuario y contraseña requeridos.' });
            return;
        }
        // 🔍 1. Buscamos al usuario trayendo también su 'rol_id'
        const queryUsuario = `
      SELECT id, nombre, email, password_hash, rol_id 
      FROM usuarios 
      WHERE id = $1;
    `;
        const { rows } = await pool.query(queryUsuario, [usuarioId]);
        if (rows.length === 0) {
            res.status(401).json({ success: false, message: 'ID de usuario o contraseña incorrectos.' });
            return;
        }
        const usuario = rows[0];
        // 🔐 2. Validamos la contraseña hash con bcrypt
        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            res.status(401).json({ success: false, message: 'ID de usuario o contraseña incorrectos.' });
            return;
        }
        // 🗺️ 3. Query adaptado a tu DB: Buscamos las carpetas cruzando 'rol_carpetas' usando el 'rol_id' del usuario
        const queryPermisos = `
      SELECT c.nombre AS carpeta
      FROM rol_carpetas rc
      JOIN carpetas c ON rc.carpeta_id = c.id
      WHERE rc.rol_id = $1;
    `;
        const { rows: permisosRows } = await pool.query(queryPermisos, [usuario.rol_id]);
        const permisos = permisosRows.map(row => row.carpeta); // Ej: ['VENTAS', 'PRODUCCION']
        console.log("permisos", permisos);
        // 🎫 4. Generamos el token JWT firmado de 8 horas corporativas
        const token = jwt.sign({
            id: usuario.id,
            nombre: usuario.nombre,
            rol_id: usuario.rol_id,
            permisos: permisos
        }, JWT_SECRET, { expiresIn: '8h' });
        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                permisos,
                rol_id: usuario.rol_id
            }
        });
    }
    catch (error) {
        console.error('❌ Error en el proceso de Login:', error);
        res.status(500).json({ success: false, message: 'Error interno en el servidor.' });
    }
};
// ==========================================
// ➕ ENDPOINT DE REGISTRO
// ==========================================
export const registrar = async (req, res) => {
    // 📝 Recibimos los datos puros que van en tu tabla 'usuarios'
    const { usuarioId, nombre, email, password, departamento, rolId } = req.body;
    try {
        if (!usuarioId || !password) {
            res.status(400).json({ success: false, message: 'ID de usuario y contraseña son requeridos.' });
            return;
        }
        // 1. Verificar duplicados en la columna 'id'
        const checkUsuario = await pool.query('SELECT id FROM usuarios WHERE id = $1', [usuarioId]);
        if (checkUsuario.rows.length > 0) {
            res.status(400).json({ success: false, message: 'El ID de usuario ya se encuentra registrado.' });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        // 2. Insertar respetando estrictamente tus columnas reales de pgAdmin
        const queryInsert = `
      INSERT INTO usuarios (id, nombre, email, password_hash, departamento, rol_id, creado_en) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
      RETURNING id, nombre;
    `;
        await pool.query(queryInsert, [
            usuarioId,
            nombre || 'Usuario SAP',
            email || null,
            hashed,
            departamento || null,
            rolId || 1 // 👈 Vinculación automática al rol (y por ende a sus carpetas)
        ]);
        res.status(201).json({
            success: true,
            message: `Usuario ${usuarioId} registrado exitosamente en Del Monte AG con el Rol ID: ${rolId || 1}.`
        });
    }
    catch (error) {
        console.error('❌ Error en el proceso de Registro:', error);
        res.status(500).json({ success: false, message: 'Error interno al intentar crear el usuario.' });
    }
};
//# sourceMappingURL=authController.js.map