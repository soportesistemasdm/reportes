import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config();
// Habilitar el modo Thin (nativo de Node sin librerías pesadas de C)
// En backend/src/oracleDb.ts modifica la línea de inicialización:
// En backend/src/oracleDb.ts deja la línea apuntando a /opt/oracle:
oracledb.initOracleClient({
    libDir: '/opt/oracle/instantclient_19_31'
});
export const obtenerConexionOracle = async () => {
    try {
        const connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectionString: process.env.ORACLE_CONN_STRING
        });
        return connection;
    }
    catch (error) {
        console.error('❌ Error crítico al conectar con Oracle DB:', error);
        throw error;
    }
};
export default oracledb;
//# sourceMappingURL=oracleDb.js.map