/**
 * Remove caracteres de controle e de formatação invisíveis que podem ser usados
 * para burlar validações ou "quebrar" a interface (ex.: inversão de direção do texto).
 * Mantém ZWJ/ZWNJ (U+200C/U+200D), necessários para emojis compostos.
 */
const INVISIBLE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​‎‏‪-‮⁦-⁩﻿]/g;

/** Texto de uma linha: sem quebras, sem espaços duplicados e sem bordas. */
export function sanitizeLine(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFC')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(INVISIBLE_CHARS, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Texto longo: preserva parágrafos, limita linhas em branco seguidas a uma. */
export function sanitizeMultiline(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(INVISIBLE_CHARS, '')
    .replace(/[  ]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function nullIfEmpty(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}
