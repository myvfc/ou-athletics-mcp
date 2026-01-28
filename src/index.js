#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { scrapeRoster, scrapeSchedule } from './scrapers/athletics.js';
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
const server = new Server({
    name: 'nmhu-athletics-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
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
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case 'get_roster': {
                const sport = args.sport;
                const roster = await scrapeRoster(sport);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(roster, null, 2),
                        },
                    ],
                };
            }
            case 'get_schedule': {
                const sport = args.sport;
                const schedule = await scrapeSchedule(sport);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(schedule, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('NMHU Athletics MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map