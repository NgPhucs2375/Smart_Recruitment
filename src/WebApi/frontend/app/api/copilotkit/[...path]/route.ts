// Catch-all cho CopilotKit Runtime v2 (multi-route): /info, /threads/*,
// /agents/*... Dùng chung handler với route bare.
import { agentRouteHandler } from "../agent-runtime";

export const GET = agentRouteHandler;
export const POST = agentRouteHandler;
