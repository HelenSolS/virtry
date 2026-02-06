// Test Google API Key validation
// This script checks if the GOOGLE_API_KEY works correctly

import fs from 'fs';

// Load .dev.vars
const devVars = {};
const content = fs.readFileSync('.dev.vars', 'utf-8');
content.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      devVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const apiKey = devVars.GOOGLE_API_KEY;

console.log('\n🔑 Проверка Google API Key...\n');
console.log(`Ключ: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 10)}`);
console.log('');

// Test with a simple text generation
const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

const testPayload = {
  contents: [{
    parts: [{
      text: 'Say "Hello" in one word'
    }]
  }]
};

console.log('📡 Отправка тестового запроса...\n');

fetch(testUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testPayload)
})
.then(response => {
  console.log(`Статус: ${response.status} ${response.statusText}`);
  return response.json();
})
.then(data => {
  console.log('');
  
  if (data.error) {
    console.log('❌ КЛЮЧ НЕ РАБОТАЕТ!\n');
    console.log('Ошибка:', data.error.message);
    console.log('Код:', data.error.code);
    console.log('Статус:', data.error.status);
    console.log('');
    console.log('🔧 Что делать:');
    console.log('1. Проверьте что ключ правильный');
    console.log('2. Убедитесь что Gemini API включен в Google Cloud Console');
    console.log('3. Проверьте квоты на https://aistudio.google.com/app/apikey');
    console.log('');
    process.exit(1);
  }
  
  if (data.candidates && data.candidates[0]?.content?.parts) {
    const response = data.candidates[0].content.parts[0].text;
    console.log('✅ КЛЮЧ РАБОТАЕТ!\n');
    console.log('Ответ от Gemini:', response);
    console.log('');
    console.log('📊 Информация:');
    console.log('- Модель: gemini-1.5-flash-latest');
    console.log('- API версия: v1beta');
    console.log('- Ключ: валиден ✓');
    console.log('');
    console.log('🎉 Готово к работе!');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️  НЕОЖИДАННЫЙ ОТВЕТ\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    process.exit(1);
  }
})
.catch(error => {
  console.log('');
  console.log('❌ ОШИБКА СОЕДИНЕНИЯ!\n');
  console.log('Детали:', error.message);
  console.log('');
  console.log('🔧 Возможные причины:');
  console.log('1. Нет интернет-соединения');
  console.log('2. Google API недоступен');
  console.log('3. Firewall блокирует запрос');
  console.log('');
  process.exit(1);
});
