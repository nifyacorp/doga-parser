# DOGA Analysis Service

A Node.js microservice that analyzes content from the Diario Oficial de Galicia (DOGA) using OpenAI's GPT-4. The service processes user queries against the latest DOGA publications to extract relevant information and insights.

## Features

- Real-time DOGA RSS feed processing
- Natural language query processing
- AI-powered content analysis using GPT-4
- Structured JSON responses
- Cloud-native design for Google Cloud Run
- Comprehensive logging with Pino

## Architecture

The service follows a modular architecture with clear separation of concerns:

```
src/
├── index.js           # Main application entry point
├── services/         
│   ├── scraper.js     # RSS feed scraping functionality
│   ├── textProcessor.js # Text processing and cleaning
│   └── openai.js      # OpenAI integration
└── utils/
    ├── logger.js      # Logging utility
    └── secrets.js     # Secret management
```

### Key Components

- **Express Server**: Handles HTTP requests and routing
- **RSS Scraper**: Fetches and parses DOGA RSS feed
- **Text Processor**: Cleans and normalizes input text
- **OpenAI Analyzer**: Processes content using GPT-4
- **Secret Manager**: Securely handles API keys and credentials
- **Logger**: Structured logging for Cloud Run

## Prerequisites

- Node.js 18 or higher
- Google Cloud Project with Secret Manager enabled
- OpenAI API key
- Docker (for containerization)

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| PORT | Server port | No | 8080 |
| DOGA_URL | DOGA RSS feed URL | No | https://www.xunta.gal/diario-oficial-galicia/rss/Sumario_es.rss |
| GOOGLE_CLOUD_PROJECT | Google Cloud project ID | Yes | - |
| OPENAI_API_KEY | OpenAI API key (can be provided directly or stored in Secret Manager) | Yes | - |

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd doga-analysis-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the OpenAI API key (choose one method):
   
   **Option 1: Environment Variable**
   - Set the OPENAI_API_KEY environment variable directly
   
   **Option 2: Google Cloud Secret Manager**
   - Create a secret named `OPENAI_API_KEY`
   - Store your OpenAI API key in the secret

4. Build the Docker image:
   ```bash
   docker build -t doga-analysis-service .
   ```

## Deployment

### Google Cloud Run

1. Push the image to Google Container Registry:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/doga-analysis-service
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy doga-analysis-service \
     --image gcr.io/PROJECT_ID/doga-analysis-service \
     --platform managed \
     --region REGION \
     --project PROJECT_ID \
     --set-env-vars GOOGLE_CLOUD_PROJECT=PROJECT_ID
   ```

## API Usage

### Analyze Text Endpoint

`POST /analyze-text`

Analyzes multiple text queries against the latest DOGA content in parallel.

#### Request Body

```json
{
  "texts": [
    "Find all resolutions about public employment",
    "List announcements about environmental grants",
    "Show orders related to education"
  ]
}
```

#### Response

```json
{
  "results": [
    {
      "prompt": "Find all resolutions about public employment",
      "analysis": "..."
    },
    {
      "prompt": "List announcements about environmental grants",
      "analysis": "..."
    },
    {
      "prompt": "Show orders related to education",
      "analysis": "..."
    }
  ]
}
```

#### Error Response

```json
{
  "error": "Array of text prompts is required"
}
```

#### Features

- Accepts multiple prompts in a single request
- Processes all prompts in parallel for better performance
- Returns results paired with their original prompts
- Fetches DOGA content once per request to minimize external calls
- Comprehensive error handling and validation

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Lint code:
   ```bash
   npm run lint
   ```

## Docker Support

The service includes a Dockerfile for containerization:

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
ENV PORT=8080
CMD [ "npm", "start" ]
```

## Logging

The service uses Pino for structured logging, optimized for Cloud Run:

- Log levels: INFO, ERROR
- JSON format
- Request tracing
- Error stack traces
- Performance metrics

## Security

- Uses Google Cloud Secret Manager for sensitive data
- Environment variable configuration
- Input validation and sanitization
- Error handling and logging
- Container security best practices

## License

[Add your license information here]