import type { Request, Response, NextFunction } from 'express';
export interface RequestAutenticado extends Request {
    usuario?: {
        id: string;
        email: string;
        permisos: string[];
    } | undefined;
}
export declare const verificarToken: (req: RequestAutenticado, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map