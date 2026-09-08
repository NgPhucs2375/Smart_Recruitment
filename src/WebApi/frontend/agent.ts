import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export function createDefaultAgent() {
  const baseModel = groq("qwen/qwen3.6-27b");

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