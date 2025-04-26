/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to attach a file to an input
       * @example cy.attachFile('example.pdf')
       */
      attachFile(value: string | { fileContent: string; fileName: string; mimeType: string }): Chainable<Element>
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
    }
  }
}

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy="email-input"]').type(email)
  cy.get('[data-cy="password-input"]').type(password)
  cy.get('[data-cy="login-button"]').click()
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="logout-button"]').click()
})

export {}; 