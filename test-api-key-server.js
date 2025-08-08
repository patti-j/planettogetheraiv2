console.log('Testing API key in server context...');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY format:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'missing');
console.log('All env vars starting with OPENAI:', Object.keys(process.env).filter(k => k.includes('OPENAI')));