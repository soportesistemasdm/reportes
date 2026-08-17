import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura_123';

// Extendemos la interfaz de Request de Express para poder adjuntar el usuario autenticado
export interface RequestAutenticado extends Request {
  usuario?: {
    id: string;
    email: string;
    permisos: string[]; // Aquí vienen las carpetas permitidas (ej: ['VENTAS'])
  } | undefined;
}

export const verificarToken = (req: RequestAutenticado, res: Response, next: NextFunction): void => {
  const authorization = req.headers['authorization'];

  if (!authorization) {
    res.status(401).json({ success: false, message: 'Acceso denegado. No se proporcionó un token.' });
    return;
  }

  // El token viene en formato: "Bearer <token_id>"
  const partes = authorization.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
     res.status(401).json({ success: false, message: 'Formato de token inválido (Debe ser Bearer).' });
     return;
  }

  const token = partes[1];

  try {
    // Verificar y decodificar el token con nuestra firma secreta
    if (!token) throw new Error();
    const decodificado = jwt.verify(token, JWT_SECRET) as RequestAutenticado['usuario'];
    
    // Inyectamos los datos del usuario descifrados en la petición actual
    req.usuario = decodificado;
    
    next(); // Continuar hacia el controlador definitivo
  } catch (error) {
    res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
  }
};