import cron from 'node-cron';
// 📥 Importamos los generadores de forma modular
import { generarReporteVentas } from './reportes/ventas.report.js';


// CRON Opción A: Ejecutar todos en paralelo cada hora
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 [ORQUESTADOR] Iniciando tanda horaria de reportes...');
  
  // Ejecutamos en paralelo para optimizar tiempo de CPU
  await Promise.allSettled([
    generarReporteVentas(),
  ]);

  console.log('🏁 [ORQUESTADOR] Todos los reportes de la tanda han terminado.');
});

