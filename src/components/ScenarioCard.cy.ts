import ScenarioCard from './ScenarioCard.svelte'

describe('ScenarioCard', () => {
  const scenario = {
    id: '1',
    title: 'Test Scenario',
    description: 'Test Description',
    status: 'active',
    createdAt: new Date().toISOString(),
  }

  it('renders correctly', () => {
    cy.mount(ScenarioCard, { props: { scenario } })
    cy.get('[data-cy="scenario-title"]').should('contain', scenario.title)
    cy.get('[data-cy="scenario-description"]').should('contain', scenario.description)
  })

  it('emits edit event when edit button is clicked', () => {
    const onEdit = cy.stub()
    cy.mount(ScenarioCard, { props: { scenario, onEdit } })
    cy.get('[data-cy="edit-button"]').click()
    cy.wrap(onEdit).should('have.been.calledWith', scenario.id)
  })
}) 