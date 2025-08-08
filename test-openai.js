import OpenAI from 'openai';

async function testOpenAI() {
  console.log('Testing OpenAI API...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return;
  }
  
  console.log('API Key format:', apiKey.substring(0, 10) + '...');
  console.log('API Key length:', apiKey.length);
  
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    
    console.log('OpenAI client created successfully');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 10
    });
    
    console.log('Success! Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();