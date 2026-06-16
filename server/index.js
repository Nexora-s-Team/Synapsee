import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function extractResponseText(response) {
  const responseText = typeof response?.text === 'string' ? response.text : '';
  const candidateText = (response?.candidates?.[0]?.content?.parts || [])
    .map((p) => p?.text ?? '')
    .join('');
  return candidateText.length > responseText.length ? candidateText : responseText;
}

app.post('/api/ai-chat', async (req, res) => {
  try {
    const message = req.body?.message;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem inválida.' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é o assistente virtual da Synapsee. Ajude o usuário com dúvidas sobre notas, avisos, funcionalidades e informações gerais do aplicativo.\n\nUsuário: ${message}`,
      config: { temperature: 0.7, maxOutputTokens: 2048 },
    });

    const answer = extractResponseText(response) || null;
    if (!answer) {
      return res.status(500).json({ error: 'Resposta da IA vazia.' });
    }

    return res.json({ answer });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'Erro ao processar a requisição de IA.' });
  }
});

const port = process.env.PORT || 8080;
// Serve built frontend (Vite output) if it exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
