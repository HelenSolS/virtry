// List available Gemini models
import fs from 'fs';

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

console.log('\n📋 Получение списка доступных моделей...\n');

const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(listUrl)
.then(response => response.json())
.then(data => {
  if (data.error) {
    console.log('❌ Ошибка:', data.error.message);
    process.exit(1);
  }
  
  console.log('✅ Доступные модели:\n');
  
  data.models
    .filter(model => model.name.includes('gemini'))
    .forEach(model => {
      const name = model.name.replace('models/', '');
      const supportsGenerate = model.supportedGenerationMethods?.includes('generateContent');
      console.log(`${supportsGenerate ? '✅' : '❌'} ${name}`);
      if (model.description) {
        console.log(`   ${model.description.substring(0, 80)}...`);
      }
      console.log('');
    });
})
.catch(error => {
  console.log('❌ Ошибка:', error.message);
  process.exit(1);
});
