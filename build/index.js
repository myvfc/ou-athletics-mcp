#!/usr/bin/env node
import express from 'express';
import { scrapeRoster, scrapeSchedule, scrapeStats, scrapeNews, getRecentResults, getUpcomingGames, getTeamDashboard, searchPlayer, getPlayerBio, getSportSummary, getTeamComparison, getSeasonRecords, getPlayerStatsDetail, getAllSportsSummary, getGameDetails, getTopPerformers } from './scrapers/athletics.js';
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
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
        description: 'Get the roster for any NMHU sport including player details',
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
        description: 'Get the schedule for any NMHU sport',
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
        description: 'Get overview of all NMHU sports in one call',
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
];
app.get('/', (req, res) => {
    res.json({
        service: 'NMHU Athletics MCP Server',
        status: 'running',
        tools: TOOLS.length,
        available_sports: AVAILABLE_SPORTS,
        base_url: 'https://nmhuathletics.com'
    });
});
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
                    serverInfo: { name: 'nmhu-athletics-mcp', version: '1.0.0' }
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
            else if (name === 'get_top_performers') {
                data = await getTopPerformers(args.sport, args.limit || 5);
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
    console.log(`NMHU Athletics MCP Server running on port ${PORT}`);
    console.log(`Tools: ${TOOLS.length}`);
    TOOLS.forEach(tool => console.log(`  - ${tool.name}`));
});
