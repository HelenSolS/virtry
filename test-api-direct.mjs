// Test Google API Key with correct model name
import { promises as fs } from 'fs';

// Load .dev.vars
const loadEnv = async () => {
  try {
    const content = await fs.readFile('.dev.vars', 'utf8');
    const vars = {};
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        vars[key.trim()] = value.trim();
      }
    });
    return vars;
  } catch (e) {
    return {};
  }
};

const env = await loadEnv();
const apiKey = env.GOOGLE_API_KEY;

console.log('🔑 Testing Google API Key:', apiKey.substring(0, 20) + '...' + apiKey.substring(apiKey.length - 10));
console.log('');

// Test with correct model name
const testModel = 'gemini-2.5-flash';
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`;

console.log('📡 Testing model:', testModel);
console.log('');

try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Say "HELLO WORLD" if this works!' }]
      }]
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ КЛЮЧ РАБОТАЕТ! ✅');
    console.log('');
    console.log('📝 Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    console.log('🎉 API Key is valid and model is available!');
  } else {
    console.log('❌ КЛЮЧ НЕ РАБОТАЕТ! ❌');
    console.log('');
    console.log('Status:', response.status);
    console.log('Error:', data);
  }
} catch (error) {
  console.log('❌ ОШИБКА СОЕДИНЕНИЯ! ❌');
  console.log('');
  console.log('Error:', error.message);
}
