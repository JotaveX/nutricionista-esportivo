import { Router } from 'express';
import pool from './database';
import { GeoLocationService } from './geoLocation';

const router = Router();

// Rota para incrementar o contador de cliques
router.post('/click', async (req, res) => {
    try {
        // Obter IP do cliente
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipString = Array.isArray(ip) ? ip[0] : ip;

        // Obter geolocalização
        const geoLocation = await GeoLocationService.getLocationByIp(ipString);

        // Incrementar contador global
        await pool.query('UPDATE clicks SET count = count + 1 WHERE id = 1');

        // Criar timestamp ajustado manualmente para BRT (UTC-3)
        const agora = new Date();
        
        // Pega o horário local do sistema (que está certo: 02:01)
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');
        const hora = String(agora.getHours()).padStart(2, '0');
        const minuto = String(agora.getMinutes()).padStart(2, '0');
        const segundo = String(agora.getSeconds()).padStart(2, '0');
        const ms = String(agora.getMilliseconds()).padStart(3, '0');
        
        // Monta string no formato ISO sem conversão (timestamp como está no sistema)
        const timestampLocal = `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}.${ms}`;

        // Inserir novo clique com metadados
        const query = `
            INSERT INTO clicks (timestamp, ip, country, city, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const values = [
            timestampLocal, // Salva o horário local sem conversão
            ipString,
            geoLocation?.country || 'Desconhecido',
            geoLocation?.city || 'Desconhecido',
            geoLocation?.latitude || null,
            geoLocation?.longitude || null
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            click: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar click:', error);
        res.status(500).json({
            success: false, 
            error: 'Erro ao registrar click'
        });
    }
});

// Rota para consultar todos os cliques
router.get('/clicks', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                timestamp,
                ip,
                country,
                city,
                latitude,
                longitude
            FROM clicks 
            ORDER BY timestamp DESC 
            LIMIT 100
        `);

        // Formatar dados para resposta mais legível
        const clicksFormatados = result.rows.map(click => {
            const data = new Date(click.timestamp);
            
            // Formata direto do valor do banco (sem conversão de timezone)
            const horaLocal = data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            return {
                id: click.id,
                data_hora: horaLocal,
                ip: click.ip,
                localizacao: {
                    pais: click.country,
                    cidade: click.city,
                    coordenadas: click.latitude && click.longitude 
                        ? `${click.latitude}, ${click.longitude}` 
                        : 'N/A'
                }
            };
        });

        res.set('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify({
            success: true,
            total_cliques: result.rows.length,
            atualizado_em: new Date().toLocaleString('pt-BR'),
            cliques: clicksFormatados
        }, null, 2)); // null, 2 = indentação bonita
    } catch (error) {
        console.error('Erro ao buscar clicks:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar clicks' 
        });
    }
});

// Rota para estatísticas dos cliques
router.get('/clicks/stats', async (req, res) => {
    try {
        // Estatísticas gerais
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_clicks,
                COUNT(DISTINCT country) as paises,
                COUNT(DISTINCT ip) as ips_unicos
            FROM clicks
        `);

        // Top 5 países
        const topPaises = await pool.query(`
            SELECT 
                country as pais,
                COUNT(*) as total
            FROM clicks
            WHERE country != 'Localhost'
            GROUP BY country
            ORDER BY total DESC
            LIMIT 5
        `);

        // Top 5 cidades
        const topCidades = await pool.query(`
            SELECT 
                city as cidade,
                country as pais,
                COUNT(*) as total
            FROM clicks
            WHERE city != 'Desenvolvimento'
            GROUP BY city, country
            ORDER BY total DESC
            LIMIT 5
        `);

        // Cliques por dia (últimos 7 dias)
        const clicksPorDia = await pool.query(`
            SELECT 
                DATE(timestamp) as data,
                COUNT(*) as total
            FROM clicks
            WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(timestamp)
            ORDER BY data DESC
        `);

        const stats = statsResult.rows[0];

        res.set('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify({
            success: true,
            resumo: {
                total_cliques: parseInt(stats.total_clicks),
                total_paises: parseInt(stats.paises),
                ips_unicos: parseInt(stats.ips_unicos)
            },
            top_paises: topPaises.rows,
            top_cidades: topCidades.rows,
            cliques_por_dia: clicksPorDia.rows.map(row => ({
                data: new Date(row.data).toLocaleDateString('pt-BR'),
                total: parseInt(row.total)
            })),
            atualizado_em: new Date().toLocaleString('pt-BR')
        }, null, 2));
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao buscar estatísticas' 
        });
    }
});

export default router;