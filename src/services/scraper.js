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

    const channel = xmlData.rss.channel;
    const items = channel.item;
    const dogaInfo = {
      issue_number: channel.description.match(/Diario núm, (\d+)/)?.[1] || '',
      publication_date: formatDate(channel.pubDate),
      source_url: channel.link
    };

    logger.debug({ reqId, itemCount: items.length }, 'RSS items extracted');

    const processedItems = items.map(item => ({
      title: item.title,
      description: item.description,
      link: item.link,
      pubDate: formatDate(item.pubDate),
      category: item.description.split('</br>')[0].trim(),
      subcategory: item.description.split('</br>')[1].trim()
    }));

    logger.debug({ reqId, processedCount: processedItems.length }, 'Items processed');
    
    return {
      items: processedItems,
      dogaInfo
    };
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