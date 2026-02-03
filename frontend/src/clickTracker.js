// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Função para registrar clique
async function registrarClick() {
    try {
        const response = await fetch(`${API_URL}/click`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            console.log('Clique registrado:', data.click);
            // Opcional: mostrar notificação
            console.log(`✅ Clique registrado de ${data.click.city}, ${data.click.country}`);
        } else {
            console.error('Erro ao registrar clique:', data.error);
        }
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
    }
}

// Adiciona evento em todos os links do WhatsApp
document.querySelectorAll('a[href^="https://wa.me"]').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault(); // Previne o comportamento padrão do link
        await registrarClick(); // Registra o click
        window.open(link.href, '_blank'); // Abre o link em nova aba
    });
});

// Função para visualizar cliques registrados (opcional, para testes)
async function obterCliques() {
    try {
        const response = await fetch(`${API_URL}/clicks`);
        const data = await response.json();
        console.log('Cliques registrados:', data);
        return data;
    } catch (error) {
        console.error('Erro ao buscar cliques:', error);
    }
}

// Função para obter estatísticas (opcional, para testes)
async function obterEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/clicks/stats`);
        const data = await response.json();
        console.log('Estatísticas:', data);
        return data;
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
    }
}
