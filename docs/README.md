# Site2Data Documentation

## Project Structure

### Backend (`site2data-backend/`)
- `src/controllers/` - Request handlers and business logic
- `src/models/` - Database models and schemas
- `src/utils/` - Helper functions and utilities
- `src/script_analysis/` - Script analysis modules
- `src/config/` - Configuration files

### Frontend (`site2data-frontend/`)
- `src/routes/` - SvelteKit routes and pages
- `src/lib/` - Shared components and utilities

## Configuration
Configuration files are stored in the `config/` directory. The application uses different configuration files for different environments:
- `default.json` - Default configuration
- `development.json` - Development environment settings
- `production.json` - Production environment settings

## Data Storage
- `data/` - Application data storage
  - `uploads/` - User uploaded files
  - `temp/` - Temporary files

## Development
See `CONTRIBUTING.md` for development guidelines and setup instructions. 