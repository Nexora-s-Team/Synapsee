import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAiAnswer } from "../lib/aiChat";
import { GoogleGenAI } from "@google/genai";

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn(async () => ({ text: "Resposta Gemini" })),
      },
    })),
  };
});

describe("generateAiAnswer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama o cliente Gemini com o modelo e mensagem corretos", async () => {
    const answer = await generateAiAnswer("Olá Synapsee", "test-key");

    expect(answer).toBe("Resposta Gemini");
    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-key" });

    const instance = (GoogleGenAI as unknown as vi.Mock).mock.results[0].value;
    expect(instance.models.generateContent).toHaveBeenCalledWith({
      model: "gemini-2.5-flash",
      contents:
        "Você é o assistente virtual da Synapsee. Ajude o usuário com dúvidas sobre notas, avisos, funcionalidades e informações gerais do aplicativo.\n\nUsuário: Olá Synapsee",
      config: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });
  });

  it("lança erro quando a mensagem é inválida", async () => {
    await expect(generateAiAnswer("", "test-key")).rejects.toThrow("Mensagem inválida.");
  });

  it("lança erro quando a chave Gemini não existe", async () => {
    await expect(generateAiAnswer("Olá", "")).rejects.toThrow(
      "GEMINI_API_KEY não encontrado no .env.",
    );
  });
});
