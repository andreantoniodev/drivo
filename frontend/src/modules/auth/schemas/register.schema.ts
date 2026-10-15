import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'O nome é obrigatório')
      .min(2, 'O nome deve ter no mínimo 2 caracteres'),
    email: z
      .string()
      .trim()
      .min(1, 'O e-mail é obrigatório')
      .email('Informe um e-mail válido (ex: seu@email.com)'),
    password: z
      .string()
      .min(1, 'A senha é obrigatória')
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'A senha deve conter ao menos uma letra e um número'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
