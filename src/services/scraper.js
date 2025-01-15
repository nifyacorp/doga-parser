import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { logger } from '../utils/logger.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

export async function scrapeWebsite(url, reqId) {
  try {
    logger.debug({ reqId, url }, 'Starting RSS feed fetch');
    const response = await axios.get(url);
    logger.debug({ reqId, status: response.status }, 'RSS feed fetch completed');

    logger.debug({ reqId }, 'Parsing XML data');
    const xmlData = parser.parse(response.data);
    logger.debug({ reqId }, 'XML parsing completed');

    // Extract items from RSS feed
    const items = xmlData.rss.channel.item;
    logger.debug({ reqId, itemCount: items.length }, 'RSS items extracted');

    const processedItems = items.map(item => ({
      title: item.title,
      description: item.description,
      link: item.link,
      pubDate: item.pubDate
    }));
    logger.debug({ reqId, processedCount: processedItems.length }, 'Items processed');
    
    return JSON.stringify(processedItems, null, 2);
  } catch (error) {
    logger.error({ 
      reqId,
      error: error.message,
      stack: error.stack,
      url,
      code: error.code 
    }, 'Error scraping website');
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}