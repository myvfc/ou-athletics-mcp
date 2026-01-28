#!/usr/bin/env node
/**
 * NMHU Athletics MCP Server (HTTP Version)
 * Provides roster and schedule data for all NMHU sports
 */
import express from 'express';
import { scrapeRoster, scrapeSchedule } from './scrapers/athletics.js';
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
        description: 'Get the roster for any NMHU sport including player details (name, number, position, year, hometown, height, high school)',
        inputSchema: {
            type: 'object',
            properties: {
                sport: {
                    type: 'string',
                    description: 'Sport name',
                    enum: AVAILABLE_SPORTS,
                },
            },
            required: ['sport'],
        },
    },
    {
        name: 'get_schedule',
        description: 'Get the schedule for any NMHU sport including past and upcoming games',
        inputSchema: {
            type: 'object',
            properties: {
                sport: {
                    type: 'string',
                    description: 'Sport name',
                    enum: AVAILABLE_SPORTS,
                },
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
                    capabilities: {
                        tools: {}
                    },
                    serverInfo: {
                        name: 'nmhu-athletics-mcp',
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
            let data;
            if (name === 'get_roster') {
                const sport = args.sport;
                console.log(`Scraping roster for: ${sport}`);
                data = await scrapeRoster(sport);
            }
            else if (name === 'get_schedule') {
                const sport = args.sport;
                console.log(`Scraping schedule for: ${sport}`);
                data = await scrapeSchedule(sport);
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
app.post('/', mcpHandler);
app.post('/mcp', mcpHandler);
app.listen(PORT, () => {
    console.log(`🏈⚾🏀 NMHU Athletics MCP Server running on port ${PORT}`);
    console.log(`Available sports: ${AVAILABLE_SPORTS.length}`);
    console.log('\nAvailable tools:');
    TOOLS.forEach(tool => {
        console.log(`  - ${tool.name}`);
    });
});
