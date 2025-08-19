Cypress.Commands.add('getDataTest', (selector) => {
    return cy.get(`[data-test="${selector}"]`);
})