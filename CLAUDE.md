# DOGA Parser - Development Guidelines

## Build Commands
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests with vitest
- `npm run lint` - Lint JavaScript files with ESLint
- Single Test: `npm test -- path/to/test.js` (run specific test file)

## Code Style Guidelines
- **JavaScript**: Use ES modules with import/export syntax
- **Imports**: Group external packages first, then internal modules
- **Structure**: Maintain services/utils separation for clean architecture
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Formatting**: Use consistent indentation (2 spaces) and line endings
- **Error Handling**: Use try/catch blocks with structured error responses
- **Async**: Prefer async/await over promise chains
- **Logging**: Use the logger utility for all logging needs
- **Environment**: Store configuration in environment variables via secrets.js
- **API Responses**: Follow consistent JSON response format

## Important Notes
- The service processes DOGA (Diario Oficial de Galicia) content through OpenAI
- Key components: scraper.js, textProcessor.js, openai.js
- Use proper error handling for API requests and external services
- Document any new endpoints in apiDocs.js
- Ensure proper date formatting with dateFormatter.js utility