import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import { registrar, login } from './authController.js';
import { verificarToken, type RequestAutenticado } from './authMiddleware.js'; // 👈 Importamos el middleware
import './scheduler.js';
import path from 'path';
import { obtenerArbolAutorizado } from './controllers/carpetas.controller.js'; // 👈 Tu nuevo controlador
import { obtenerRoles, obtenerCarpetasPorRol, crearRolConPermisos, actualizarRolConPermisos } from './controllers/roles.controller.js'; // 👈 Importamos los controladores de roles
import { 
  obtenerUsuarios, 
  crearUsuario, 
  actualizarUsuario 
} from './controllers/usuarios.controllers.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 🔐 RUTAS PÚBLICAS (No requieren token)
app.post('/api/auth/registrar', registrar);
app.post('/api/auth/login', login);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'El backend de reportes SAP está vivo' });
});

app.get('/api/carpetas/autorizadas', verificarToken, obtenerArbolAutorizado);
app.get('/api/roles', verificarToken, obtenerRoles);
app.get('/api/roles/:id/carpetas', verificarToken, obtenerCarpetasPorRol);
app.post('/api/roles/crear-con-permisos', verificarToken, crearRolConPermisos);
app.put('/api/roles/actualizar-con-permisos/:id', verificarToken, actualizarRolConPermisos);

app.get('/api/usuarios', verificarToken, obtenerUsuarios);
app.post('/api/usuarios/crear', verificarToken, crearUsuario);
app.put('/api/usuarios/:id', verificarToken, actualizarUsuario);


// 🛡️ RUTA PROTEGIDA (Se añade 'verificarToken' antes de ejecutar la lógica)
app.get('/api/reportes', verificarToken, async (req: RequestAutenticado, res) => {
  try {
    // Extraemos los permisos reales inyectados por el middleware desde el JWT
    const permisosUsuario = req.usuario?.permisos || []; 

    // Si el usuario no tiene ninguna carpeta asignada, devolvemos lista vacía directo
    if (permisosUsuario.length === 0) {
       res.json({ success: true, count: 0, data: [] });
       return;
    }

    // Traemos de la BD únicamente los reportes cuyo nombre de carpeta esté autorizado para este usuario
    const query = `
      SELECT r.id, r.nombre_archivo, r.tamano_mb, r.fecha_modificacion, c.nombre AS carpeta
      FROM reportes_indexados r
      JOIN carpetas c ON r.carpeta_id = c.id
      WHERE c.nombre = ANY($1)
      ORDER BY r.fecha_modificacion DESC;
    `;

    const { rows: reportes } = await pool.query(query, [permisosUsuario]);

    res.json({ success: true, count: reportes.length, data: reportes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener los reportes' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


// 💾 ENDPOINT DE DESCARGA ADAPTADO AL ESQUEMA REAL
app.get('/api/reportes/descargar/:id', verificarToken, async (req: RequestAutenticado, res) => {
  try {
    const { id } = req.params;
    const permisosUsuario = req.usuario?.permisos || [];

    // 🔍 Buscamos combinando con 'carpetas' para estructurar la ruta real en disco
    const query = `
      SELECT 
        r.nombre_archivo, 
        c.nombre AS carpeta_nombre, 
        c.ruta_disco
      FROM reportes_indexados r
      JOIN carpetas c ON r.carpeta_id = c.id
      WHERE r.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'El archivo no se encuentra en el índice de SAP.' });
      return;
    }

    const reporte = rows[0];

    // 🔐 Validación estricta de roles/permisos corporativos
    const tieneAcceso = permisosUsuario.some(p => p.toUpperCase() === reporte.carpeta_nombre.toUpperCase());
    if (!tieneAcceso) {
      res.status(403).json({ success: false, message: 'Acceso denegado. Tu rol no tiene permitido este módulo.' });
      return;
    }
    let rutaConvertida = reporte.ruta_disco.replace(/\\/g, '/');

    if (rutaConvertida.match(/^[a-zA-Z]:/)) {
      rutaConvertida = rutaConvertida.replace(/^[a-zA-Z]:/, ''); // Quita el 'C:' o 'D:'
    }

    // 🧩 Construcción dinámica de la ruta: unimos la carpeta de disco con el nombre de archivo
    // 🧩 Reemplaza el path.join por esto:
    const rutaAbsolutaArchivo = path.resolve(rutaConvertida, reporte.nombre_archivo);

    console.log(`📂 Intentando servir el archivo: ${rutaAbsolutaArchivo}`);
    // 🚀 Servir el archivo al cliente
    res.download(rutaAbsolutaArchivo, reporte.nombre_archivo, (err) => {
      if (err) {
        console.error("❌ Error físico al transferir el archivo:", err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'El archivo no está disponible físicamente en el servidor de SAP.' });
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en el proceso de descarga:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al procesar la descarga.' });
  }
});