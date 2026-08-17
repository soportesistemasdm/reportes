import pkg from 'pg';
const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL || 'postgresql://sap_admin:sap_password_secure@postgres_db:5432/sap_reports';
const pool = new Pool({
    connectionString,
});
// Función para probar la conexión con reintentos automáticos
const conectarConReintentos = async (intentosRestantes = 5) => {
    try {
        const client = await pool.connect();
        console.log('🐘 [PostgreSQL] ¡Conexión exitosa y piscina lista!');
        client.release(); // Devolver el cliente a la piscina
    }
    catch (err) {
        if (intentosRestantes === 0) {
            console.error('❌ Error crítico definitivo al conectar a PostgreSQL:', err.message);
            process.exit(1); // Apagar el servidor si ya falló demasiadas veces
        }
        console.warn(`⚠️ [PostgreSQL] No disponible aún (${err.message}). Reintentando en 3 segundos... (Intentos restantes: ${intentosRestantes})`);
        setTimeout(() => conectarConReintentos(intentosRestantes - 1), 3000);
    }
};
// Iniciar el ciclo de conexión
conectarConReintentos();
pool.on('error', (err) => {
    console.error('❌ Error inesperado en el cliente de PostgreSQL:', err.message);
});
export default pool;
//# sourceMappingURL=db.js.map