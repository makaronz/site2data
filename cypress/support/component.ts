import { mount } from '@cypress/svelte'
import '../../src/app.css'

Cypress.Commands.add('mount', mount)

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
} 