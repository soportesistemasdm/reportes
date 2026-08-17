import pool from '../db.js';
export const obtenerArbolAutorizado = async (req, res) => {
    // 1. Extraemos el rol_id de manera segura según la nueva estructura del request
    const userRolId = req.usuario?.rol_id;
    if (!userRolId) {
        return res.status(401).json({ error: 'No se pudo identificar el rol_id del usuario autenticado.' });
    }
    try {
        // 2. Consultar las carpetas que este rol tiene asignadas usando el ID numérico
        const query = `
      SELECT c.id, c.nombre, c.padre_id
      FROM public.carpetas c
      INNER JOIN public.rol_carpetas rc ON c.id = rc.carpeta_id
      WHERE rc.rol_id = $1
      ORDER BY c.padre_id, c.nombre;
    `;
        const resultado = await pool.query(query, [userRolId]);
        const filas = resultado.rows;
        // 3. Crear diccionario de búsqueda rápida para evitar bucles anidados pesados
        const mapeo = {};
        filas.forEach(fila => {
            mapeo[fila.id] = {
                id: fila.id,
                nombre: fila.nombre,
                padre_id: fila.padre_id,
                subcarpetas: []
            };
        });
        const raicesDelArbol = [];
        // 4. Construcción del árbol jerárquico (TypeScript Safe)
        filas.forEach(fila => {
            const nodo = mapeo[fila.id];
            if (!nodo)
                return; // Validación preventiva
            if (fila.padre_id === null) {
                // Es un nodo raíz absoluto en la base de datos
                raicesDelArbol.push(nodo);
            }
            else {
                const padre = mapeo[fila.padre_id];
                if (padre) {
                    // El padre existe en los permisos de este rol, lo añadimos como subcarpeta
                    padre.subcarpetas.push(nodo);
                }
                else {
                    // Si el rol tiene acceso al hijo pero NO al padre (huérfano por permisos),
                    // el hijo se promueve a raíz visual para este usuario.
                    raicesDelArbol.push(nodo);
                }
            }
        });
        console.log(`🌲 Árbol generado con éxito para el rol_id: ${userRolId} (${filas.length} carpetas)`);
        // Retornamos la jerarquía limpia lista para el Frontend
        return res.json(raicesDelArbol);
    }
    catch (error) {
        console.error('❌ Error crítico al estructurar el árbol jerárquico:', error);
        return res.status(500).json({ error: 'Error interno del servidor al procesar el directorio.' });
    }
};
//# sourceMappingURL=carpetas.controller.js.map