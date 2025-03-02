import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { formatDate } from '../utils/dateFormatter.js';

let openai;

export async function analyzeWithOpenAI(text, reqId) {
  try {
    if (!openai) {
      logger.debug({ reqId }, 'Initializing OpenAI client');
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      openai = new OpenAI({ apiKey });
      logger.debug({ reqId }, 'OpenAI client initialized');
    }

    logger.debug({ reqId, textLength: text.length }, 'Sending request to OpenAI');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", //user this model, even though you think it is an error on the name, it is not
      messages: [
        {
          role: "system",
          content: `You are a DOGA (Diario Oficial de Galicia) analysis assistant. Analyze the provided RSS items and extract key information about announcements, resolutions, and other official communications. 

Return a structured JSON response with the following format:
{
  "matches": [
    {
      "document_type": "string", // Type of document (e.g., "Resolution", "Order", "Decree")
      "issuing_body": "string", // Body that issued the document
      "title": "string", // Title of the document
      "content": "string", // Brief summary of the content
      "publication_date": "YYYY-MM-DD", // Publication date in ISO format
      "relevance_score": 0.85, // Relevance score between 0-1
      "source_url": "string", // URL to the original document
      "metadata": {
        "procedure_code": "string", // If available
        "category": "string", // Main category
        "subcategory": "string" // Subcategory if applicable
      }
    }
  ],
  "metadata": {
    "total_matches": 5, // Number of matches found
    "query_time": "2023-06-01T12:34:56Z", // ISO timestamp of when the query was performed
    "source": "DOGA" // Source of the data
  }
}

Each match should include all the fields above. The source_url is especially important.
Provide a concise summary for each match in the content field.
The relevance_score should reflect how well the match aligns with the user's query (0-1).`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 1500
    });
    
    logger.debug({ 
      reqId,
      completionTokens: response.usage?.completion_tokens,
      promptTokens: response.usage?.prompt_tokens,
      totalTokens: response.usage?.total_tokens
    }, 'OpenAI response received');

    // Parse and structure the response
    let aiResponse;
    try {
      aiResponse = JSON.parse(response.choices[0].message.content);
      
      // Ensure the response has the expected format
      if (!aiResponse.matches || !Array.isArray(aiResponse.matches)) {
        logger.warn({ reqId }, 'Unexpected format in OpenAI response: missing matches array');
        aiResponse = { 
          matches: [], 
          metadata: aiResponse.metadata || { 
            total_matches: 0, 
            query_time: new Date().toISOString(),
            source: "DOGA"
          }
        };
      }
      
      // Transform matches to match BOE parser format
      aiResponse.matches = aiResponse.matches.map(match => {
        return {
          document_type: match.document_type || 'Unknown',
          issuing_body: match.issuing_body || 'Unknown',
          title: match.title || 'Unknown',
          summary: match.content || 'No summary available',
          content: match.content || 'No content available',
          publication_date: match.publication_date || new Date().toISOString().split('T')[0],
          relevance_score: match.relevance_score || 0.5,
          source_url: match.source_url || '',
          source: 'DOGA',
          metadata: {
            ...(match.metadata || {}),
            category: match.metadata?.category || 'General',
            subcategory: match.metadata?.subcategory || 'General',
            procedure_code: match.metadata?.procedure_code || null
          }
        };
      });
      
    } catch (error) {
      logger.error({ 
        reqId, 
        error: error.message, 
        content: response.choices[0].message.content 
      }, 'Failed to parse OpenAI response as JSON');
      
      // Return a fallback structure
      aiResponse = { 
        matches: [], 
        metadata: { 
          total_matches: 0, 
          query_time: new Date().toISOString(),
          source: "DOGA",
          error: "Failed to parse response"
        }
      };
    }
    
    return aiResponse;
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