import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import clicksRouter from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Vercel coloca a função atrás de um único proxy reverso: confiar em 1 hop
// faz o Express calcular req.ip a partir do x-forwarded-for corretamente,
// em vez de usar o valor bruto do header (que o cliente pode forjar).
app.set('trust proxy', 1);

// Middlewares
app.use(express.json());

// Configurar CORS para aceitar múltiplas origens
// Lista padrão (prod + dev) + qualquer adicional via env var (separada por vírgula)
const allowedOrigins = [
    'https://nutricionista-esportivo.vercel.app',
    'http://localhost:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean) || []),
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS não permitido'));
        }
    },
    methods: ['GET', 'POST']
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