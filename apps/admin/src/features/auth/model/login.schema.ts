import { z } from "zod";

export function createLoginSchema(messages: {
  usernameRequired: string;
  passwordRequired: string;
}) {
  return z.object({
    username: z.string().trim().min(1, messages.usernameRequired),
    password: z.string().min(1, messages.passwordRequired),
  });
}

export const loginSchema = createLoginSchema({
  usernameRequired: "نام کاربری لازم است",
  passwordRequired: "رمز عبور لازم است",
});

export type LoginFormValues = z.infer<typeof loginSchema>;
