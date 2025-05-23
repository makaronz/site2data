import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

console.log('Testing express import...');
dotenv.config();

const app = express();
console.log('Express app created successfully');

app.use(cors());
console.log('CORS middleware added');

app.use(express.json());
console.log('JSON middleware added');

console.log('Express setup complete!');