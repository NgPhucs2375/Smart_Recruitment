"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CvFormData, Experience, Education } from "./types";

interface CvFormProps {
  data: CvFormData;
  onChange: (data: CvFormData) => void;
}

export function CvForm({ data, onChange }: CvFormProps) {
  const update = (field: keyof CvFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      duration: "",
      description: "",
    };
    onChange({ ...data, experiences: [...data.experiences, newExp] });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    const updated = data.experiences.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    onChange({ ...data, experiences: updated });
  };

  const removeExperience = (id: string) => {
    onChange({ ...data, experiences: data.experiences.filter((exp) => exp.id !== id) });
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: "",
      degree: "",
      year: "",
    };
    onChange({ ...data, education: [...data.education, newEdu] });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    const updated = data.education.map((edu) =>
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    onChange({ ...data, education: updated });
  };

  const removeEducation = (id: string) => {
    onChange({ ...data, education: data.education.filter((edu) => edu.id !== id) });
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !data.skills.includes(skill.trim())) {
      onChange({ ...data, skills: [...data.skills, skill.trim()] });
    }
  };

  const removeSkill = (skill: string) => {
    onChange({ ...data, skills: data.skills.filter((s) => s !== skill) });
  };

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fullName">Họ và tên *</Label>
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Nguyễn Văn An"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="090 123 4567"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={data.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Hà Nội, Việt Nam"
            />
          </div>
          <div>
            <Label htmlFor="linkedin">LinkedIn / Portfolio</Label>
            <Input
              id="linkedin"
              value={data.linkedin}
              onChange={(e) => update("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tóm tắt chuyên nghiệp</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.summary}
            onChange={(e) => update("summary", e.target.value)}
            placeholder="Mô tả ngắn gọn về mục tiêu nghề nghiệp và điểm mạnh của bạn..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Kinh nghiệm làm việc</CardTitle>
          <Button variant="outline" size="sm" onClick={addExperience}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có kinh nghiệm nào. Nhấn &quot;Thêm&quot; để bắt đầu.
            </p>
          ) : (
            data.experiences.map((exp) => (
              <div key={exp.id} className="space-y-3 p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid gap-3 flex-1 sm:grid-cols-2">
                    <Input
                      placeholder="Công ty"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    />
                    <Input
                      placeholder="Vị trí"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeExperience(exp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Thời gian (VD: 01/2022 - Nay)"
                  value={exp.duration}
                  onChange={(e) => updateExperience(exp.id, "duration", e.target.value)}
                />
                <Textarea
                  placeholder="Mô tả công việc, thành tựu..."
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                  rows={3}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Học vấn</CardTitle>
          <Button variant="outline" size="sm" onClick={addEducation}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.education.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có thông tin học vấn.
            </p>
          ) : (
            data.education.map((edu) => (
              <div key={edu.id} className="space-y-3 p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid gap-3 flex-1 sm:grid-cols-2">
                    <Input
                      placeholder="Trường"
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                    />
                    <Input
                      placeholder="Bằng cấp / Chuyên ngành"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeEducation(edu.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Năm tốt nghiệp"
                  value={edu.year}
                  onChange={(e) => updateEducation(edu.id, "year", e.target.value)}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Kỹ năng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Thêm kỹ năng và nhấn Enter..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => removeSkill(skill)}
              >
                {skill}
                <Trash2 className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
