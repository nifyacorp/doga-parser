import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { scrapeWebsite } from './services/scraper.js';
import { processText } from './services/textProcessor.js';
import { analyzeWithOpenAI } from './services/openai.js';
import { randomUUID } from 'crypto';
import { getApiDocs } from './utils/apiDocs.js';

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

app.get('/help', (req, res) => {
  const docs = getApiDocs();
  res.json(docs);
});

app.post('/analyze-text', async (req, res) => {
  const reqId = req.id;
  try {
    // Match the BOE parser expected format
    const { texts, metadata = {}, limit = 5, date } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      logger.debug({ reqId }, 'Missing or invalid texts array in request body');
      return res.status(400).json({ error: 'Array of text prompts is required' });
    }

    // Extract user_id and subscription_id from metadata like BOE parser
    const user_id = metadata.user_id || 'unknown-user';
    const subscription_id = metadata.subscription_id || 'unknown-subscription';
    
    logger.debug({ 
      reqId, 
      user_id, 
      subscription_id, 
      textCount: texts.length,
      limit,
      date
    }, 'Processing DOGA analysis request');

    // Step 1: Fetch and parse DOGA RSS feed (do this once for all prompts)
    logger.debug({ reqId, url: dogaUrl }, 'Fetching DOGA RSS feed');
    const dogaContent = await scrapeWebsite(dogaUrl);
    logger.debug({ reqId, itemCount: dogaContent.items.length }, 'DOGA content fetched');

    const startTime = Date.now();

    // Step 2: Process each text prompt
    logger.debug({ reqId, promptCount: texts.length }, 'Processing multiple prompts');
    const results = await Promise.all(texts.map(async (text, index) => {
      // Process the input text
      logger.debug({ reqId, promptIndex: index, text }, 'Processing input text');
      const cleanText = processText(text);
      logger.debug({ reqId, promptIndex: index, cleanText }, 'Text processed');

      // Combine user input with DOGA content
      logger.debug({ reqId, promptIndex: index }, 'Combining input with DOGA content');
      const combinedText = `User Query: ${cleanText}\n\nDOGA Content: ${JSON.stringify(dogaContent.items)}`;
      logger.debug({ reqId, promptIndex: index, combinedLength: combinedText.length }, 'Content combined');

      // Analyze with OpenAI
      logger.debug({ reqId, promptIndex: index }, 'Starting OpenAI analysis');
      const analysis = await analyzeWithOpenAI(combinedText, reqId);
      logger.debug({ reqId, promptIndex: index }, 'Analysis completed');

      // Limit the number of matches if specified
      const matches = analysis.matches || [];
      const limitedMatches = limit > 0 ? matches.slice(0, limit) : matches;

      return {
        prompt: text,
        matches: limitedMatches,
        metadata: {
          ...analysis.metadata,
          user_id,
          subscription_id
        }
      };
    }));

    const processingTime = Date.now() - startTime;

    logger.debug({ reqId, resultCount: results.length }, 'All analyses completed successfully');
    
    // Format the response to match BOE parser format
    res.json({
      query_date: date || new Date().toISOString().split('T')[0],
      doga_info: dogaContent.dogaInfo,
      results,
      metadata: {
        user_id,
        subscription_id,
        total_items_processed: dogaContent.items.length,
        processing_time_ms: processingTime
      }
    });
  } catch (error) {
    logger.error({ 
      reqId,
      error: error.message,
      stack: error.stack,
      code: error.code
    }, 'Error processing text request');
    res.status(500).json({ 
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});