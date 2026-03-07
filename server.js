const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Endpoint to handle environment variables for frontend
app.get('/env.js', (req, res) => {
  const envContent = `window.ENV = {
  OPENAI_API_KEY: '${process.env.OPENAI_API_KEY || ''}',
  GROQ_API_KEY: '${process.env.GROQ_API_KEY || ''}',
  CEREBRAS_API_KEY: '${process.env.CEREBRAS_API_KEY || ''}'
};`;
  res.type('application/javascript');
  res.send(envContent);
});

// Endpoint to append usage logs
app.post('/api/log', (req, res) => {
  const { apiName } = req.body;
  if (!apiName) {
    return res.status(400).json({ error: 'Falta la propiedad apiName' });
  }

  const date = new Date().toISOString();
  // Using explicit relative path or absolute path depends on preference. __dirname + api-usage.log works well.
  const logFilePath = path.join(__dirname, 'api-usage.log');
  const logContent = `[${date}] INFO: Examen generado exitosamente usando el proveedor de la API de IA: ${apiName}\n`;

  fs.appendFile(logFilePath, logContent, (err) => {
    if (err) {
      console.error('Error al guardar el log al servidor:', err);
      return res.status(500).json({ error: 'Error al escribir el archivo de log' });
    }
    console.log(`Log exitoso: Usado ${apiName}`);
    res.json({ success: true, message: 'Log guardado correctamente en el servidor.' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado escuchando en el puerto ${PORT}`);
});
