import type { Request, Response } from 'express';
export declare const obtenerRoles: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const obtenerCarpetasPorRol: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const crearRolConPermisos: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const actualizarRolConPermisos: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=roles.controller.d.ts.map