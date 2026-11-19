import { z } from 'zod';

import { LIMITS } from '@/constants/app';
import type { ReportReason } from '@/types/models';

export const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'spam', label: 'Spam ou propaganda enganosa', description: 'Conteúdo repetitivo, irrelevante ou promessas falsas.' },
  { value: 'inappropriate', label: 'Conteúdo impróprio ou ofensivo', description: 'Discurso de ódio, nudez, violência ou assédio.' },
  { value: 'fake', label: 'Perfil falso', description: 'Se passa por outra pessoa ou marca.' },
  { value: 'scam', label: 'Golpe ou fraude', description: 'Pedidos suspeitos de pagamento ou dados pessoais.' },
  { value: 'other', label: 'Outro motivo', description: 'Conte para nós o que aconteceu.' },
];

export const reportSchema = z
  .object({
    reason: z.enum(['spam', 'inappropriate', 'fake', 'scam', 'other'], 'Escolha um motivo.'),
    details: z.string().trim().max(LIMITS.reportDetails.max, `Use no máximo ${LIMITS.reportDetails.max} caracteres.`),
  })
  .refine((data) => data.reason !== 'other' || data.details.length >= 10, {
    error: 'Descreva o motivo com pelo menos 10 caracteres.',
    path: ['details'],
  });

export type ReportValues = z.input<typeof reportSchema>;
