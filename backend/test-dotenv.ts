import dotenv from 'dotenv';

console.log('Testing dotenv...');
dotenv.config();
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY); 