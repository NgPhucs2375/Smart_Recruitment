import z from "zod";

const fullDateSchema = z.string().regex(/^(?:(?:31\/(?:0[13578]|1[02]))\/\d{4}|(?:29|30)\/(?:0[13-9]|1[0-2])\/\d{4}|29\/02\/(?:(?:[02468][048]|[13579][26])00|(?:\d{2}(?:0[48]|[2468][048]|[13579][26]))))$|^(?:0[1-9]|1\d|2[0-8])\/(?:0[1-9]|1[0-2])\/\d{4}$/,"Ngày phải có định dạng dd/mm/yyyy, ví dụ: 01/01/2020"
);

const monthYearSchema = z.string().regex(/^(0[1-9]|1[0-2])\/\d{4}$/,
                            "Thời gian phải có định dạng mm/yyyy, ví dụ: 01/2020"
);

const profileSchema = z.object({
  network: z.string(),

  username: z.string().optional(),

  url: z.string().url("URL profile không hợp lệ"),
});

const basicsSchema = z.object({
  name: z.string().trim(),

  label: z.string().trim(),

  email: z
    .string()
    .trim()
    .email("Email không đúng định dạng"),

  phone: z.string().trim(),

  summary: z.string().trim(),

  profiles: z.array(profileSchema).default([]),
});

const workSchema = z.object({
  name: z.string().trim(),

  position: z.string().trim(),

  startDate: monthYearSchema,

  endDate: z.union([
    monthYearSchema,
    z.literal(""),
  ]),

  summary: z.string().trim().optional(),

  highlights: z.array(z.string()).default([]),

  keywords: z.array(z.string()).default([]),
});

const educationSchema = z.object({
  institution: z.string().trim(),

  area: z.string().trim(),

  studyType: z.string().trim().optional(),

  startDate: monthYearSchema,

  endDate: z.union([
    monthYearSchema,
    z.literal(""),
  ]),

  score: z.string().trim().optional(),

  courses: z.array(z.string()).default([]),
});

export const skillLevelSchema = z.enum([
  "CoBan",
  "TrungBinh",
  "ThanhThao",
  "ChuyenGia",
]);

const skillSchema = z.object({
  name: z.string().trim(),

  level: skillLevelSchema,

  keywords: z.array(z.string()).default([]),
});

const projectSchema = z.object({
  name: z.string().trim(),

  description: z.string().trim().optional(),

  role: z.string().trim().optional(),

  startDate: monthYearSchema.optional(),

  endDate: z
    .union([
      monthYearSchema,
      z.literal(""),
    ])
    .optional(),

  url: z
    .string()
    .url("URL project không hợp lệ")
    .optional(),

  keywords: z.array(z.string()).default([]),

  highlights: z.array(z.string()).default([]),
});

const certificateSchema = z.object({
  name: z.string().trim(),

  issuer: z.string().trim().optional(),

  date: monthYearSchema.optional(),

  url: z
    .string()
    .url("URL chứng chỉ không hợp lệ")
    .optional(),
});

const metadataSchema = z.object({
  gender: z.string().trim().optional(),

  dateOfBirth: fullDateSchema.optional(),

  targetPosition: z.string().trim().optional(),

  expectedSalary: z.string().trim().optional(),
});
const resumeSchema = z.object({
  basics: basicsSchema,

  work: z.array(workSchema).default([]),

  education: z.array(educationSchema).default([]),

  skills: z.array(skillSchema).default([]),

  projects: z.array(projectSchema).default([]),

  certificates: z.array(certificateSchema).default([]),
});

export const agentResumeDraftSchema = z.object({
    schemaVersion:z.literal("1.0"), // literal: define 1 type of value, absolutely chinh xac , check input phai khop tung ky tu , dung lam khoa phan loai
    resume: resumeSchema,
    metadata:metadataSchema.default({}),
});

export type AgentResumeDraft = z.infer<typeof agentResumeDraftSchema>; //infer: giong kieu any a tu dong dinh nghi kieu du lieu chu khong can phai khai bao thu cong tung type