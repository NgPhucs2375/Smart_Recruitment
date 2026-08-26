// ============== *** AGENT AI *** ============== //
// Sync với CVStateSnapshot ở Backend
export type CVState = {
  fullName: string;
  summary: string;
  experience: string;
  skills: string[];
};

// Agent state type (giống smart project)
export type AgentState = {
  cv: CVState;
};


