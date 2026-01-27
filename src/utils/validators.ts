// src/utils/validators.ts

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida força da senha (mínimo 6 caracteres)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Valida CPF (11 dígitos numéricos)
 */
export const isValidCPF = (cpf: string): boolean => {
  const cpfRegex = /^\d{11}$/;
  return cpfRegex.test(cpf);
};

/**
 * Valida se string não está vazia
 */
export const isNotEmpty = (value: string): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Valida formato de data (YYYY-MM-DD)
 */
export const isValidDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Valida formato de hora (HH:MM)
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Valida se número é positivo
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0;
};
