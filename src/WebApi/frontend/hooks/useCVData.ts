"use client";

import { useAgent } from "@copilotkit/react-core/v2";
import { useCallback, useMemo } from "react";

export interface CVData {
  fullName: string;
  summary: string;
  experience: string;
  skills: string[];
}

export const initialCVData: CVData = {
  fullName: "",
  summary: "",
  experience: "",
  skills: [],
};

export function useCVData(agentName: string = "smart-agent") {
  const { agent, isReady } = useAgent({ agentId: agentName });

  const cvData = useMemo(
    () => (agent.state as CVData | undefined) ?? initialCVData,
    [agent.state],
  );

  const setCVData = useCallback(
    (updater: CVData | ((prev: CVData) => CVData)) => {
      if (typeof updater === "function") {
        const next = updater(cvData);
        agent.setState(next);
      } else {
        agent.setState(updater);
      }
    },
    [agent, cvData],
  );

  const updateField = useCallback(
    <K extends keyof CVData>(field: K, value: CVData[K]) => {
      agent.setState({
        ...cvData,
        [field]: value,
      });
    },
    [agent, cvData],
  );

  const addSkill = useCallback(
    (skill: string) => {
      const trimmedSkill = skill.trim();
      if (!trimmedSkill) return;
      if (cvData.skills.includes(trimmedSkill)) return;

      agent.setState({
        ...cvData,
        skills: [...cvData.skills, trimmedSkill],
      });
    },
    [agent, cvData],
  );

  const removeSkill = useCallback(
    (skillToRemove: string) => {
      agent.setState({
        ...cvData,
        skills: cvData.skills.filter((s) => s !== skillToRemove),
      });
    },
    [agent, cvData],
  );

  const resetCV = useCallback(() => {
    agent.setState(initialCVData);
  }, [agent]);

  return {
    cvData,
    setCVData,
    updateField,
    addSkill,
    removeSkill,
    resetCV,
    isReady,
  };
}
