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
        
        // Get header names
        const headers = Array.from(document.querySelectorAll('.stats-table thead th, .sidearm-table thead th'))
          .map(h => h.textContent?.trim() || '');
        
        // Map each cell to its header
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