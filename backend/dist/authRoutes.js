import { Router } from 'express';
import { login, registrar } from './authController.js';
const router = Router();
router.post('/login', login);
router.post('/registrar', registrar); // 👈 Añadimos la ruta de registro
export default router;
//# sourceMappingURL=authRoutes.js.map