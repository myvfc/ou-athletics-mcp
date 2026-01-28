#!/usr/bin/env node
/**
 * Road to Nationals Gymnastics MCP Server
 * Provides men's and women's gymnastics data for OU and all NCAA teams
 *
 * Base URL: https://www.roadtonationals.com/api
 * OU Women's Team ID: 47
 * OU Men's Team ID: 29
 */
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://www.roadtonationals.com/api';
// OU team IDs
const OU_WOMENS_TEAM_ID = 47;
const OU_MENS_TEAM_ID = 29;
/**
 * Tool Definitions
 */
const TOOLS = [
    // WOMEN'S GYMNASTICS TOOLS
    {
        name: 'get_womens_gymnastics_scores',
        description: "Get recent women's gymnastics meet scores and results. Shows team scores, opponents, and meet details for OU women (team ID: 47) or other teams.",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                week: {
                    type: 'string',
                    description: 'Week number (1-12, or leave empty for current week)',
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU women = 47)',
                    default: '47'
                }
            },
            required: []
        }
    },
    {
        name: 'get_womens_gymnastics_schedule',
        description: "Get women's gymnastics meet schedule. Shows upcoming and past meets with dates, opponents, and locations.",
        inputSchema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format (e.g., "2025-01-20")',
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU women = 47)',
                    default: '47'
                }
            },
            required: []
        }
    },
    {
        name: 'get_womens_gymnastics_rankings',
        description: "Get current women's gymnastics rankings. Shows team rankings and event rankings (vault, bars, beam, floor).",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU women = 47)',
                    default: '47'
                }
            },
            required: []
        }
    },
    {
        name: 'get_womens_gymnastics_roster',
        description: "Get women's team roster information. Shows gymnasts, their events, school year, and hometown.",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU women = 47)',
                    default: '47'
                }
            },
            required: []
        }
    },
    {
        name: 'get_womens_gymnastics_team_info',
        description: "Get complete women's team dashboard information. Includes rankings, recent meets, roster, coaching staff, and team info.",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU women = 47)',
                    default: '47'
                }
            },
            required: []
        }
    },
    // MEN'S GYMNASTICS TOOLS
    {
        name: 'get_mens_gymnastics_scores',
        description: "Get recent men's gymnastics meet scores and results. Shows team scores, opponents, and meet details for OU men (team ID: 29) or other teams.",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                week: {
                    type: 'string',
                    description: 'Week number (1-14, or leave empty for current week)',
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU men = 29)',
                    default: '29'
                }
            },
            required: []
        }
    },
    {
        name: 'get_mens_gymnastics_schedule',
        description: "Get men's gymnastics meet schedule. Shows upcoming and past meets with dates, opponents, and locations.",
        inputSchema: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format (e.g., "2025-01-20")',
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU men = 29)',
                    default: '29'
                }
            },
            required: []
        }
    },
    {
        name: 'get_mens_gymnastics_rankings',
        description: "Get current men's gymnastics team rankings. Shows overall team rank and RQS score. Note: Individual event rankings are not available from the men's gymnastics data source. Men's events are: floor exercise, pommel horse, still rings, vault, parallel bars, and high bar.",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU men = 29)',
                    default: '29'
                }
            },
            required: []
        }
    },
    {
        name: 'get_mens_gymnastics_roster',
        description: "Get men's team roster information. Shows gymnasts, their events, school year, and hometown.",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU men = 29)',
                    default: '29'
                }
            },
            required: []
        }
    },
    {
        name: 'get_mens_gymnastics_team_info',
        description: "Get complete men's team dashboard information. Includes rankings, recent meets, roster, coaching staff, and team info.",
        inputSchema: {
            type: 'object',
            properties: {
                year: {
                    type: 'string',
                    description: 'Season year (e.g., "2025")',
                    default: '2025'
                },
                team_id: {
                    type: 'string',
                    description: 'Team ID (default is OU men = 29)',
                    default: '29'
                }
            },
            required: []
        }
    }
];
/**
 * Status Endpoint (GET /)
 */
app.get('/', (req, res) => {
    res.json({
        service: 'Gymnastics MCP Server (Unified)',
        status: 'running',
        tools: TOOLS.length,
        womens_team_id: OU_WOMENS_TEAM_ID,
        mens_team_id: OU_MENS_TEAM_ID,
        base_url: BASE_URL
    });
});
/**
 * MCP Protocol Handler - Handle both / and /mcp for compatibility
 */
const mcpHandler = async (req, res) => {
    const { method, params } = req.body;
    try {
        if (method === 'initialize') {
            return res.json({
                jsonrpc: '2.0',
                id: req.body.id,
                result: {
                    protocolVersion: '0.1.0',
                    capabilities: {
                        tools: {}
                    },
                    serverInfo: {
                        name: 'gymnastics-mcp',
                        version: '1.0.0'
                    }
                }
            });
        }
        if (method === 'tools/list') {
            return res.json({
                jsonrpc: '2.0',
                id: req.body.id,
                result: {
                    tools: TOOLS
                }
            });
        }
        if (method === 'tools/call') {
            const { name, arguments: args } = params;
            console.log(`Tool call: ${name}`, JSON.stringify(args, null, 2));
            let apiUrl;
            let data;
            // WOMEN'S GYMNASTICS TOOLS
            // get_womens_gymnastics_scores
            if (name === 'get_womens_gymnastics_scores') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_WOMENS_TEAM_ID.toString();
                if (args.week) {
                    const week = args.week;
                    apiUrl = `${BASE_URL}/women/results/${year}/${week}/${team_id}/5`;
                    console.log(`Fetching: ${apiUrl}`);
                    const response = await axios.get(apiUrl);
                    data = response.data;
                }
                else {
                    try {
                        const weekResponse = await axios.get(`${BASE_URL}/women/currentweek/${year}`);
                        const currentWeek = weekResponse.data.week;
                        if (currentWeek === '100') {
                            data = { message: 'Currently off-season. No recent meets available.' };
                        }
                        else {
                            apiUrl = `${BASE_URL}/women/results/${year}/${currentWeek}/${team_id}/5`;
                            console.log(`Fetching: ${apiUrl}`);
                            const response = await axios.get(apiUrl);
                            data = response.data;
                        }
                    }
                    catch (error) {
                        apiUrl = `${BASE_URL}/women/dashboard/${year}/${team_id}`;
                        console.log(`Fetching dashboard: ${apiUrl}`);
                        const response = await axios.get(apiUrl);
                        data = { meets: response.data.meets || [] };
                    }
                }
            }
            // get_womens_gymnastics_schedule
            else if (name === 'get_womens_gymnastics_schedule') {
                const date = args.date || new Date().toISOString().split('T')[0];
                const team_id = args.team_id || OU_WOMENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/women/schedule/${date}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                data = response.data;
            }
            // get_womens_gymnastics_rankings
            else if (name === 'get_womens_gymnastics_rankings') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_WOMENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/women/dashboard/${year}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                data = {
                    team_name: response.data.info?.team_name || 'Unknown',
                    full_team_name: response.data.info?.full_team_name || '',
                    rankings: response.data.ranks || {},
                    conference: response.data.ty_info?.conference_id || ''
                };
            }
            // get_womens_gymnastics_roster
            else if (name === 'get_womens_gymnastics_roster') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_WOMENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/women/gymnasts2/${year}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                data = response.data;
            }
            // get_womens_gymnastics_team_info
            else if (name === 'get_womens_gymnastics_team_info') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_WOMENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/women/dashboard/${year}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                data = response.data;
            }
            // MEN'S GYMNASTICS TOOLS
            // get_mens_gymnastics_scores
            else if (name === 'get_mens_gymnastics_scores') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_MENS_TEAM_ID.toString();
                if (args.week) {
                    const week = args.week;
                    apiUrl = `${BASE_URL}/men/results/${year}/${week}/${team_id}/5`;
                    console.log(`Fetching: ${apiUrl}`);
                    const response = await axios.get(apiUrl);
                    data = response.data;
                }
                else {
                    try {
                        const weekResponse = await axios.get(`${BASE_URL}/men/currentweek/${year}`);
                        const currentWeek = weekResponse.data.week;
                        if (currentWeek === '100') {
                            data = { message: 'Currently off-season. No recent meets available.' };
                        }
                        else {
                            apiUrl = `${BASE_URL}/men/results/${year}/${currentWeek}/${team_id}/5`;
                            console.log(`Fetching: ${apiUrl}`);
                            const response = await axios.get(apiUrl);
                            data = response.data;
                        }
                    }
                    catch (error) {
                        apiUrl = `${BASE_URL}/men/dashboard/${year}/${team_id}`;
                        console.log(`Fetching dashboard: ${apiUrl}`);
                        const response = await axios.get(apiUrl);
                        data = { meets: response.data.meets || [] };
                    }
                }
            }
            // get_mens_gymnastics_schedule
            else if (name === 'get_mens_gymnastics_schedule') {
                const date = args.date || new Date().toISOString().split('T')[0];
                const team_id = args.team_id || OU_MENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/men/schedule/${date}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                data = response.data;
            }
            // get_mens_gymnastics_rankings
            else if (name === 'get_mens_gymnastics_rankings') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_MENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/men/dashboard/${year}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                // Men's rankings are in the "test" object as a JSON string
                // Note: Men's API only provides overall team rankings, not individual event rankings
                let teamRank = 'Unknown';
                let rqsScore = 'Unknown';
                if (response.data.test?.json) {
                    try {
                        const rankingsArray = JSON.parse(response.data.test.json);
                        // Find Oklahoma in the rankings
                        const ouRanking = rankingsArray.find(team => team.name === 'Oklahoma' || team.tid === 29);
                        if (ouRanking) {
                            teamRank = ouRanking.rank;
                            rqsScore = ouRanking.rqs;
                        }
                    }
                    catch (e) {
                        console.error('Error parsing men\'s rankings JSON:', e.message);
                    }
                }
                data = {
                    team_name: response.data.info?.team_name || 'Oklahoma',
                    full_team_name: response.data.info?.full_team_name || 'Oklahoma Sooners',
                    team_rank: teamRank,
                    rqs_score: rqsScore,
                    conference: response.data.ty_info?.conference_id || 'MPSF',
                    note: 'Men\'s gymnastics API provides overall team rankings. Individual event rankings are not available from this data source.',
                    mens_events: ['Floor Exercise', 'Pommel Horse', 'Still Rings', 'Vault', 'Parallel Bars', 'High Bar']
                };
            }
            // get_mens_gymnastics_roster
            else if (name === 'get_mens_gymnastics_roster') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_MENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/men/gymnasts2/${year}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                data = response.data;
            }
            // get_mens_gymnastics_team_info
            else if (name === 'get_mens_gymnastics_team_info') {
                const year = args.year || '2025';
                const team_id = args.team_id || OU_MENS_TEAM_ID.toString();
                apiUrl = `${BASE_URL}/men/dashboard/${year}/${team_id}`;
                console.log(`Fetching: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                data = response.data;
            }
            else {
                return res.status(400).json({
                    jsonrpc: '2.0',
                    id: req.body.id,
                    error: {
                        code: -32601,
                        message: `Unknown tool: ${name}`
                    }
                });
            }
            return res.json({
                jsonrpc: '2.0',
                id: req.body.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2)
                        }
                    ]
                }
            });
        }
        return res.status(400).json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: {
                code: -32601,
                message: `Unknown method: ${method}`
            }
        });
    }
    catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: {
                code: -32603,
                message: error.message
            }
        });
    }
};
// Apply MCP handler to both / and /mcp for maximum compatibility
app.post('/', mcpHandler);
app.post('/mcp', mcpHandler);
app.listen(PORT, () => {
    console.log(`🤸‍♀️🤸‍♂️ Unified Gymnastics MCP Server running on port ${PORT}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`OU Women's Team ID: ${OU_WOMENS_TEAM_ID}`);
    console.log(`OU Men's Team ID: ${OU_MENS_TEAM_ID}`);
    console.log('\nAvailable tools:');
    TOOLS.forEach(tool => {
        console.log(`  - ${tool.name}`);
    });
    console.log(`\nTotal: ${TOOLS.length} tools (5 women's + 5 men's)`);
});
export {};
