import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { generateAiAnswer } from "./src/lib/aiChat";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const geminiApiKey = env.GEMINI_API_KEY;

  const aiChatPlugin = {
    name: "ai-chat-api",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url !== "/api/ai-chat" || req.method !== "POST") {
          return next();
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const body = Buffer.concat(chunks).toString("utf-8");
          const payload = JSON.parse(body);

          const message = payload?.message;
          if (!message || typeof message !== "string") {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: "Mensagem inválida." }));
          }

          try {
            const answer = await generateAiAnswer(message, geminiApiKey);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ answer }));
          } catch (error: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify({ error: error?.message ?? "Erro ao processar a requisição de IA." }));
          }
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ error: "Erro ao processar a requisição de IA." }));
        }
      });
    },
  };

  return {
    base: mode === "production" ? "/" : "/",

    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger(), aiChatPlugin].filter(
      Boolean,
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
