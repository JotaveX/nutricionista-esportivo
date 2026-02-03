document.querySelectorAll('.faq-item button').forEach(button => {
    button.addEventListener('click', function() {
        const faqItem = this.closest('.faq-item');
        const content = faqItem.querySelector('.faq-content');
        const chevron = this.querySelector('[data-lucide="chevron-down"]');
        
        // Close other items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.querySelector('.faq-content').classList.add('hidden');
                item.querySelector('[data-lucide="chevron-down"]').style.transform = 'rotate(0deg)';
            }
        });
        
        // Toggle current item
        content.classList.toggle('hidden');
        chevron.style.transform = content.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    });
});