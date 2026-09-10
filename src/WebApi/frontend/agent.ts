import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const ollama = createOpenAICompatible({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  name: "ollama",
  apiKey: process.env.OLLAMA_API_KEY || "ollama",
});

export function createDefaultAgent() {
  const baseModel = ollama(process.env.OLLAMA_MODEL || "gpt-oss:120b");

  // Đánh lừa bộ kiểm duyệt của CopilotKit Runtime bằng Proxy
  const compatibleModel = new Proxy(baseModel, {
    get(target, prop, receiver) {
      if (prop === "specificationVersion") {
        return "v2";
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return new BuiltInAgent({
    model: compatibleModel as any,
  });
}
