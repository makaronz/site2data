# Site2Data 🌐

Site2Data is an advanced platform for web content analysis and processing, leveraging artificial intelligence and machine learning for data extraction, analysis, and transformation from various internet sources.

## Key Features 🌟

- **Advanced ML Analysis**: Utilization of cutting-edge machine learning models for content analysis
- **Data Extraction**: Intelligent data extraction from various formats (PDF, HTML, text)
- **NLP Processing**: Advanced natural language processing using compromise and node-nlp libraries
- **Real-time Analysis**: Real-time data processing using Socket.IO
- **Secure Architecture**: Security implementation using Helmet and rate-limiting
- **Scalability**: Docker containerization support and workspace dependency management

## Technical Requirements 🔧

- Node.js (v18 or higher)
- MongoDB
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/site2data.git
cd site2data
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env file according to your configuration
```

4. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Available Scripts 📜

- `npm start` - Run the application
- `npm run dev` - Run in development mode with hot-reloading
- `npm test` - Run tests
- `npm run lint` - Check code for errors
- `npm run format` - Format code

## Project Structure 📁

- `/frontend` - Frontend application
- `/backend` - Node.js server
- `/tests` - Unit and integration tests
- `/docs` - Documentation
- `/tasks` - Task and process definitions
- `/templates` - Templates
- `/resources` - Static resources

## Technologies 💻

- **Backend**: Node.js, Express, MongoDB
- **ML/AI**: Transformers, LangChain, Natural
- **Tools**: Jest, ESLint, Prettier
- **Security**: Helmet, Express Rate Limit
- **UI**: TailwindCSS

## Support 💬

If you have questions or issues:
- Open an Issue on GitHub
- Check documentation in the `/docs` directory
- Contact the development team

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with �� by Site2Data Team

# Testing

## Running Tests

### E2E Tests
```bash
npm run test:e2e
```

### Component Tests
```bash
npm run test:component
```

### Opening Cypress UI
```bash
npm run test:open
```

## Test Structure

- `cypress/e2e/` - End-to-end tests
- `cypress/support/` - Support files and custom commands
- `src/**/*.cy.ts` - Component tests

## Writing Tests

### Component Tests
Component tests should be placed in the same directory as the component they test, with the `.cy.ts` extension.

Example:
```typescript
import Component from './Component.svelte'

describe('Component', () => {
  it('renders correctly', () => {
    cy.mount(Component)
    // assertions
  })
})
```

### E2E Tests
E2E tests should be placed in `cypress/e2e/` and follow the naming pattern `*.cy.ts`.

Example:
```typescript
describe('Feature', () => {
  it('should work correctly', () => {
    cy.visit('/feature')
    // interactions and assertions
  })
})
```

## Best Practices

1. Use data-cy attributes for selecting elements
2. Keep tests independent and isolated
3. Use custom commands for common operations
4. Follow the Arrange-Act-Assert pattern
5. Write descriptive test names
