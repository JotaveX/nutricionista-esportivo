    const carousel = document.getElementById('carousel');     
    const indicators = document.querySelectorAll('.indicator');
    let currentIndex = 0;
    const totalSlides = 3;

    function updateIndicators() {
        indicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('bg-emerald-600');
                indicator.classList.remove('bg-slate-300', 'dark:bg-slate-700');
            } else {
                indicator.classList.remove('bg-emerald-600');
                indicator.classList.add('bg-slate-300');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        updateIndicators();
    }

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentIndex = index;
            carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
            updateIndicators();
        });
    });   

    // Auto-play
    setInterval(nextSlide, 5000);