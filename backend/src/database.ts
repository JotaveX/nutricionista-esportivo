import { Pool } from 'pg';
import dotenv from "dotenv";

dotenv.config()
console.log(process.env.POSTGRES_URL)
// Conexão com Postgres
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Teste de conexão
pool.connect((err, client, release) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados', err.message);
    } else {
        console.log('Conectado ao Postgres');
        release();
    }
});

// Criar tabela caso ela não exista
const initDatabase = async () => {
    try {
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clicks (
                id SERIAL PRIMARY KEY,
                count INTEGER DEFAULT 0,
                timestamp TIMESTAMP NOT NULL,
                ip VARCHAR(45),
                country VARCHAR(100),
                city VARCHAR(100),
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8)
            );
        `);

        // Verificar se a tabela está vazia
        const result = await pool.query('SELECT COUNT(*) as total FROM clicks');
        console.log('Tabela de clicks criada com sucesso');
    } catch (error) {
        console.error('Erro ao criar tabela:', error);
    }
};

// Executar inicialização
initDatabase();

export default pool;