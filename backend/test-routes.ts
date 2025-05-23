import dotenv from 'dotenv';

console.log('Testing route imports...');
dotenv.config();

try {
  console.log('Testing scriptAnalysis route...');
  const scriptAnalysisRoutes = await import('./src/routes/scriptAnalysis');
  console.log('✅ scriptAnalysis imported successfully');
} catch (error) {
  console.log('❌ scriptAnalysis failed:', error.message);
}

try {
  console.log('Testing pdfRoutes...');
  const pdfRoutes = await import('./src/routes/pdfRoutes');
  console.log('✅ pdfRoutes imported successfully');
} catch (error) {
  console.log('❌ pdfRoutes failed:', error.message);
}

try {
  console.log('Testing apiTest route...');
  const apiTestRoutes = await import('./src/routes/apiTest');
  console.log('✅ apiTest imported successfully');
} catch (error) {
  console.log('❌ apiTest failed:', error.message);
}

try {
  console.log('Testing validateOpenAiKey...');
  const validateOpenAiKey = await import('./src/routes/validateOpenAiKey');
  console.log('✅ validateOpenAiKey imported successfully');
} catch (error) {
  console.log('❌ validateOpenAiKey failed:', error.message);
} 