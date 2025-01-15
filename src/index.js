import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { scrapeWebsite } from './services/scraper.js';
import { processText } from './services/textProcessor.js';
import { analyzeWithOpenAI } from './services/openai.js';
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
    const { texts } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      logger.debug({ reqId }, 'Missing or invalid texts array in request body');
      return res.status(400).json({ error: 'Array of text prompts is required' });
    }

    // Step 1: Fetch and parse DOGA RSS feed (do this once for all prompts)
    logger.debug({ reqId, url: dogaUrl }, 'Fetching DOGA RSS feed');
    const dogaContent = await scrapeWebsite(dogaUrl);
    logger.debug({ reqId, contentLength: dogaContent.length }, 'DOGA content fetched');

    // Step 2: Process each text prompt
    logger.debug({ reqId, promptCount: texts.length }, 'Processing multiple prompts');
    const results = await Promise.all(texts.map(async (text, index) => {
      // Process the input text
      logger.debug({ reqId, promptIndex: index, text }, 'Processing input text');
      const cleanText = processText(text);
      logger.debug({ reqId, promptIndex: index, cleanText }, 'Text processed');

      // Combine user input with DOGA content
      logger.debug({ reqId, promptIndex: index }, 'Combining input with DOGA content');
      const combinedText = `User Query: ${cleanText}\n\nDOGA Content: ${dogaContent}`;
      logger.debug({ reqId, promptIndex: index, combinedLength: combinedText.length }, 'Content combined');

      // Analyze with OpenAI
      logger.debug({ reqId, promptIndex: index }, 'Starting OpenAI analysis');
      const analysis = await analyzeWithOpenAI(combinedText, reqId);
      logger.debug({ reqId, promptIndex: index }, 'Analysis completed');

      return {
        prompt: text,
        analysis
      };
    }));

    logger.debug({ reqId, resultCount: results.length }, 'All analyses completed successfully');
    res.json({ results });
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