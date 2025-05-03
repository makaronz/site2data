import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentConfig {
  port: number;
  corsOrigin: string[];
  maxFileSize: number;
  allowedFileTypes: string[];
  rateLimit: {
    api: {
      windowMs: number;
      max: number;
    };
    upload: {
      windowMs: number;
      max: number;
    };
    ws: {
      windowMs: number;
      max: number;
    };
  };
}

const development: EnvironmentConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3002', 'http://localhost:5173'],
  maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 10 * 1024 * 1024,
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : ['application/pdf', 'text/plain'],
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      max: 10,
    },
    ws: {
      windowMs: 60 * 1000,
      max: 30,
    },
  },
};

const production: EnvironmentConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [],
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ['application/pdf', 'text/plain'],
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1000,
      max: 50,
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      max: 5,
    },
    ws: {
      windowMs: 60 * 1000,
      max: 15,
    },
  },
};

const config = process.env.NODE_ENV === 'production' ? production : development;

export default config; 