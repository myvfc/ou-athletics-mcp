import { chromium } from 'playwright';

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
  } finally {
    await browser.close();
  }
}

export async function scrapeSchedule(sport: string): Promise<Game[]> {
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
  } finally {
    await browser.close();
  }
}

export async function scrapeStats(sport: string): Promise<Stat[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(`https://nmhuathletics.com/sports/${sport}/stats`, {
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
    await page.goto(`https://nmhuathletics.com/sports/${sport}/archives`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const news = await page.evaluate((maxArticles) => {
      const articles = document.querySelectorAll('.sidearm-news-article, article');
      
      return Array.from(articles).slice(0, maxArticles).map(article => {
        const titleEl = article.querySelector('h3 a, h2 a, .title a');
        const dateEl = article.querySelector('.date, time, .published-date');
        const summaryEl = article.querySelector('.summary, .excerpt, p');
        
        return {
          title: titleEl?.textContent?.trim() || '',
          date: dateEl?.textContent?.trim() || '',
          summary: summaryEl?.textContent?.trim() || '',
          link: titleEl?.getAttribute('href') || ''
        };
      });
    }, limit);
    
    return news;
  } finally {
    await browser.close();
  }
}