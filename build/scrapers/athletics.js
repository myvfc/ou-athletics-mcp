import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'https://soonersports.com';

export async function scrapeRoster(sport) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const url = `${BASE_URL}/sports/${sport}/roster`;
        console.log(`🚨 DEBUG scrapeRoster - BASE_URL: ${BASE_URL}`);
        console.log(`🚨 DEBUG scrapeRoster - Full URL: ${url}`);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(5000);
        console.log(`🚨 DEBUG scrapeRoster - Navigation complete, current URL: ${page.url()}`);
        const baseUrl = BASE_URL;
        const players = await page.evaluate((baseUrl) => {
            const playerElements = document.querySelectorAll('.sidearm-roster-player, .s-person-card');
            return Array.from(playerElements).map(player => {
                const nameElement = player.querySelector('.sidearm-roster-player-name a, .s-person-details__personal-details-name a');
                const positionElement = player.querySelector('.sidearm-roster-player-position, .s-person-details__personal-details-position');
                let position = positionElement?.textContent?.trim() || '';
                if (position) {
                    position = position.split('\n')[0].trim();
                }
                const href = nameElement?.getAttribute('href') || '';
                const bioLink = href
                    ? (href.startsWith('http') ? href : `${baseUrl}${href}`)
                    : '';

                const imgElement = player.querySelector('.sidearm-roster-player-image img, .s-person-card__image img, img[src*="roster"], img[data-src*="roster"]');
                const imgSrc = imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src') || '';
                const imageUrl = imgSrc
                    ? (imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc}`)
                    : '';

                return {
                    name: nameElement?.textContent?.trim() || '',
                    jerseyNumber: player.querySelector('.sidearm-roster-player-jersey-number, [data-jersey]')?.textContent?.trim() || '',
                    position: position,
                    year: player.querySelector('.sidearm-roster-player-academic-year, .s-person-details__personal-details-academic-year')?.textContent?.trim() || '',
                    hometown: player.querySelector('.sidearm-roster-player-hometown, .s-person-details__personal-details-hometown')?.textContent?.trim() || '',
                    height: player.querySelector('.sidearm-roster-player-height, .s-person-details__personal-details-height')?.textContent?.trim() || '',
                    highSchool: player.querySelector('.sidearm-roster-player-highschool, .s-person-details__personal-details-highschool')?.textContent?.trim() || '',
                    bioLink: bioLink,
                    imageUrl: imageUrl
                };
            });
        }, baseUrl);
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
        const url = `${BASE_URL}/sports/${sport}/schedule`;
        console.log(`🚨 DEBUG scrapeSchedule - Full URL: ${url}`);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(5000);
        const games = await page.evaluate(() => {
            const gameElements = document.querySelectorAll('.sidearm-schedule-game, .s-game-capsule');
            return Array.from(gameElements).map(game => {
                return {
                    date: game.querySelector('.sidearm-schedule-game-date, .s-game-capsule__date')?.textContent?.trim() || '',
                    opponent: game.querySelector('.sidearm-schedule-game-opponent-name, .s-game-capsule__opponent-name')?.textContent?.trim() || '',
                    location: game.querySelector('.sidearm-schedule-game-location, .s-game-capsule__location')?.textContent?.trim() || '',
                    result: game.querySelector('.sidearm-schedule-game-result, .s-game-capsule__result')?.textContent?.trim() || '',
                    score: game.querySelector('.sidearm-schedule-game-result-score, .s-game-capsule__score')?.textContent?.trim() || ''
                };
            });
        });
        return games;
    }
    finally {
        await browser.close();
    }
}

export async function scrapeStats(sport) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const url = `${BASE_URL}/sports/${sport}/stats`;
        console.log(`🚨 DEBUG scrapeStats - Full URL: ${url}`);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(5000);
        const stats = await page.evaluate(() => {
            const statRows = document.querySelectorAll('.stats-table tbody tr, .sidearm-table tbody tr');
            return Array.from(statRows).map(row => {
                const cells = row.querySelectorAll('td');
                const player = cells[0]?.textContent?.trim() || '';
                const stats = {};
                const headers = Array.from(document.querySelectorAll('.stats-table thead th, .sidearm-table thead th'))
                    .map(h => h.textContent?.trim() || '');
                cells.forEach((cell, index) => {
                    if (index > 0 && headers[index]) {
                        stats[headers[index]] = cell.textContent?.trim() || '';
                    }
                });
                return { player, stats };
            });
        });
        return stats;
    }
    finally {
        await browser.close();
    }
}

export async function scrapeNews(sport, limit = 10) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const url = `${BASE_URL}/sports/${sport}/archives`;
        console.log(`🚨 DEBUG scrapeNews - Full URL: ${url}`);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(5000);
        const news = await page.evaluate((args) => {
            const { maxArticles, baseUrl } = args;
            const seen = new Set();
            const links = Array.from(document.querySelectorAll('a[href*="/news/"], a[href*="/sports/"]'))
                .filter(a => {
                    const href = a.getAttribute('href') || '';
                    return (href.includes('/news/20') || href.includes('/sports/20')) && !seen.has(href) && seen.add(href);
                })
                .slice(0, maxArticles);

            return links.map(link => {
                const href = link.getAttribute('href') || '';
                const dateMatch = href.match(/\/news\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//);
                let date = '';
                if (dateMatch) {
                    const [, year, month, day] = dateMatch;
                    date = `${month}/${day}/${year}`;
                }
                const rawTitle = link.textContent?.trim() || '';
                const title = rawTitle.length > 5
                    ? rawTitle
                    : href.split('/').pop().replace(/-/g, ' ');
                return {
                    title: title,
                    date: date,
                    summary: '',
                    link: href.startsWith('http') ? href : `${baseUrl}${href}`
                };
            });
        }, { maxArticles: limit, baseUrl: BASE_URL });
        return news;
    }
    finally {
        await browser.close();
    }
}

export async function getRecentResults(sport, limit = 5) {
    const schedule = await scrapeSchedule(sport);
    return schedule
        .filter(game => game.result !== '' || game.score !== '')
        .slice(0, limit);
}

export async function getUpcomingGames(sport, limit = 5) {
    const schedule = await scrapeSchedule(sport);
    return schedule
        .filter(game => game.result === '' && game.score === '')
        .slice(0, limit);
}

export async function getTeamDashboard(sport) {
    const [roster, schedule, stats, news] = await Promise.all([
        scrapeRoster(sport),
        scrapeSchedule(sport),
        scrapeStats(sport),
        scrapeNews(sport, 5)
    ]);
    const recentGames = schedule
        .filter(g => g.result !== '' || g.score !== '')
        .slice(0, 5);
    const upcomingGames = schedule
        .filter(g => g.result === '' && g.score === '')
        .slice(0, 5);
    return {
        sport: sport,
        teamSize: roster.length,
        roster: roster,
        recentResults: recentGames,
        upcomingGames: upcomingGames,
        stats: stats.slice(0, 10),
        latestNews: news
    };
}

export async function searchPlayer(sport, searchTerm) {
    const roster = await scrapeRoster(sport);
    const term = searchTerm.toLowerCase();
    return roster.filter(player => player.name.toLowerCase().includes(term) ||
        player.hometown.toLowerCase().includes(term) ||
        player.position.toLowerCase().includes(term) ||
        player.jerseyNumber === searchTerm);
}

export async function getPlayerBio(sport, playerName) {
    const roster = await scrapeRoster(sport);
    const player = roster.find(p => p.name.toLowerCase().includes(playerName.toLowerCase()));
    return player || null;
}

export async function getSportSummary(sport) {
    const [roster, news, schedule] = await Promise.all([
        scrapeRoster(sport),
        scrapeNews(sport, 3),
        scrapeSchedule(sport)
    ]);
    const nextGame = schedule.find(g => g.result === '' && g.score === '');
    const lastGame = schedule.reverse().find(g => g.result !== '' || g.score !== '');
    return {
        sport: sport,
        rosterSize: roster.length,
        nextGame: nextGame || null,
        lastResult: lastGame || null,
        recentNews: news
    };
}

export async function getTeamComparison(sport1, sport2) {
    const [roster1, roster2, news1, news2] = await Promise.all([
        scrapeRoster(sport1),
        scrapeRoster(sport2),
        scrapeNews(sport1, 3),
        scrapeNews(sport2, 3)
    ]);
    return {
        team1: { sport: sport1, rosterSize: roster1.length, recentNews: news1 },
        team2: { sport: sport2, rosterSize: roster2.length, recentNews: news2 }
    };
}

export async function getSeasonRecords(sport) {
    const schedule = await scrapeSchedule(sport);
    const wins = schedule.filter(g => g.result.toLowerCase().includes('w') ||
        g.result.toLowerCase().includes('win')).length;
    const losses = schedule.filter(g => g.result.toLowerCase().includes('l') ||
        g.result.toLowerCase().includes('loss')).length;
    const ties = schedule.filter(g => g.result.toLowerCase().includes('t') ||
        g.result.toLowerCase().includes('tie')).length;
    return {
        sport: sport,
        wins: wins,
        losses: losses,
        ties: ties,
        totalGames: wins + losses + ties,
        winPercentage: wins + losses > 0 ? (wins / (wins + losses) * 100).toFixed(1) : '0',
        upcomingGames: schedule.filter(g => !g.result && !g.score).length
    };
}

export async function getPlayerStatsDetail(sport, playerName) {
    const [player, stats] = await Promise.all([
        getPlayerBio(sport, playerName),
        scrapeStats(sport)
    ]);
    const playerStats = stats.find(s => s.player.toLowerCase().includes(playerName.toLowerCase()));
    return { player: player, statistics: playerStats || null };
}

export async function getAllSportsSummary() {
    const sports = [
        'football', 'baseball', 'softball',
        'mens-basketball', 'womens-basketball',
        'womens-volleyball', 'womens-soccer'
    ];
    const summaries = await Promise.all(sports.map(async (sport) => {
        try {
            return await getSportSummary(sport);
        } catch (error) {
            return { sport: sport, error: 'Unable to fetch data' };
        }
    }));
    return summaries;
}

export async function getGameDetails(sport, opponent) {
    const schedule = await scrapeSchedule(sport);
    const game = schedule.find(g => g.opponent.toLowerCase().includes(opponent.toLowerCase()));
    return game || null;
}

export async function getTopPerformers(sport, limit = 5) {
    const stats = await scrapeStats(sport);
    return {
        sport: sport,
        topPerformers: stats.slice(0, limit),
        totalPlayers: stats.length
    };
}


