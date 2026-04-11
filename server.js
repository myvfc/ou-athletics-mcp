#!/usr/bin/env node
import express from 'express';
import { scrapeRoster, scrapeSchedule, scrapeNews, getRecentResults, getUpcomingGames, getTeamDashboard, searchPlayer, getPlayerBio, getSportSummary, getTeamComparison, getSeasonRecords, getPlayerStats, getPlayerStatsDetail, getAllSportsSummary, getGameDetails, getTopPerformers, getTeamInfo, getDepthChart, getInjuries, getStandings, getRecruiting, getRecruitingByPosition } from './build/scrapers/athletics.js'

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─── DEBUG ENV VARS AT STARTUP ────────────────────────────────────────────────
console.log("🔍 ENV KEYS:", Object.keys(process.env).filter(k => !k.includes('npm') && !k.includes('NODE') && !k.includes('PATH')));
console.log("🔑 CFBD_API_KEY present:", !!process.env.CFBD_API_KEY);
console.log("🏫 SCHOOL_ESPN_SLUG:", process.env.SCHOOL_ESPN_SLUG);
console.log("🏫 SCHOOL_CFBD_NAME:", process.env.SCHOOL_CFBD_NAME);

// ─── SUPABASE CLIENT (dynamic import to prevent crash) ────────────────────────
let supabase = null;
(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase connected');
  } catch (err) {
    console.error('❌ Supabase init failed:', err.message);
  }
})();
// ─────────────────────────────────────────────────────────────────────────────

// ─── HEARTBEAT ────────────────────────────────────────────────────────────────
setInterval(() => {
  console.log("💓 OU Athletics heartbeat", new Date().toISOString());
}, 60_000);
// ─────────────────────────────────────────────────────────────────────────────

const AVAILABLE_SPORTS = [
    'football',
    'baseball',
    'softball',
    'mens-basketball',
    'womens-basketball',
    'mens-cross-country',
    'womens-cross-country',
    'womens-soccer',
    'womens-volleyball',
    'womens-track-and-field',
    'wrestling'
];

const TOOLS = [
    {
        name: 'get_roster',
        description: 'Get the roster for any OU sport including player details',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_schedule',
        description: 'Get the schedule for any OU sport',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_stats',
        description: 'Get player and team statistics',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_news',
        description: 'Get latest news articles',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                limit: { type: 'number', description: 'Number of articles', default: 10 }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_recent_results',
        description: 'Get the last 5 game results',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                limit: { type: 'number', description: 'Number of results', default: 5 }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_upcoming_games',
        description: 'Get upcoming games',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                limit: { type: 'number', description: 'Number of games', default: 5 }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_team_dashboard',
        description: 'Get complete team overview',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS }
            },
            required: ['sport'],
        },
    },
    {
        name: 'search_player',
        description: 'Search for a player',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                searchTerm: { type: 'string', description: 'Search term' }
            },
            required: ['sport', 'searchTerm'],
        },
    },
    {
        name: 'get_player_bio',
        description: 'Get player biography',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                playerName: { type: 'string', description: 'Player name' }
            },
            required: ['sport', 'playerName'],
        },
    },
    {
        name: 'get_sport_summary',
        description: 'Get quick sport summary',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_team_comparison',
        description: 'Compare two sports teams',
        inputSchema: {
            type: 'object',
            properties: {
                sport1: { type: 'string', description: 'First sport', enum: AVAILABLE_SPORTS },
                sport2: { type: 'string', description: 'Second sport', enum: AVAILABLE_SPORTS }
            },
            required: ['sport1', 'sport2'],
        },
    },
    {
        name: 'get_season_records',
        description: 'Get win/loss records for the season',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_player_stats_detail',
        description: 'Get detailed stats for a specific player',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                playerName: { type: 'string', description: 'Player name' }
            },
            required: ['sport', 'playerName'],
        },
    },
    {
        name: 'get_all_sports_summary',
        description: 'Get overview of all OU sports in one call',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'get_game_details',
        description: 'Get details about a specific game',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                opponent: { type: 'string', description: 'Opponent name' }
            },
            required: ['sport', 'opponent'],
        },
    },
    {
        name: 'get_top_performers',
        description: 'Get top statistical performers',
        inputSchema: {
            type: 'object',
            properties: {
                sport: { type: 'string', description: 'Sport name', enum: AVAILABLE_SPORTS },
                limit: { type: 'number', description: 'Number of players', default: 5 }
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_team_info',
        description: 'Get team info: record, colors, stadium, conference, mascot',
        inputSchema: { type: 'object', properties: { sport: { type: 'string', enum: AVAILABLE_SPORTS } }, required: ['sport'] },
    },
    {
        name: 'get_depth_chart',
        description: 'Get current depth chart showing starters and backups at each position',
        inputSchema: { type: 'object', properties: { sport: { type: 'string', enum: AVAILABLE_SPORTS } }, required: ['sport'] },
    },
    {
        name: 'get_injuries',
        description: 'Get current injury report listing injured players, status, and details',
        inputSchema: { type: 'object', properties: { sport: { type: 'string', enum: AVAILABLE_SPORTS } }, required: ['sport'] },
    },
    {
        name: 'get_standings',
        description: 'Get conference standings showing win/loss records and rankings',
        inputSchema: { type: 'object', properties: { sport: { type: 'string', enum: AVAILABLE_SPORTS } }, required: ['sport'] },
    },
    {
        name: 'get_player_stats',
        description: 'Get season statistical leaders by category',
        inputSchema: { type: 'object', properties: { sport: { type: 'string', enum: AVAILABLE_SPORTS }, category: { type: 'string', default: 'passing' } }, required: ['sport'] },
    },
    {
        name: 'get_recruiting',
        description: 'Get recruiting class info: ranking, commits, star ratings, positions, hometowns',
        inputSchema: { type: 'object', properties: { year: { type: 'number' } }, required: [] },
    },
    {
        name: 'get_recruiting_by_position',
        description: 'Get recruiting commits filtered by position (QB, RB, WR, OL, DB, etc.)',
        inputSchema: { type: 'object', properties: { position: { type: 'string' }, year: { type: 'number' } }, required: ['position'] },
    },
];

// ─── NEWS SYNC FUNCTION ───────────────────────────────────────────────────────
const NEWS_SPORTS = ['football', 'softball', 'mens-basketball', 'womens-basketball', 'baseball'];

async function syncNewsToSupabase() {
  if (!supabase) {
    console.error('❌ Supabase not initialized, skipping sync');
    return { inserted: 0, skipped: 0 };
  }
  console.log(`📰 News sync started: ${new Date().toISOString()}`);
  let inserted = 0;
  let skipped = 0;

  for (const sport of NEWS_SPORTS) {
    try {
      console.log(`📰 Scraping news for: ${sport}`);
      const articles = await scrapeNews(sport, 5);

      for (const article of articles) {
        if (!article.title || !article.link) continue;

        const { data: existing } = await supabase
          .from('xsen_news')
          .select('id')
          .eq('source', article.link)
          .limit(1);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from('xsen_news').insert([{
          school: 'sooners',
          category: 'general',
          title: article.title,
          body: article.title,
          source: article.link,
          active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]);

        if (error) {
          console.error(`❌ Insert error for ${article.title}:`, error.message);
        } else {
          inserted++;
          console.log(`✅ Inserted: ${article.title}`);
        }
      }
    } catch (err) {
      console.error(`❌ Failed to sync news for ${sport}:`, err.message);
    }
  }

  console.log(`📰 News sync complete — inserted: ${inserted}, skipped: ${skipped}`);
  return { inserted, skipped };
}

// ─── 4-HOUR CRON JOB ─────────────────────────────────────────────────────────
const FOUR_HOURS = 4 * 60 * 60 * 1000;
setTimeout(async () => {
  await syncNewsToSupabase();
  setInterval(syncNewsToSupabase, FOUR_HOURS);
}, 30000);
// ─────────────────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => {
    res.json({
        service: 'OU Athletics MCP Server',
        status: 'running',
        tools: TOOLS.length,
        available_sports: AVAILABLE_SPORTS,
        base_url: 'https://soonersports.com'
    });
});

// ─── SYNC NEWS ENDPOINTS ──────────────────────────────────────────────────────
app.post('/sync-news', async (req, res) => {
  try {
    console.log(`📰 Manual news sync triggered`);
    const result = await syncNewsToSupabase();
    res.json({ status: 'ok', ...result });
  } catch (err) {
    console.error('❌ Sync error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/sync-news', async (req, res) => {
  try {
    const result = await syncNewsToSupabase();
    res.json({ status: 'ok', ...result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

const mcpHandler = async (req, res) => {
    const { method, params } = req.body;
    try {
        if (method === 'initialize') {
            return res.json({
                jsonrpc: '2.0',
                id: req.body.id,
                result: {
                    protocolVersion: '0.1.0',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'ou-athletics-mcp', version: '1.0.0' }
                }
            });
        }
        if (method === 'tools/list') {
            return res.json({
                jsonrpc: '2.0',
                id: req.body.id,
                result: { tools: TOOLS }
            });
        }
        if (method === 'tools/call') {
            const { name, arguments: args } = params;
            console.log(`Tool call: ${name}`, JSON.stringify(args, null, 2));
            let data;
            if (name === 'get_roster') {
                data = await scrapeRoster(args.sport);
            }
            else if (name === 'get_schedule') {
                data = await scrapeSchedule(args.sport);
            }
            else if (name === 'get_stats') {
                data = await scrapeStats(args.sport);
            }
            else if (name === 'get_news') {
                data = await scrapeNews(args.sport, args.limit || 10);
            }
            else if (name === 'get_recent_results') {
                data = await getRecentResults(args.sport, args.limit || 5);
            }
            else if (name === 'get_upcoming_games') {
                data = await getUpcomingGames(args.sport, args.limit || 5);
            }
            else if (name === 'get_team_dashboard') {
                data = await getTeamDashboard(args.sport);
            }
            else if (name === 'search_player') {
                data = await searchPlayer(args.sport, args.searchTerm);
            }
            else if (name === 'get_player_bio') {
                data = await getPlayerBio(args.sport, args.playerName);
            }
            else if (name === 'get_sport_summary') {
                data = await getSportSummary(args.sport);
            }
            else if (name === 'get_team_comparison') {
                data = await getTeamComparison(args.sport1, args.sport2);
            }
            else if (name === 'get_season_records') {
                data = await getSeasonRecords(args.sport);
            }
            else if (name === 'get_player_stats_detail') {
                data = await getPlayerStatsDetail(args.sport, args.playerName);
            }
            else if (name === 'get_all_sports_summary') {
                data = await getAllSportsSummary();
            }
            else if (name === 'get_game_details') {
                data = await getGameDetails(args.sport, args.opponent);
            }
            else if (name === 'get_stats') {
                data = await scrapeRoster(args.sport); // legacy fallback
            }
            else if (name === 'get_top_performers') {
                data = await getTopPerformers(args.sport, args.limit || 5);
            }
            else if (name === 'get_team_info') {
                data = await getTeamInfo(args.sport);
            }
            else if (name === 'get_depth_chart') {
                data = await getDepthChart(args.sport);
            }
            else if (name === 'get_injuries') {
                data = await getInjuries(args.sport);
            }
            else if (name === 'get_standings') {
                data = await getStandings(args.sport);
            }
            else if (name === 'get_player_stats') {
                data = await getPlayerStats(args.sport, args.category || 'passing');
            }
            else if (name === 'get_recruiting') {
                data = await getRecruiting(args.year);
            }
            else if (name === 'get_recruiting_by_position') {
                data = await getRecruitingByPosition(args.position, args.year);
            }
            else {
                return res.status(400).json({
                    jsonrpc: '2.0',
                    id: req.body.id,
                    error: { code: -32601, message: `Unknown tool: ${name}` }
                });
            }
            return res.json({
                jsonrpc: '2.0',
                id: req.body.id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
                }
            });
        }
        return res.status(400).json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: { code: -32601, message: `Unknown method: ${method}` }
        });
    }
    catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: { code: -32603, message: error.message }
        });
    }
};

app.post('/', mcpHandler);
app.post('/mcp', mcpHandler);

app.listen(PORT, () => {
    console.log(`OU Athletics MCP Server running on port ${PORT}`);
    console.log(`Tools: ${TOOLS.length}`);
    TOOLS.forEach(tool => console.log(`  - ${tool.name}`));
});


