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
  {
    name: 'get_stats',
    description: 'Get player and team statistics for any NMHU sport',
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
    description: 'Get latest news articles for any NMHU sport',
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
          description: 'Number of articles to return (default: 10)',
          default: 10
        }
      },
      required: ['sport'],
    },
  },
];

app.get('