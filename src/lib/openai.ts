import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com', // Use DeepSeek API
  dangerouslyAllowBrowser: true // Note: In production, we should route requests through API routes
});
