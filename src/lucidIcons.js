// 1. Inicializar Ícones Lucide
lucide.createIcons();

// 2. Lógica de Tema (Dark/Light)
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const html = document.documentElement;

// Função para atualizar ícone
function updateIcon() {
    const isDark = html.classList.contains('dark');
    themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
}

themeToggleBtn.addEventListener('click', () => {
    html.classList.toggle('dark');
    updateIcon();
});

// Inicializar ícone correto
updateIcon();

// 3. Observer para Animações de Scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            
            // Se for um container stagger, ativa os filhos
            if (entry.target.classList.contains('stagger-reveal')) {
                const children = entry.target.children;
                Array.from(children).forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('active');
                    }, index * 100);
                });
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal, .stagger-reveal').forEach((el) => {
    observer.observe(el);
});

// 4. Lógica do FAQ (Accordion)
const faqButtons = document.querySelectorAll('.faq-item button');

faqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('svg'); // Lucide transforma o <i> em <svg>
        
        // Toggle Hidden Class
        content.classList.toggle('hidden');
        
        // Rotate Icon
        if (content.classList.contains('hidden')) {
            icon.style.transform = 'rotate(0deg)';
            btn.parentElement.classList.remove('border-emerald-500');
        } else {
            icon.style.transform = 'rotate(180deg)';
            icon.style.color = '#059669'; // Emerald 600
        }
        
        // Fechar outros (Opcional - comportamento de Accordion estrito)
        faqButtons.forEach(otherBtn => {
            if (otherBtn !== btn) {
                otherBtn.nextElementSibling.classList.add('hidden');
                const otherIcon = otherBtn.querySelector('svg');
                if(otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            }
        });
    });
});