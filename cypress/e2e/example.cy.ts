describe('Example Test', () => {
  it('should visit the app', () => {
    cy.visit('/')
    cy.contains('Welcome to').should('be.visible')
  })
}) 