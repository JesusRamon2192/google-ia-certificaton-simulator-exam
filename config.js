// OpenAI API Configuration
// Load environment variables from env.js (for browser) or .env (for Node.js)
const getEnvVariable = (key, defaultValue = '') => {
  // For browser environment - reads from window.ENV (loaded from env.js)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // For Node.js environment
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

const CONFIG = {
  // Configuración de las APIs - cargadas desde el archivo .env o env.js
  APIS: [
    {
      name: 'OPENAI',
      url: 'https://api.openai.com/v1/chat/completions',
      key: getEnvVariable('OPENAI_API_KEY', ''),
      model: 'gpt-4o-mini'
    },
    {
      name: 'GROQ',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: getEnvVariable('GROQ_API_KEY', ''),
      model: 'llama-3.3-70b-versatile'
    },
    {
      name: 'CEREBRAS',
      url: 'https://api.cerebras.ai/v1/chat/completions',
      key: getEnvVariable('CEREBRAS_API_KEY', ''),
      model: 'llama3.1-8b'
    }
  ],
  
  // Generation Parameters comunes
  TEMPERATURE: 0.5,
  MAX_TOKENS: 2000,
  
  // Question Generation Settings
  DEFAULT_QUESTION_COUNT: 1,
  MAX_QUESTION_COUNT: 5,
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
