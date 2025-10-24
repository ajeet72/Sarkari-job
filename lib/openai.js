import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://api.emergentagi.com/v1'
});

export async function generateExcerpt(content) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise excerpts for blog posts.'
        },
        {
          role: 'user',
          content: `Create a compelling 2-3 sentence excerpt for this blog post:\n\n${content.substring(0, 1000)}`
        }
      ],
      max_tokens: 150
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating excerpt:', error);
    return '';
  }
}

export async function generateSEO(title, content) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert that creates meta descriptions and keywords for blog posts.'
        },
        {
          role: 'user',
          content: `For a blog post titled "${title}" with content: ${content.substring(0, 500)}\n\nProvide:\n1. Meta description (150-160 characters)\n2. 5 relevant keywords (comma-separated)`
        }
      ],
      max_tokens: 200
    });
    const result = response.choices[0].message.content.trim();
    return result;
  } catch (error) {
    console.error('Error generating SEO:', error);
    return '';
  }
}

export default openai;
