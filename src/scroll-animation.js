// Scroll Animations - Fade In on Scroll
document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // Se for um container com stagger, animar os filhos sequencialmente
                if (entry.target.classList.contains('stagger-reveal')) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('is-visible');
                        }, index * 150); // 150ms de delay entre cada item
                    });
                }
            }
        });
    }, observerOptions);

    // Observar todos os elementos com classe 'reveal'
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    // Observar containers com stagger
    const staggerContainers = document.querySelectorAll('.stagger-reveal');
    staggerContainers.forEach(container => {
        observer.observe(container);
        // Adicionar classe reveal aos filhos
        Array.from(container.children).forEach(child => {
            child.classList.add('reveal');
        });
    });

    // Animação para os cards de método
    const methodCards = document.querySelectorAll('#metodo .group');
    methodCards.forEach(card => {
        card.classList.add('reveal');
        observer.observe(card);
    });
});

// Smooth scroll para links de navegação
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // 80px para compensar o navbar fixo
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Adicionar classe ao navbar quando scrollar
const navbar = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});