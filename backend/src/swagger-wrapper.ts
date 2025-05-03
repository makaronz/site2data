import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerPath = path.join(__dirname, 'swagger.json');
const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
const swaggerDocument = JSON.parse(swaggerContent);

export default swaggerDocument; 