"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useCallback, useMemo, useState } from "react";

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

export function useCVData() {
  const [cvData, setCvData] = useState<CVData>(initialCVData);
  const [isReady, setIsReady] = useState(true);

  useCopilotReadable({
    description: "Dữ liệu CV hiện tại của người dùng",
    value: cvData,
  });

  const setCVData = useCallback(
    (updater: CVData | ((prev: CVData) => CVData)) => {
      setCvData((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next;
      });
    },
    []
  );

  const updateField = useCallback(
    <K extends keyof CVData>(field: K, value: CVData[K]) => {
      setCvData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const addSkill = useCallback(
    (skill: string) => {
      const trimmedSkill = skill.trim();
      if (!trimmedSkill) return;

      setCvData((prev) => {
        if (prev.skills.includes(trimmedSkill)) return prev;
        return {
          ...prev,
          skills: [...prev.skills, trimmedSkill],
        };
      });
    },
    []
  );

  const removeSkill = useCallback(
    (skillToRemove: string) => {
      setCvData((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => s !== skillToRemove),
      }));
    },
    []
  );

  const resetCV = useCallback(() => {
    setCvData(initialCVData);
  }, []);

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