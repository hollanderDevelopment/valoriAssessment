declare namespace Cypress {
    interface Chainable {
        getDataTest(selector: string): Chainable<JQuery<HTMLElement>>;
    }
}