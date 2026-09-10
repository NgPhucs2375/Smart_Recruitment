"use client";

import { Mail, Phone, MapPin, Linkedin } from "lucide-react";
import { cvTemplates } from "./constants";
import type { CvFormData } from "./types";

interface CvPreviewProps {
  data: CvFormData;
}

export function CvPreview({ data }: CvPreviewProps) {
  const template = cvTemplates.find((t) => t.id === data.templateId) ?? cvTemplates[0];

  return (
    <div className="rounded-xl border border-border bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="px-8 py-6 text-white"
        style={{ backgroundColor: template.color }}
      >
        <h1 className="text-2xl font-bold">{data.fullName || "Họ và tên"}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-white/80">
          {data.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {data.email}
            </span>
          )}
          {data.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {data.phone}
            </span>
          )}
          {data.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {data.address}
            </span>
          )}
          {data.linkedin && (
            <span className="flex items-center gap-1.5">
              <Linkedin className="h-3.5 w-3.5" />
              {data.linkedin}
            </span>
          )}
        </div>
      </div>

      <div className="px-8 py-6 space-y-6 text-sm">
        {/* Summary */}
        {data.summary && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b"
              style={{ color: template.color }}
            >
              Tóm tắt
            </h2>
            <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.experiences.length > 0 && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: template.color }}
            >
              Kinh nghiệm làm việc
            </h2>
            <div className="space-y-4">
              {data.experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{exp.position || "Vị trí"}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{exp.duration}</span>
                  </div>
                  <p className="text-muted-foreground">{exp.company}</p>
                  {exp.description && (
                    <p className="mt-1 text-muted-foreground whitespace-pre-line">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: template.color }}
            >
              Học vấn
            </h2>
            <div className="space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{edu.school || "Trường"}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{edu.year}</span>
                  </div>
                  <p className="text-muted-foreground">{edu.degree}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b"
              style={{ color: template.color }}
            >
              Kỹ năng
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-block px-2.5 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${template.color}15`,
                    color: template.color,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!data.summary && data.experiences.length === 0 && data.education.length === 0 && data.skills.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>Bắt đầu điền thông tin bên trái để xem trước CV</p>
          </div>
        )}
      </div>
    </div>
  );
}
