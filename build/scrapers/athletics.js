import { chromium } from 'playwright';
export async function scrapeRoster(sport) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(`https://nmhuathletics.com/sports/${sport}/roster`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        const players = await page.evaluate(() => {
            const playerElements = document.querySelectorAll('.sidearm-roster-player');
            return Array.from(playerElements).map(player => {
                const nameElement = player.querySelector('.sidearm-roster-player-name a');
                const positionElement = player.querySelector('.sidearm-roster-player-position');
                let position = positionElement?.textContent?.trim() || '';
                if (position) {
                    position = position.split('\n')[0].trim();
                }
                return {
                    name: nameElement?.textContent?.trim() || '',
                    jerseyNumber: player.querySelector('.sidearm-roster-player-jersey-number')?.textContent?.trim() || '',
                    position: position,
                    year: player.querySelector('.sidearm-roster-player-academic-year')?.textContent?.trim() || '',
                    hometown: player.querySelector('.sidearm-roster-player-hometown')?.textContent?.trim() || '',
                    height: player.querySelector('.sidearm-roster-player-height')?.textContent?.trim() || '',
                    highSchool: player.querySelector('.sidearm-roster-player-highschool')?.textContent?.trim() || '',
                    bioLink: nameElement?.getAttribute('href') || ''
                };
            });
        });
        return players;
    }
    finally {
        await browser.close();
    }
}
export async function scrapeSchedule(sport) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(`https://nmhuathletics.com/sports/${sport}/schedule`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        const games = await page.evaluate(() => {
            const gameElements = document.querySelectorAll('.sidearm-schedule-game');
            return Array.from(gameElements).map(game => {
                return {
                    date: game.querySelector('.sidearm-schedule-game-date')?.textContent?.trim() || '',
                    opponent: game.querySelector('.sidearm-schedule-game-opponent-name')?.textContent?.trim() || '',
                    location: game.querySelector('.sidearm-schedule-game-location')?.textContent?.trim() || '',
                    result: game.querySelector('.sidearm-schedule-game-result')?.textContent?.trim() || '',
                    score: game.querySelector('.sidearm-schedule-game-result-score')?.textContent?.trim() || ''
                };
            });
        });
        return games;
    }
    finally {
        aw;
    }
}
