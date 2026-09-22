/** Curated starter content (templates, not generated text). Shared by /CV editor and /tao-cv AI panel. */

export const summaryTemplates: { label: string; text: string }[] = [
  {
    label: "Fresher",
    text: "Sinh viên mới tốt nghiệp ngành Công nghệ thông tin, nền tảng vững về cấu trúc dữ liệu và lập trình hướng đối tượng. Đam mê học hỏi công nghệ mới, tìm kiếm cơ hội Fresher để phát triển kỹ năng và đóng góp cho đội ngũ.",
  },
  {
    label: "Backend",
    text: "Lập trình viên Backend với kinh nghiệm xây dựng REST API, thiết kế cơ sở dữ liệu và tối ưu hiệu năng hệ thống. Thành thạo .NET/Java, SQL Server/PostgreSQL, triển khai CI/CD và viết unit test.",
  },
  {
    label: "Frontend",
    text: "Lập trình viên Frontend chuyên sâu React/TypeScript, kinh nghiệm xây dựng giao diện responsive, tối ưu hiệu năng và trải nghiệm người dùng. Quen thuộc Tailwind CSS, quản lý trạng thái và tích hợp API.",
  },
];

export const experienceStarTemplate = [
  "CÔNG TY ABC - Chức danh (Năm bắt đầu - Nay)",
  "• Tình huống: mô tả ngắn bối cảnh công việc",
  "• Nhiệm vụ: trách nhiệm chính của bạn",
  "• Hành động: những việc bạn đã làm",
  "• Kết quả: con số, % cải thiện cụ thể",
].join("\n");

export const popularSkills: { label: string; skills: string[] }[] = [
  { label: "Backend", skills: [".NET", "SQL Server", "REST API", "Docker"] },
  { label: "Frontend", skills: ["React", "TypeScript", "Tailwind CSS", "Git"] },
];
