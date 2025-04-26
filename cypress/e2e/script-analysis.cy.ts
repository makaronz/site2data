describe('Script Analysis Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('POST', '/api/script/analyze').as('analyzeScript');
    cy.intercept('WS', '/ws/script-analysis').as('websocket');
  });

  it('should upload and analyze a script successfully', () => {
    // Przygotuj przykładowy plik PDF
    cy.fixture('example.pdf', 'base64').then(fileContent => {
      cy.get('[data-testid="file-upload"]').attachFile({
        fileContent,
        fileName: 'example.pdf',
        mimeType: 'application/pdf',
      });
    });

    // Sprawdź czy plik został przesłany
    cy.wait('@analyzeScript').then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });

    // Sprawdź czy WebSocket został nawiązany
    cy.wait('@websocket').then(() => {
      cy.get('[data-testid="analysis-progress"]').should('exist');
    });

    // Sprawdź czy postęp jest wyświetlany
    cy.get('[data-testid="progress-bar"]').should('exist');
    cy.get('[data-testid="progress-message"]').should('not.be.empty');

    // Poczekaj na zakończenie analizy
    cy.get('[data-testid="analysis-complete"]', { timeout: 30000 }).should('exist');

    // Sprawdź czy wyniki są wyświetlane
    cy.get('[data-testid="analysis-results"]').should('exist');
    cy.get('[data-testid="metadata-section"]').should('exist');
    cy.get('[data-testid="scenes-section"]').should('exist');
    cy.get('[data-testid="characters-section"]').should('exist');
    cy.get('[data-testid="relationships-section"]').should('exist');
  });

  it('should handle file upload errors gracefully', () => {
    // Próba przesłania nieprawidłowego pliku
    cy.fixture('invalid.txt', 'base64').then(fileContent => {
      cy.get('[data-testid="file-upload"]').attachFile({
        fileContent,
        fileName: 'invalid.txt',
        mimeType: 'text/plain',
      });
    });

    // Sprawdź czy błąd jest wyświetlany
    cy.get('[data-testid="error-message"]')
      .should('exist')
      .and('contain', 'Nieprawidłowy format pliku');
  });

  it('should handle analysis errors gracefully', () => {
    // Symuluj błąd analizy
    cy.intercept('POST', '/api/script/analyze', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('analyzeScriptError');

    // Przesłanie pliku
    cy.fixture('example.pdf', 'base64').then(fileContent => {
      cy.get('[data-testid="file-upload"]').attachFile({
        fileContent,
        fileName: 'example.pdf',
        mimeType: 'application/pdf',
      });
    });

    // Sprawdź czy błąd jest wyświetlany
    cy.get('[data-testid="error-message"]')
      .should('exist')
      .and('contain', 'Wystąpił błąd podczas analizy');
  });

  it('should update progress in real-time', () => {
    // Przygotuj przykładowy plik PDF
    cy.fixture('example.pdf', 'base64').then(fileContent => {
      cy.get('[data-testid="file-upload"]').attachFile({
        fileContent,
        fileName: 'example.pdf',
        mimeType: 'application/pdf',
      });
    });

    // Sprawdź aktualizacje postępu
    cy.get('[data-testid="progress-bar"]').should('exist');
    
    // Sprawdź czy wartość postępu się zmienia
    let lastProgress = 0;
    cy.get('[data-testid="progress-value"]').then($progress => {
      lastProgress = parseInt($progress.text());
    });

    cy.get('[data-testid="progress-value"]', { timeout: 10000 }).should($progress => {
      const currentProgress = parseInt($progress.text());
      expect(currentProgress).to.be.greaterThan(lastProgress);
    });
  });

  it('should allow canceling analysis', () => {
    // Przygotuj przykładowy plik PDF
    cy.fixture('example.pdf', 'base64').then(fileContent => {
      cy.get('[data-testid="file-upload"]').attachFile({
        fileContent,
        fileName: 'example.pdf',
        mimeType: 'application/pdf',
      });
    });

    // Poczekaj na rozpoczęcie analizy
    cy.get('[data-testid="progress-bar"]').should('exist');

    // Kliknij przycisk anulowania
    cy.get('[data-testid="cancel-button"]').click();

    // Sprawdź czy analiza została anulowana
    cy.get('[data-testid="analysis-canceled"]').should('exist');
    cy.get('[data-testid="progress-bar"]').should('not.exist');
  });
}); 