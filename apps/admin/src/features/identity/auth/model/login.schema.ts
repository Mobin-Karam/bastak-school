import { z } from "zod";

export function createLoginSchema(messages: {
  phoneNumberRequired: string;
  passwordRequired: string;
}) {
  return z.object({
    phoneNumber: z
      .string()
      .trim()
      .regex(/^09\d{9}$/, messages.phoneNumberRequired),
    password: z.string().min(1, messages.passwordRequired),
  });
}

export const loginSchema = createLoginSchema({
  phoneNumberRequired: "شماره همراه معتبر لازم است",
  passwordRequired: "رمز عبور لازم است",
});

export type LoginFormValues = z.infer<typeof loginSchema>;
