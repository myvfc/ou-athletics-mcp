import { scrapeRoster } from './build/scrapers/athletics.js';

console.log('Testing NMHU Athletics scraper...\n');

scrapeRoster('softball')
  .then(roster => {
    console.log(`Found ${roster.length} softball players:\n`);
    roster.slice(0, 3).forEach(player => {
      console.log(`#${player.jerseyNumber} ${player.name} - ${player.position}`);
    });
    console.log('\n✅ Test successful!');
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
  });