describe('Scenarios Page', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123')
  })

  it('displays list of scenarios', () => {
    cy.visit('/scenarios')
    cy.get('[data-cy="scenario-list"]').should('exist')
    cy.get('[data-cy="scenario-card"]').should('have.length.at.least', 1)
  })

  it('allows creating a new scenario', () => {
    cy.visit('/scenarios')
    cy.get('[data-cy="create-scenario-button"]').click()
    cy.get('[data-cy="scenario-form"]').should('be.visible')
    
    cy.get('[data-cy="title-input"]').type('New Test Scenario')
    cy.get('[data-cy="description-input"]').type('New Test Description')
    cy.get('[data-cy="submit-button"]').click()

    cy.get('[data-cy="scenario-card"]').should('contain', 'New Test Scenario')
  })

  afterEach(() => {
    cy.logout()
  })
}) 