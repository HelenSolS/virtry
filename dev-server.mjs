// Simple Dev Server for local testing (Vercel API simulation)
// This allows us to test api/describe.js and api/generate.js locally

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Load environment variables from .dev.vars
const devVars = {};
const devVarsPath = path.join(__dirname, '.dev.vars');
if (fs.existsSync(devVarsPath)) {
  const content = fs.readFileSync(devVarsPath, 'utf-8');
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        devVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Set environment variables
Object.keys(devVars).forEach(key => {
  process.env[key] = devVars[key];
});

console.log('✅ Loaded environment variables from .dev.vars');
console.log('📊 Available vars:', Object.keys(devVars).join(', '));

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

// Create server
const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (req.url.startsWith('/api/')) {
    try {
      // Import the API handler
      const apiPath = req.url.split('?')[0];
      const handlerPath = path.join(__dirname, `${apiPath}.js`);
      
      if (!fs.existsSync(handlerPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
        return;
      }

      // Import handler
      const { default: handler } = await import(handlerPath);
      
      // Create Request object (simulating Vercel Edge Function)
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        const body = Buffer.concat(chunks);
        
        // Create Web API Request
        const request = new Request(`http://localhost:${PORT}${req.url}`, {
          method: req.method,
          headers: req.headers,
          body: body.length > 0 ? body : undefined,
        });

        // Call handler
        const response = await handler(request);
        
        // Send response
        const responseBody = await response.text();
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(responseBody);
      });
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }));
    }
    return;
  }

  // Static files
  let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // Try public directory
    filePath = path.join(__dirname, 'public', req.url);
    if (!fs.existsSync(filePath)) {
      // Fallback to index.html for SPA routing
      filePath = path.join(__dirname, 'dist', 'index.html');
    }
  }

  // Get file extension
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // Read and send file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 Dev Server Started!');
  console.log('');
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('📁 Serving:');
  console.log('   - Static: ./dist/');
  console.log('   - API:    ./api/');
  console.log('');
  console.log('✅ Ready to test Virtual Try-On!');
  console.log('');
});
