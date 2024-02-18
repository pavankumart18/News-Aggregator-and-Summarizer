const axios = require('axios');
const { OpenAI } = require('openai');

const apiKey = 'your open ai api key';
const apiUrl = 'https://api.openai.com/v1/engines/davinci/completions';

const openai = new OpenAI(apiKey);


const summarizeWithChatGPT = async (articleBody) => {
  try {
    const response = await openai.completions.create({
      model: 'text-davinci-003', // Specify the GPT model here
      prompt: `Summarize the following article:\n"${articleBody}"`,
      max_tokens: 500,
    });

    const summary = response.choices[0].text.trim();
    return summary;
  } catch (error) {
    console.error('Error summarizing with ChatGPT:', error);
    return 'Failed to summarize';
  }
};


module.exports = { summarizeWithChatGPT };
