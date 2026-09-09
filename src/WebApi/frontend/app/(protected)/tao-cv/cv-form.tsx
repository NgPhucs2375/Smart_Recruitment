"use client";

import { useState } from "react";
import { Plus, Trash2, UserRound, BriefcaseBusiness, GraduationCap, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CvFormData, Experience, Education } from "./types";

interface CvFormProps { data: CvFormData; onChange: (data: CvFormData) => void; }

export function CvForm({ data, onChange }: CvFormProps) {
  const [skillInput, setSkillInput] = useState("");
  const update = (field: keyof CvFormData, value: string) => onChange({ ...data, [field]: value });
  const addExperience = () => onChange({ ...data, experiences: [...data.experiences, { id: Date.now().toString(), company: "", position: "", duration: "", description: "" }] });
  const updateExperience = (id: string, field: keyof Experience, value: string) => onChange({ ...data, experiences: data.experiences.map((item) => item.id === id ? { ...item, [field]: value } : item) });
  const removeExperience = (id: string) => onChange({ ...data, experiences: data.experiences.filter((item) => item.id !== id) });
  const addEducation = () => onChange({ ...data, education: [...data.education, { id: Date.now().toString(), school: "", degree: "", year: "" }] });
  const updateEducation = (id: string, field: keyof Education, value: string) => onChange({ ...data, education: data.education.map((item) => item.id === id ? { ...item, [field]: value } : item) });
  const removeEducation = (id: string) => onChange({ ...data, education: data.education.filter((item) => item.id !== id) });
  const addSkill = () => { const skill = skillInput.trim(); if (skill && !data.skills.includes(skill)) onChange({ ...data, skills: [...data.skills, skill] }); setSkillInput(""); };

  return <div className="cv-form-stack">
    <Card className="cv-form-card"><CardHeader><CardTitle><UserRound className="h-4 w-4" /> Thông tin cơ bản <span className="cv-required">BẮT BUỘC</span></CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="fullName">Họ và tên *</Label><Input id="fullName" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Nguyễn Văn An" /></div><div><Label htmlFor="roleTitle">Vị trí ứng tuyển *</Label><Input id="roleTitle" value={data.roleTitle} onChange={(e) => update("roleTitle", e.target.value)} placeholder="Product Designer" /></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="email@example.com" /></div><div><Label htmlFor="phone">Số điện thoại</Label><Input id="phone" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="090 123 4567" /></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="address">Địa điểm</Label><Input id="address" value={data.address} onChange={(e) => update("address", e.target.value)} placeholder="Hà Nội, Việt Nam" /></div><div><Label htmlFor="linkedin">LinkedIn / Portfolio</Label><Input id="linkedin" value={data.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="linkedin.com/in/yourname" /></div></div>
    </CardContent></Card>

    <Card className="cv-form-card"><CardHeader><CardTitle><UserRound className="h-4 w-4" /> Giới thiệu bản thân</CardTitle><span className="cv-card-helper">Gợi ý: 2–4 câu, tập trung vào giá trị bạn tạo ra</span></CardHeader><CardContent><Textarea value={data.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Tôi là một Product Designer với 4 năm kinh nghiệm..." rows={5} /></CardContent></Card>

    <Card className="cv-form-card"><CardHeader className="flex flex-row items-center justify-between"><CardTitle><BriefcaseBusiness className="h-4 w-4" /> Kinh nghiệm làm việc</CardTitle><Button variant="outline" size="sm" onClick={addExperience}><Plus className="mr-1 h-4 w-4" />Thêm</Button></CardHeader><CardContent className="space-y-4">{data.experiences.length === 0 ? <div className="cv-empty-form"><BriefcaseBusiness className="h-5 w-5" /><p>Thêm vai trò gần đây để nhà tuyển dụng thấy hành trình của bạn.</p></div> : data.experiences.map((exp) => <div key={exp.id} className="cv-repeat-item"><div className="flex items-start gap-2"><div className="grid flex-1 gap-3 sm:grid-cols-2"><Input placeholder="Công ty" value={exp.company} onChange={(e) => updateExperience(exp.id, "company", e.target.value)} /><Input placeholder="Vị trí" value={exp.position} onChange={(e) => updateExperience(exp.id, "position", e.target.value)} /></div><Button variant="ghost" size="icon" onClick={() => removeExperience(exp.id)} aria-label="Xóa kinh nghiệm"><Trash2 className="h-4 w-4" /></Button></div><Input placeholder="Thời gian (VD: 01/2022 – Nay)" value={exp.duration} onChange={(e) => updateExperience(exp.id, "duration", e.target.value)} /><Textarea placeholder="Mô tả công việc và thành tựu nổi bật..." value={exp.description} onChange={(e) => updateExperience(exp.id, "description", e.target.value)} rows={3} /></div>)}</CardContent></Card>

    <Card className="cv-form-card"><CardHeader className="flex flex-row items-center justify-between"><CardTitle><GraduationCap className="h-4 w-4" /> Học vấn</CardTitle><Button variant="outline" size="sm" onClick={addEducation}><Plus className="mr-1 h-4 w-4" />Thêm</Button></CardHeader><CardContent className="space-y-4">{data.education.length === 0 ? <div className="cv-empty-form"><GraduationCap className="h-5 w-5" /><p>Thêm nền tảng học vấn hoặc chứng chỉ của bạn.</p></div> : data.education.map((edu) => <div key={edu.id} className="cv-repeat-item"><div className="flex items-start gap-2"><div className="grid flex-1 gap-3 sm:grid-cols-2"><Input placeholder="Trường / Học viện" value={edu.school} onChange={(e) => updateEducation(edu.id, "school", e.target.value)} /><Input placeholder="Bằng cấp / Chuyên ngành" value={edu.degree} onChange={(e) => updateEducation(edu.id, "degree", e.target.value)} /></div><Button variant="ghost" size="icon" onClick={() => removeEducation(edu.id)} aria-label="Xóa học vấn"><Trash2 className="h-4 w-4" /></Button></div><Input placeholder="Năm tốt nghiệp" value={edu.year} onChange={(e) => updateEducation(edu.id, "year", e.target.value)} /></div>)}</CardContent></Card>

    <Card className="cv-form-card"><CardHeader><CardTitle><Wrench className="h-4 w-4" /> Kỹ năng nổi bật</CardTitle><span className="cv-card-helper">Nhấn Enter để thêm</span></CardHeader><CardContent className="space-y-3"><Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); addSkill(); } }} placeholder="Ví dụ: Figma, User research, Prototyping..." /><div className="flex flex-wrap gap-2">{data.skills.map((skill) => <Badge key={skill} variant="secondary" className="gap-1.5 px-3 py-1.5">{skill}<button type="button" onClick={() => onChange({ ...data, skills: data.skills.filter((item) => item !== skill) })} aria-label={`Xóa ${skill}`}><Trash2 className="h-3 w-3" /></button></Badge>)}</div></CardContent></Card>
  </div>;
}
