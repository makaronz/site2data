import dotenv from 'dotenv';
import config from './src/config/environments';

console.log('Testing config import...');
dotenv.config();
console.log('Config:', config);
console.log('Port:', config.port);
console.log('CORS origins:', config.corsOrigin); 