import { chromium } from 'playwright';

// CONFIGURATION: Read base URL from environment variable
const BASE_URL = process.env.BASE_URL || 'https://soonersports.com';
console.log('🚨 DEBUG MODULE LOAD - BASE_URL value:', BASE_URL);
console.log('🚨 DEBUG MODULE LOAD - process.env.BASE_URL:', process.env.BASE_URL);

export interface Player {
  name: string;
  jerseyNumber: string;
  position: string;
  year: string;
  hometown: string;
  height: string;
  highSchool: string;
  bioLink: string;
}

export interface Game {
  date: string;
  opponent: string;
  location: string;
  result: string;
  score: string;
}

export interface Stat {
  player: string;
  stats: Record<string, string>;
}

export interface NewsArticle {
  title: string;
  date: string;
  summary: string;
  link: string;
}

export async function scrapeRoster(sport: string): Promise<Player[]> {
  console.log('🚨 DEBUG scrapeRoster - Called with sport:', sport);
  console.log('🚨 DEBUG scrapeRoster - BASE_URL:', BASE_URL);
  console.log('🚨 DEBUG scrapeRoster - Full URL:', `${BASE_URL}/sports/${sport}/roster`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const fullUrl = `${BASE_URL}/sports/${sport}/roster`;
    console.log('🚨 DEBUG scrapeRoster - About to navigate to:', fullUrl);
    
    await page.goto(fullUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('🚨 DEBUG scrapeRoster - Navigation complete, current URL:', page.url());
    
    // Wait for EITHER OU format OR NMHU format to load
    // Try OU format first (s-person-card), then fallback to NMHU (sidearm-roster-player)
    try {
      await page.waitForSelector('.s-person-card, .sidearm-roster-player', { timeout: 10000 });
      console.log('🚨 DEBUG scrapeRoster - Player elements loaded');
    } catch (e) {
      console.log('🚨 DEBUG scrapeRoster - No player elements found after waiting');
    }
    
    const players = await page.evaluate((baseUrl) => {
      // Try OU format first
      const ouPlayerCards = document.querySelectorAll('.s-person-card');
      
      if (ouPlayerCards.length > 0) {
        console.log('🔍 Using OU format selectors, found', ouPlayerCards.length, 'cards');
        
        return Array.from(ouPlayerCards).map(card => {
          // Find the name and link
          const nameLink = card.querySelector('.s-person-details__personal-single-line a.hoverunderline');
          const name = nameLink?.textContent?.trim() || '';
          
          // Get bio link
          const bioHref = nameLink?.getAttribute('href') || '';
          const bioLink = bioHref ? (bioHref.startsWith('http') ? bioHref : `${baseUrl}${bioHref}`) : '';
          
          // Extract other details from the card
          // OU structure has details in various s-person-details divs
          const detailsText = card.textContent || '';
          
          // Try to extract jersey number (usually appears near the name)
          const jerseyMatch = detailsText.match(/#(\d+)/);
          const jerseyNumber = jerseyMatch ? jerseyMatch[1] : '';
          
          // Try to extract position, year, hometown from text
          // These are harder to parse reliably in OU's format
          // We'll do our best with the text content
          const lines = detailsText.split('\n').map(l => l.trim()).filter(l => l);
          
          return {
            name: name,
            jerseyNumber: jerseyNumber,
            position: '', // OU doesn't clearly separate this
            year: '', // OU doesn't clearly separate this
            hometown: '', // OU doesn't clearly separate this
            height: '',
            highSchool: '',
            bioLink: bioLink
          };
        });
      }
      
      // Fallback to NMHU/Sidearm format
      const sidearmPlayers = document.querySelectorAll('.sidearm-roster-player');
      
      if (sidearmPlayers.length > 0) {
        console.log('🔍 Using Sidearm format selectors, found', sidearmPlayers.length, 'players');
        
        return Array.from(sidearmPlayers).map(player => {
          const nameElement = player.querySelector('.sidearm-roster-player-name a');
          const positionElement = player.querySelector('.sidearm-roster-player-position');
          
          let position = positionElement?.textContent?.trim() || '';
          if (position) {
            position = position.split('\n')[0].trim();
          }
          
          // Extract URL from data-player-url attribute
          let dataUrl = player.getAttribute('data-player-url') || '';
          let bioLink = '';
          if (dataUrl) {
            dataUrl = dataUrl.trim().replace(/[^a-zA-Z0-9/]+$/, '');
            bioLink = `${baseUrl}${dataUrl}`;
          }
          
          return {
            name: nameElement?.textContent?.trim() || '',
            jerseyNumber: player.querySelector('.sidearm-roster-player-jersey-number')?.textContent?.trim() || '',
            position: position,
            year: player.querySelector('.sidearm-roster-player-academic-year')?.textContent?.trim() || '',
            hometown: player.querySelector('.sidearm-roster-player-hometown')?.textContent?.trim() || '',
            height: player.querySelector('.sidearm-roster-player-height')?.textContent?.trim() || '',
            highSchool: player.querySelector('.sidearm-roster-player-highschool')?.textContent?.trim() || '',
            bioLink: bioLink
          };
        });
      }
      
      console.log('🔍 No players found with either format');
      return [];
    }, BASE_URL);
    
    console.log('🚨 DEBUG scrapeRoster - Found', players.length, 'players');
    if (players.length > 0) {
      console.log('🚨 DEBUG scrapeRoster - First player:', JSON.stringify(players[0]));
    }
    
    return players;
  } finally {
    await browser.close();
  }
}

export async function scrapeSchedule(sport: string): Promise<Game[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/sports/${sport}/schedule`, {
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
  } finally {
    await browser.close();
  }
}

export async function scrapeStats(sport: string): Promise<Stat[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/sports/${sport}/stats`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const stats = await page.evaluate(() => {
      const statRows = document.querySelectorAll('.stats-table tbody tr, .sidearm-table tbody tr');
      
      return Array.from(statRows).map(row => {
        const cells = row.querySelectorAll('td');
        const player = cells[0]?.textContent?.trim() || '';
        const stats: Record<string, string> = {};
        
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
  } finally {
    await browser.close();
  }
}

export async function scrapeNews(sport: string, limit: number = 10): Promise<NewsArticle[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/sports/${sport}/archives`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    
    const news = await page.evaluate(
      ({ maxArticles, baseUrl }: { maxArticles: number; baseUrl: string }) => {
        const archiveArticle = document.querySelector('article.sidearm-archives');
        
        if (!archiveArticle) {
          return [];
        }
        
        const links = Array.from(archiveArticle.querySelectorAll('a'))
          .filter(a => {
            const href = a.getAttribute('href') || '';
            return href.includes('/news/');
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
          
          return {
            title: link.textContent?.trim() || '',
            date: date,
            summary: '',
            link: href.startsWith('http') ? href : `${baseUrl}${href}`
          };
        });
      },
      { maxArticles: limit, baseUrl: BASE_URL }
    );
    
    return news;
  } finally {
    await browser.close();
  }
}

export async function getRecentResults(sport: string, limit: number = 5): Promise<Game[]> {
  const schedule = await scrapeSchedule(sport);
  
  return schedule
    .filter(game => {
      return game.result !== '' || game.score !== '';
    })
    .slice(0, limit);
}

export async function getUpcomingGames(sport: string, limit: number = 5): Promise<Game[]> {
  const schedule = await scrapeSchedule(sport);
  
  return schedule
    .filter(game => {
      return game.result === '' && game.score === '';
    })
    .slice(0, limit);
}

export async function getTeamDashboard(sport: string): Promise<any> {
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

export async function searchPlayer(sport: string, searchTerm: string): Promise<Player[]> {
  const roster = await scrapeRoster(sport);
  const term = searchTerm.toLowerCase();
  
  return roster.filter(player => 
    player.name.toLowerCase().includes(term) ||
    player.hometown.toLowerCase().includes(term) ||
    player.position.toLowerCase().includes(term) ||
    player.jerseyNumber === searchTerm
  );
}

export async function getPlayerBio(sport: string, playerName: string): Promise<Player | null> {
  const roster = await scrapeRoster(sport);
  const player = roster.find(p => 
    p.name.toLowerCase().includes(playerName.toLowerCase())
  );
  
  return player || null;
}

export async function getSportSummary(sport: string): Promise<any> {
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

export async function getTeamComparison(sport1: string, sport2: string): Promise<any> {
  const [roster1, roster2, news1, news2] = await Promise.all([
    scrapeRoster(sport1),
    scrapeRoster(sport2),
    scrapeNews(sport1, 3),
    scrapeNews(sport2, 3)
  ]);
  
  return {
    team1: {
      sport: sport1,
      rosterSize: roster1.length,
      recentNews: news1
    },
    team2: {
      sport: sport2,
      rosterSize: roster2.length,
      recentNews: news2
    }
  };
}

export async function getSeasonRecords(sport: string): Promise<any> {
  const schedule = await scrapeSchedule(sport);
  
  const wins = schedule.filter(g => 
    g.result.toLowerCase().includes('w') || 
    g.result.toLowerCase().includes('win')
  ).length;
  
  const losses = schedule.filter(g => 
    g.result.toLowerCase().includes('l') || 
    g.result.toLowerCase().includes('loss')
  ).length;
  
  const ties = schedule.filter(g => 
    g.result.toLowerCase().includes('t') || 
    g.result.toLowerCase().includes('tie')
  ).length;
  
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

export async function getPlayerStatsDetail(sport: string, playerName: string): Promise<any> {
  const [player, stats] = await Promise.all([
    getPlayerBio(sport, playerName),
    scrapeStats(sport)
  ]);
  
  const playerStats = stats.find(s => 
    s.player.toLowerCase().includes(playerName.toLowerCase())
  );
  
  return {
    player: player,
    statistics: playerStats || null
  };
}

export async function getAllSportsSummary(): Promise<any[]> {
  const sports = [
    'football', 'baseball', 'softball', 
    'mens-basketball', 'womens-basketball',
    'womens-volleyball', 'womens-soccer'
  ];
  
  const summaries = await Promise.all(
    sports.map(async (sport) => {
      try {
        const summary = await getSportSummary(sport);
        return summary;
      } catch (error) {
        return {
          sport: sport,
          error: 'Unable to fetch data'
        };
      }
    })
  );
  
  return summaries;
}

export async function getGameDetails(sport: string, opponent: string): Promise<Game | null> {
  const schedule = await scrapeSchedule(sport);
  
  const game = schedule.find(g => 
    g.opponent.toLowerCase().includes(opponent.toLowerCase())
  );
  
  return game || null;
}

export async function getTopPerformers(sport: string, limit: number = 5): Promise<any> {
  const stats = await scrapeStats(sport);
  
  return {
    sport: sport,
    topPerformers: stats.slice(0, limit),
    totalPlayers: stats.length
  };
}
