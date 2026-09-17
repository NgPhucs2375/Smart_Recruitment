// Route bare /api/copilotkit — dùng chung handler với catch-all [...path]
// (handler v2 là multi-route: /info, /threads/*, /agents/*...).
import { agentRouteHandler } from "./agent-runtime";

export const GET = agentRouteHandler;
export const POST = agentRouteHandler;
