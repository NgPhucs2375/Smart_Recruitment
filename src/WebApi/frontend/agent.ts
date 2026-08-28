import { BuiltInAgent } from "@copilotkit/runtime/v2";

export function createDefaultAgent() {
  return new BuiltInAgent({
    model: "openai/gpt-4o-mini",
  });
}
