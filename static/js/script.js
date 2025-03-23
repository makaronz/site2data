// Skrypt dla PDF Assistant

document.addEventListener('DOMContentLoaded', function() {
    // Animacja dla przycisków
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.2s';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Walidacja formularza
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(event) {
            const input = document.getElementById('input');
            if (input && input.value.trim() === '') {
                event.preventDefault();
                alert('Proszę wprowadzić URL lub ścieżkę do pliku PDF.');
            }
        });
    }
    
    // Kopiowanie podsumowania do schowka
    const summaryContents = document.querySelectorAll('.summary-content');
    summaryContents.forEach(content => {
        // Dodaj przycisk kopiowania
        const copyButton = document.createElement('button');
        copyButton.className = 'btn btn-sm btn-outline-primary mt-2';
        copyButton.textContent = 'Kopiuj do schowka';
        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText(content.textContent)
                .then(() => {
                    // Zmień tekst przycisku na potwierdzenie
                    const originalText = this.textContent;
                    this.textContent = 'Skopiowano!';
                    this.classList.add('btn-success');
                    this.classList.remove('btn-outline-primary');
                    
                    // Przywróć oryginalny tekst po 2 sekundach
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('btn-success');
                        this.classList.add('btn-outline-primary');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Błąd podczas kopiowania: ', err);
                });
        });
        
        // Dodaj przycisk po elemencie pre
        content.parentNode.appendChild(copyButton);
    });
});
