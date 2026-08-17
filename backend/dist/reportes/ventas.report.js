import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import pool from '../db.js';
import { obtenerConexionOracle } from '../oracleDb.js';
import oracledb from "oracledb";
export async function generarReporteVentas() {
    console.log('📊 [Worker Ventas] Iniciando extracción de vw_cubo_ventas...');
    let connection;
    try {
        connection = await obtenerConexionOracle();
        // 1. Query exacto filtrando por el año y mes actual en ejecución
        const query = `
      SELECT 
        territorio, codigo_division, division, cod_div_homologada, div_homologada, 
        cod_zona_actual, zona_actual, codigo_zona_venta, zona_venta, cod_zona_homologada, 
        zona_homologada, anio, mes, agencia, vendedor_actual, vendedor_venta, 
        tipo_venta, tipo_documento, id_factura, docentry_factura, factura, 
        numero_pedido, fecha_documento, fecha_vencimiento, emision, tipo_factura, 
        factura_relacionada, id_cliente, ruc_cliente, cliente, tipo_cliente, 
        grupo_cliente, subtotal_sin_descuento, descuento_valor, subtotal_con_descuento, 
        iva, total_factura, saldo_factura, total_venta, costo_total, tipo_bodega, 
        grupo_tecnico, plazo, sistema_origen, es_pronto_pago, sri, doc_cancelado, es_legal
      FROM vw_cubo_ventas 
      WHERE anio = TO_CHAR(SYSDATE -1, 'yyyy') 
        AND mes = TO_CHAR(SYSDATE -1   , 'mm')
    `;
        // 3002 mapea los resultados como objetos { COLUMNA: VALOR }
        const resultado = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        if (!resultado.rows || resultado.rows.length === 0) {
            console.log('⚠️ [Worker Ventas] Sin registros nuevos este mes en Oracle.');
            return;
        }
        // 2. Inicializar libro ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cubo de Ventas');
        // 3. MAPEO DINÁMICO DE COLUMNAS: Extrae los nombres directamente de las claves del primer registro
        const primeraFila = resultado.rows[0];
        const columnasOracle = Object.keys(primeraFila);
        worksheet.columns = columnasOracle.map(col => ({
            header: col.toUpperCase().replace(/_/g, ' '), // Transforma 'id_cliente' a 'ID CLIENTE'
            key: col,
            width: col.length < 15 ? 16 : col.length + 5 // Ajusta el ancho según el tamaño del nombre
        }));
        // Estilizar la fila de encabezados con la identidad visual
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '452B1B' } // Marrón corporativo Del Monte
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 26;
        // 4. Inyectar masivamente las filas de datos extraídas
        worksheet.addRows(resultado.rows);
        // Formatear columnas monetarias (Opcional - Aplica formato contable si detecta nombres clave)
        worksheet.columns.forEach(column => {
            if (column.key && (column.key.includes('total') || column.key.includes('subtotal') || column.key.includes('iva') || column.key.includes('descuento_valor'))) {
                column.numFmt = '$#,##0.00';
            }
        });
        // 5. Buscar la ruta física en PostgreSQL para 'VENTAS'
        const carpetaRes = await pool.query('SELECT id, ruta_disco FROM carpetas WHERE nombre = $1', ['VENTAS']);
        if (carpetaRes.rows.length === 0) {
            console.error('❌ [Worker Ventas] La carpeta maestra VENTAS no está configurada en la BD.');
            return;
        }
        const { id: carpetaId, ruta_disco: rutaDisco_raw } = carpetaRes.rows[0];
        const rutaDisco = rutaDisco_raw.includes(':\\')
            ? '/proyectos/dm/reportes' // La ruta interna que le diste a Docker en los volúmenes
            : rutaDisco_raw;
        // Formato final de archivo: "07-2026 CUBO VENTAS.xlsx"
        const anioMesStr = `${new Date().toLocaleString('es-ES', { month: '2-digit' })}-${new Date().getFullYear()}`;
        const nombreArchivo = `${anioMesStr} CUBO VENTAS.xlsx`;
        const rutaAbsoluta = path.resolve(rutaDisco, nombreArchivo);
        // Asegurar directorio existente
        if (!fs.existsSync(rutaDisco)) {
            fs.mkdirSync(rutaDisco, { recursive: true });
        }
        // 6. Escribir físicamente el archivo en el volumen Linux
        await workbook.xlsx.writeFile(rutaAbsoluta);
        console.log(`💾 [Worker Ventas] Archivo Excel guardado en: ${rutaAbsoluta}`);
        // 7. Calcular peso en MB e indexar (UPSERT)
        const stats = fs.statSync(rutaAbsoluta);
        const tamanoMb = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
        const queryIndexar = `
      INSERT INTO reportes_indexados (nombre_archivo, carpeta_id, tamano_mb, fecha_modificacion, indexado_en)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (nombre_archivo) 
      DO UPDATE SET 
        tamano_mb = EXCLUDED.tamano_mb, 
        fecha_modificacion = NOW();
    `;
        await pool.query(queryIndexar, [nombreArchivo, carpetaId, tamanoMb]);
        console.log('✅ [Worker Ventas] Índice de base de datos actualizado con éxito.');
    }
    catch (error) {
        console.error('❌ [Worker Ventas] Error crítico en la tarea:', error);
    }
    finally {
        if (connection) {
            try {
                await connection.close();
            }
            catch (err) {
                console.error(err);
            }
        }
    }
}
//# sourceMappingURL=ventas.report.js.map