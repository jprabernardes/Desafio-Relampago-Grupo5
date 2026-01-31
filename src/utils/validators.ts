// src/utils/validators.ts

/**
 * Valida se um email é válido
 * Regras:
 * - Deve conter @
 * - Não pode ter espaços
 * - Deve ter formato correto (usuario@dominio.com)
 */
export const isValidEmail = (email: string): boolean => {
  // Verifica se é string e não está vazio
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Verifica se tem espaços
  if (email.includes(' ')) {
    return false;
  }

  // Regex para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se uma senha é válida
 * Regras:
 * - Mínimo 6 caracteres
 * - Não pode ter espaços
 */
export const isValidPassword = (password: string): boolean => {
  // Verifica se é string e não está vazio
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Verifica se tem espaços
  if (password.includes(' ')) {
    return false;
  }

  // Verifica se tem pelo menos 6 caracteres
  return password.length >= 6;
};

/**
 * Valida se um CPF é válido
 * Regras:
 * - Deve ter exatamente 11 dígitos
 * - Apenas números (sem pontos, hífens ou letras)
 */
export const isValidCPF = (cpf: string): boolean => {
  // Verifica se é string e não está vazio
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }

  // Remove espaços se houver
  const cleanCPF = cpf.trim();

  // Verifica se tem exatamente 11 caracteres
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Verifica se todos os caracteres são dígitos
  const isOnlyDigits = /^\d{11}$/.test(cleanCPF);
  
  return isOnlyDigits;
};

/**
 * Valida se string não está vazia
 */
export const isNotEmpty = (value: string): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Valida se uma data está no formato DD-MM-YYYY
 * Regras:
 * - Formato DD-MM-YYYY (com traços)
 * - Dia entre 01 e 31
 * - Mês entre 01 e 12
 * - Ano com 4 dígitos
 * - Não aceita datas impossíveis (30/02, 32/01, etc)
 */
export const isValidDate = (date: string): boolean => {
  // Verifica se é string e não está vazio
  if (!date || typeof date !== 'string') {
    return false;
  }

  // Regex para formato DD-MM-YYYY (com traços)
  const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = date.match(dateRegex);

  if (!match) {
    return false;
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // Verifica se o mês é válido
  if (month < 1 || month > 12) {
    return false;
  }

  // Verifica se o dia é válido
  if (day < 1 || day > 31) {
    return false;
  }

  // Verifica dias válidos por mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Verifica ano bissexto
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29;
  }

  // Verifica se o dia é válido para o mês
  if (day > daysInMonth[month - 1]) {
    return false;
  }

  return true;
};

/**
 * Valida se um horário está no formato HH:MM
 * Regras:
 * - Formato HH:MM
 * - Hora entre 00 e 23
 * - Minuto entre 00 e 59
 */
export const isValidTime = (time: string): boolean => {
  // Verifica se é string e não está vazio
  if (!time || typeof time !== 'string') {
    return false;
  }

  // Regex para formato HH:MM
  const timeRegex = /^(\d{2}):(\d{2})$/;
  const match = time.match(timeRegex);

  if (!match) {
    return false;
  }

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  // Verifica se a hora é válida (00-23)
  if (hour < 0 || hour > 23) {
    return false;
  }

  // Verifica se o minuto é válido (00-59)
  if (minute < 0 || minute > 59) {
    return false;
  }

  return true;
};

/**
 * Valida se número é positivo
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0;
};

/**
 * Valida telefone no formato (XX)9XXXXXXXX ou (XX)XXXXXXXX
 */
export const isValidPhone = (phone: string): boolean => {
  // Aceita (XX)XXXXXXXX and (XX)9XXXXXXXX
  const phoneRegex = /^\(\d{2}\)\d{8,9}$/;
  return phoneRegex.test(phone);
};
