import { z } from "zod";

export const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const loginSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+$/, "Invalid email"),
  password: z.string().min(1),
  remember: z.boolean(),
});

export const createTodoListSchema = z.object({
  title: z.string().min(1).max(200),
  colour: z.string().regex(hexColorRegex).optional(),
});

export const updateTodoListSchema = z.object({
  title: z.string().min(1).max(200),
  colour: z.string().regex(hexColorRegex).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateTodoListData = z.infer<typeof createTodoListSchema>;
export type UpdateTodoListData = z.infer<typeof updateTodoListSchema>;
