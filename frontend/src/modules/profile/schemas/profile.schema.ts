import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Informe seu nome'),
  lastName: z.string().trim(),
  email: z
    .string()
    .trim()
    .min(1, 'O e-mail é obrigatório')
    .email('Informe um e-mail válido (ex: seu@email.com)'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter no mínimo 8 caracteres')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'A nova senha deve conter ao menos uma letra e um número'),
    confirmPassword: z.string().min(1, 'Repita a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export function splitName(fullName: string) {
  const [firstName = '', ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

export function joinName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}
