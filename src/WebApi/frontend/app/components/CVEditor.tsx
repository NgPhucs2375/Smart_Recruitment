"use client";

import React, {useState} from "react";
import {useCopilotReadable,useCopilotAction} from "@copilotkit/react-core";

interface CVData{
    fullName: string;
    summary: string;
    experience: string;
    skills: string[];
}

export const CVEditor: React.FC = () =>{
    const [cvData, setCvData] = useState<CVData>({
        fullName: "",
        summary: "",
        experience: "",
        skills: [],
    });

    //1. Cung cap "con mat" duw lieu hien tai cho AI qua Readable
    useCopilotReadable({
        description: "Thông tin CV hiện tại của người dùng",
        value: cvData,
    });

    //2. Dung ban Action sau sua qua FE Tool sao de thuc thi cap nhat CV
    useCopilotAction({
        name: "updateCVFields",
        description: "Cập nhật hoặc tói ưu hóa các trường nọi dung trong CV của người dùng",
        parameters:[
            {
                name:"fullName",
                type:"string",
                description: "Họ và tên",
                required: false,
            },
            {
                name:"summary",
                type:"string",
                description:"Tóm tắt mục tiêu / kinh nghiệm chuyên môn",
                required:false,
            },
            {
                name:"experience",  
                type:"string",
                description: "Chi tiết kinh nghiệm làm việc đã được tối ưu",
                required: false,
            },
            {
                name: "skills",
                type: "string[]",
                description: "Danh sách các kỹ năng chuyên môn phù hợp",
                required: false,
            },
        ],
        handler:async(args)=>{
            setCvData((prev)=>({
                ...prev,
                fullName:args.fullName ?? prev.fullName,
                summary:args.summary ?? prev.summary,
                experience: args.experience ?? prev.experience,
                skills: args.skills ?? prev.skills,
            }));
            return "Đã cập nhật thông tin CV thành công trên giao diện!";
        },
    });
    return(
        <div style={{ padding: 24 }}>
      <h2>Trình Biên Tập CV</h2>
      <div>
        <label>Họ tên:</label>
        <input
          value={cvData.fullName}
          onChange={(e) => setCvData({ ...cvData, fullName: e.target.value })}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Tóm tắt:</label>
        <textarea
          rows={4}
          value={cvData.summary}
          onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Kinh nghiệm:</label>
        <textarea
          rows={6}
          value={cvData.experience}
          onChange={(e) => setCvData({ ...cvData, experience: e.target.value })}
        />
      </div>
    </div>
    );

};