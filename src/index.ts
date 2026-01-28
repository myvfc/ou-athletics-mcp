#!/usr/bin/env node

import express from 'express';
import { scrapeRoster, scrapeSchedule, scrapeStats, scrapeNews } from './scrapers/athletics.js';

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
    description: 'Get the schedule for any NMHU sport',
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
    name: 'get_stats',
    description: 'Get player and team statistics',
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
    name: 'get_news',
    description: 'Get latest news articles',
    inputSchema: {
      type: 'object',
      properties: {
        sport: {
          type: 'string',
          description: 'Sport name',
          enum: AVAILABLE_SPORTS,
        },
        limit: {
          type: 'number',
          description: 'Number of articles',
          default: 10
        }
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

const mcpHandler = async (req: any, res: any) => {
  const { method, params } = req.body;

  try {
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        result: {
          protocolVersion: '0.1.0',
          capabilities: { tools: {} },
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

  } catch (error: any) {
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