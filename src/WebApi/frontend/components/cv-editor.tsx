"use client";

import React from "react";
import { useCVData } from "@/hooks/useCVData";

export function CVEditor() {
  const { cvData, updateField, addSkill, removeSkill, isReady } = useCVData();

  const [newSkill, setNewSkill] = React.useState("");

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      addSkill(newSkill);
      setNewSkill("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold">Trình Biên Tập CV</h2>
        {!isReady && (
          <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            Đang kết nối agent...
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Họ tên</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={cvData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tóm tắt</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            rows={4}
            value={cvData.summary}
            onChange={(e) => updateField("summary", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kinh nghiệm</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            rows={6}
            value={cvData.experience}
            onChange={(e) => updateField("experience", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Kỹ năng</label>
          <div className="flex gap-2 mb-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              placeholder="Thêm kỹ năng mới..."
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={handleAddSkill}
            >
              Thêm
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cvData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm"
              >
                {skill}
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeSkill(skill)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CVEditor;
