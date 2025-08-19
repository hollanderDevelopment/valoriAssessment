describe('openWeatherApi tests', () => {
    // Voor assessment purposes hier gelaten, maar in productie-omgeving zou ik deze variabele veilig opslaan in een .env file/pipeline variables
    const appid = '18dc2ccb7c55012cdf53af5b8e1fec9a';

    describe('Happy flows: status 200s', () => {
        it('Het weerbericht voor de plaats Utrecht kan worden opgevraagd', () => {
            sendWeatherRequest('Utrecht', appid).then((response) => {
                expect(response.status).to.equal(200);
                expect(response.body.name).to.equal('Provincie Utrecht')
            });
        });

        ([
            ['Amsterdam', 2759794],
            ['Rotterdam', 2747891],
            ['Den Haag', 2747373],
            ['Groningen', 2755249]
        ] as const).forEach(([cityname, id]) => {
            it(`Bij GET request voor ${cityname} komt het id ${id} terug`, () => {
                sendWeatherRequest(cityname, appid).then((response) => {
                    expect(response.status).to.equal(200);
                    expect(response.body.id).to.equal(id);
                });
            });
        });

        it('In Rio de Janeiro gaat de zon later onder dan in Enkhuizen', () => {
            sendWeatherRequest('Rio de Janeiro', appid).then((responseRio) => {
                expect(responseRio.status).to.equal(200);
                sendWeatherRequest('Enkhuizen', appid).then((responseEnkhuizen) => {
                    expect(responseEnkhuizen.status).to.equal(200);
                    expect(responseEnkhuizen.body.sys.sunset).to.be.lessThan(responseRio.body.sys.sunset);
                });
            });
        });
    });

    describe('Foutafhandeling: status 400s', () => {
        it('Request zonder APPID geeft statuscode 401 in response', () => {
            sendWeatherRequest('Utrecht', null, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.equal(401);
                expect(response.body.message).to.contain('Invalid API key. Please see https://openweathermap.org/faq#error401 for more info')
            });
        });

        it('Request met lege plaatsnaam geeft statuscode 400 in response', () => {
            sendWeatherRequest('', appid, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.equal(400);
                expect(response.body.message).to.contain('Nothing to geocode')
            });
        });

        it('Request met niet-bestaande plaatsnaam geeft statuscode 404 in response', () => {
            sendWeatherRequest('abcdefg-stad', appid, { failOnStatusCode: false }).then((response) => {
                expect(response.status).to.equal(404);
                expect(response.body.message).to.contain('city not found')
            });
        });
    });

    function sendWeatherRequest(
        cityname: string, 
        appid: string, 
        options?: Record<string, string | number | boolean>
    ): Cypress.Chainable {
        return cy.request({
            url: 'https://api.openweathermap.org/data/2.5/weather',
            qs: { q: cityname, appid },
            ...options
        });
    }
})