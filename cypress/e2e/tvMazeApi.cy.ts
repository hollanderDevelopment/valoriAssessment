describe('tvMazeApi tests', () => {
    it('Informatie over breaking bad kan opgevraagd worden via het ID', () => {
        // Zoek de serie breaking bad op
        cy.request({
            url: 'https://api.tvmaze.com/search/shows',
            qs: { q: 'Breaking bad' },
        }).then((responseSearchShows) => {
            // Sla het eerste show id uit de response op in een variabele
            const showId = responseSearchShows.body[0].show.id;
            // Gebruik het show id om een 2e request te doen en breaking bad show informatie op te halen
            cy.request(`https://api.tvmaze.com/shows/${showId}`).then((responseShowMainInformation) => {
                // Test dat in het response een property URL zit die het id bevat
                expect(responseShowMainInformation.body.url).to.be.a('string').and.include(showId);
            });
        });        
    });
})