import fixture from '../fixtures/practiceSoftwareTesting.json'

describe('UI Flow tests voor practicesoftwaretesting.com', () => {
    beforeEach(() => {
        cy.visit('https://practicesoftwaretesting.com/'); // Aan het begin van iedere test, open deze url
    });

    describe('E2E User flows', () => {
        it('Plaats een bestelling voor twee schroevendraaiers', () => {
            cy.contains('label', 'Screwdriver').find('input').click(); // Filter de lijst met getoonde producten op schroevendraaiers
            cy.getDataTest('filter_completed').find('a').first().click(); // Open productpagina van de eerste schroevendraaier op de pagina
            cy.contains('span', 'Screwdriver').should('be.visible'); // Assert geopende product is een schroevendraaier
            cy.getDataTest('increase-quantity').click(); // Verhoog aantal producten om toe te voegen aan winkelwagen
            cy.getDataTest('add-to-cart').click(); // Voeg producten toe aan winkelwagen
            cy.contains('div', 'Product added to shopping cart.').should('be.visible'); // Assert confirmation popup wordt getoond
            cy.contains('div', 'Product added to shopping cart.', { timeout: 6000 }).should('not.exist'); // Wacht tot confirmation popup weggaat
            cy.getDataTest('nav-cart').click(); // Ga naar de winkelwagen
            cy.get('table').find('tr').then((tr) => {
                cy.wrap(tr).find('td').eq(0).should('contain.text', 'Screwdriver'); // Assert item in winkelwagen is een schroevendraaier
                cy.wrap(tr).find('td').eq(1).find('input').invoke('val').then((val) => {
                    expect(val).to.equal('2'); // Assert aantal items is 2
                });
            });
            cy.getDataTest('proceed-1').click(); // Proceed to checkout
            cy.getDataTest('email').type(fixture.login.username); // Voer gebruikersnaam in
            cy.getDataTest('password').type(fixture.login.password); // Voer wachtwoord in
            cy.getDataTest('login-submit').click(); // Klik op Login knop
            cy.getDataTest('proceed-2').click(); // Proceed to checkout

            // Billing address invullen
            cy.getDataTest('street').clear().type(fixture.billingAddress.street);
            cy.getDataTest('city').clear().type(fixture.billingAddress.city);
            cy.getDataTest('state').clear().type(fixture.billingAddress.state);
            cy.getDataTest('country').clear().type(fixture.billingAddress.country);
            cy.getDataTest('postal_code').clear().type(fixture.billingAddress.postcode);
            cy.getDataTest('proceed-3').click();

            cy.getDataTest('payment-method').select('Cash on Delivery'); // Selecteer betaalmethode
            cy.getDataTest('finish').click();
            cy.getDataTest('payment-success-message').should('contain.text', 'Payment was successful') // Assert bevestigingsmelding wordt getoond
            cy.getDataTest('finish').click();
            cy.contains('div', 'Thanks for your order! Your invoice number is').find('span').then((span) => {
                const ordernr = span.text();
                cy.getDataTest('nav-menu').click();
                cy.contains('a', 'My invoices').click(); // Open pagina met facturen
                cy.contains('tr', ordernr).contains('a', 'Details').click(); // Open details voor zojuist geplaatste bestelling
                cy.get('table').find('tr').then((tr) => {
                    cy.wrap(tr).find('td').eq(0).should('contain.text', '2')
                    cy.wrap(tr).find('td').eq(1).should('contain.text', 'Screwdriver'); // Assert bestelde item is een schroevendraaier
                });
            })
        });

        it('Meld een retourzending aan via Contact pagina', () => {
            cy.getDataTest('nav-contact').click(); // Open contact pagina
            cy.contains('h3', 'Contact').should('be.visible'); // Assert titel Contact is zichtbaar

            // Contactgegevens invullen
            cy.getDataTest('first-name').type(fixture.contact.firstName);
            cy.getDataTest('last-name').type(fixture.contact.lastName);
            cy.getDataTest('email').type(fixture.contact.emailAddress);
            cy.getDataTest('subject').select(fixture.contact.subject);
            cy.getDataTest('message').type(fixture.contact.message);
            cy.getDataTest('attachment').selectFile(fixture.contact.attachment);

            cy.getDataTest('contact-submit').click(); // Bericht versturen
            cy.contains('div.alert-success', 'Thanks for your message! We will contact you shortly.').should('be.visible'); // Assert bevestigingspagina wordt getoond
        });
    });

    describe('Integration tests', () => {

        ['Hammer', 'Hand Saw', 'Wrench', 'Screwdriver', 'Pliers', 'Chisel', 'Measures'].forEach((categorie) => {
            it(`Door te filteren op ${categorie} worden alleen producten uit die categorie getoond`, () => {
                cy.contains('label', categorie).find('input').click(); // Filter op categorie
                cy.get('[data-test="filter_completed"]').find('a').then((producten) => {
                    const aantalProducten = producten.length;
                    for (let i = 0; i < aantalProducten; i++) {
                        cy.get('[data-test="filter_completed"]').find('a').eq(i).click(); // Bij iedere iteratie van deze for-loop wordt een volgend product geopend
                        cy.contains('span', categorie).should('be.visible'); // Assert dat product bij categorie hoort
                        cy.visit('https://practicesoftwaretesting.com/'); // Terug naar homepagina
                        cy.contains('label', categorie).find('input').click(); // Opnieuw filteren op categorie
                    }
                })
            });

            ([
                ['Price (Low - High)', 'product-price', (a, b) => a - b],
                ['Price (High - Low)', 'product-price', (a, b) => b - a],
                ['Name (A - Z)', 'product-name', (a, b) => a.localeCompare(b)],
                ['Name (Z - A)', 'product-name', (a, b) => b.localeCompare(a)]
            ] as const).forEach(([sorteerNaam, relevantAttribuut, sorteerFunctie]) => {
                it(`Door te sorteren op ${sorteerNaam} verandert de volgorde van getoonde producten`, () => {
                    cy.contains('label', categorie).find('input').click(); // De tests voor de sorteerfunctie worden voor iedere categorie uitgevoerd
                    const productLijst = []; // Array aanmaken om prijzen/namen van getoonde producten op te slaan, afhankelijk van waar op gesorteerd wordt
                    cy.get('[data-test="filter_completed"]').find('a').then((producten) => {
                        cy.wrap(producten).each((product) => { // Loop over de producten op de pagina heen en sla bij ieder product de prijs op
                            cy.wrap(product).find(`[data-test="${relevantAttribuut}"]`).then((productAttribuut) => {
                                if (relevantAttribuut === 'product-price') productLijst.push(+productAttribuut.text().slice(1));
                                if (relevantAttribuut === 'product-name') productLijst.push(productAttribuut.text());
                            });
                        }).then(() => {
                            productLijst.sort(sorteerFunctie); // pas de sorteerfunctie toe op de lijst
                            cy.getDataTest('sort').select(sorteerNaam); // Sorteer producten op de pagina op prijs oplopend
                            cy.getDataTest('sorting_completed').find('a').each((product, index) => { // Loop over de lijst met getoonde producten en controleer dat ze in verwachte volgorde staan
                                cy.wrap(product).find(`[data-test="${relevantAttribuut}"]`).should('contain.text', productLijst[index]);
                            });
                        });
                    });
                });
            });
        });
    })
})