import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { scrapeWebsite } from './services/scraper.js';
import { processText } from './services/textProcessor.js';
import { analyzeWithOpenAI } from './services/openai.js';
import { scrapeWebsite } from './services/scraper.js';

const app = express();
const port = parseInt(process.env.PORT) || 8080;
const dogaUrl = process.env.DOGA_URL || 'https://www.xunta.gal/diario-oficial-galicia/rss/Sumario_es.rss';

app.use(express.json());

app.post('/analyze-text', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    // Step 1: Process the input text
    logger.info('Processing input text');
    const cleanText = processText(text);

    // Step 2: Fetch and parse DOGA RSS feed
    logger.info('Fetching DOGA RSS feed');
    const dogaContent = await scrapeWebsite(dogaUrl);

    // Step 3: Combine user input with DOGA content
    logger.info('Combining input with DOGA content');
    const combinedText = `User Query: ${cleanText}\n\nDOGA Content: ${dogaContent}`;

    // Step 4: Analyze with OpenAI
    logger.info('Analyzing text with OpenAI');
    const analysis = await analyzeWithOpenAI(combinedText);

    logger.info('Analysis completed successfully', { analysis });
    res.json({ analysis });
  } catch (error) {
    logger.error('Error processing text request', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});