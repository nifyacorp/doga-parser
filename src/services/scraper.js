import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { logger } from '../utils/logger.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

export async function scrapeWebsite(url) {
  try {
    const response = await axios.get(url);
    const xmlData = parser.parse(response.data);

    // Extract items from RSS feed
    const items = xmlData.rss.channel.item;
    const processedItems = items.map(item => ({
      title: item.title,
      description: item.description,
      link: item.link,
      pubDate: item.pubDate
    }));
    
    return JSON.stringify(processedItems, null, 2);
  } catch (error) {
    logger.error('Error scraping website', { error: error.message, url });
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}