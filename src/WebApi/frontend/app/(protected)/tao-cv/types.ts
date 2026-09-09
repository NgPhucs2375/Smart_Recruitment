export type CvTemplate = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type Experience = { id: string; company: string; position: string; duration: string; description: string };
export type Education = { id: string; school: string; degree: string; year: string };

export type CvFormData = {
  fullName: string;
  roleTitle: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  templateId: string;
};
