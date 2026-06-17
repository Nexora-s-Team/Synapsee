import { GoogleGenAI } from "@google/genai";

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  text?: string;
  candidates?: {
    content?: {
      parts?: GeminiPart[];
    };
  }[];
};

function extractResponseText(response: GeminiResponse) {
  const responseText =
    typeof response?.text === "string" ? response.text : "";

  const candidateText =
    response?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";

  return candidateText.length > responseText.length
    ? candidateText
    : responseText;
}

export async function generateAiAnswer(
  message: string,
  apiKey: string,
) {
  if (!message || typeof message !== "string") {
    throw new Error("Mensagem inválida.");
  }

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não encontrado.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Você é o assistente virtual da Synapsee. Ajude o usuário com dúvidas sobre notas, avisos, funcionalidades e informações gerais do aplicativo.

Usuário: ${message}`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  const answer = extractResponseText(response as GeminiResponse);

  if (!answer) {
    throw new Error("Resposta da IA vazia.");
  }

  return answer;
}