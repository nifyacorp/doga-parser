import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { getSecret } from '../utils/secrets.js';

let openai;

export async function analyzeWithOpenAI(text, reqId) {
  try {
    if (!openai) {
      logger.debug({ reqId }, 'Initializing OpenAI client');
      const apiKey = await getSecret('OPENAI_API_KEY');
      openai = new OpenAI({ apiKey });
      logger.debug({ reqId }, 'OpenAI client initialized');
    }

    logger.debug({ reqId, textLength: text.length }, 'Sending request to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a DOGA (Diario Oficial de Galicia) analysis assistant. Analyze the provided RSS items and extract key information about announcements, resolutions, and other official communications. Focus on identifying: 1) Type of document (order, resolution, announcement) 2) Issuing body 3) Main subject matter 4) Key dates 5) Relevant procedure codes if present."
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 500
    });
    logger.debug({ 
      reqId,
      completionTokens: response.usage?.completion_tokens,
      promptTokens: response.usage?.prompt_tokens,
      totalTokens: response.usage?.total_tokens
    }, 'OpenAI response received');

    return response.choices[0].message.content;
  } catch (error) {
    logger.error({ 
      reqId,
      error: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.status
    }, 'Error analyzing with OpenAI');
    throw new Error(`Failed to analyze with OpenAI: ${error.message}`);
  }
}