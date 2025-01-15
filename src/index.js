import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { scrapeWebsite } from './services/scraper.js';
import { processText } from './services/textProcessor.js';
import { analyzeWithOpenAI } from './services/openai.js';
import { scrapeWebsite } from './services/scraper.js';
import { randomUUID } from 'crypto';

const app = express();
const port = parseInt(process.env.PORT) || 8080;
const dogaUrl = process.env.DOGA_URL || 'https://www.xunta.gal/diario-oficial-galicia/rss/Sumario_es.rss';

// Add request ID middleware
app.use((req, res, next) => {
  req.id = randomUUID();
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  logger.debug({ 
    reqId: req.id,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body 
  }, 'Incoming request');
  next();
});

app.use(express.json());

app.post('/analyze-text', async (req, res) => {
  const reqId = req.id;
  try {
    const { text } = req.body;

    if (!text) {
      logger.debug({ reqId }, 'Missing text in request body');
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    // Step 1: Process the input text
    logger.debug({ reqId, text }, 'Processing input text');
    const cleanText = processText(text);
    logger.debug({ reqId, cleanText }, 'Text processed');

    // Step 2: Fetch and parse DOGA RSS feed
    logger.debug({ reqId, url: dogaUrl }, 'Fetching DOGA RSS feed');
    const dogaContent = await scrapeWebsite(dogaUrl);
    logger.debug({ reqId, contentLength: dogaContent.length }, 'DOGA content fetched');

    // Step 3: Combine user input with DOGA content
    logger.debug({ reqId }, 'Combining input with DOGA content');
    const combinedText = `User Query: ${cleanText}\n\nDOGA Content: ${dogaContent}`;
    logger.debug({ reqId, combinedLength: combinedText.length }, 'Content combined');

    // Step 4: Analyze with OpenAI
    logger.debug({ reqId }, 'Starting OpenAI analysis');
    const analysis = await analyzeWithOpenAI(combinedText);

    logger.debug({ reqId, analysis }, 'Analysis completed successfully');
    res.json({ analysis });
  } catch (error) {
    logger.error({ 
      reqId,
      error: error.message,
      stack: error.stack,
      code: error.code
    }, 'Error processing text request');
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});