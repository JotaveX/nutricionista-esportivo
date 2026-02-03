import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import clicksRouter from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Configurar CORS para aceitar múltiplas origens
const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS não permitido'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true
}));

// Rotas
app.use('/api', clicksRouter);

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'API rodando'})
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Promise rejeitada: ', error);
});