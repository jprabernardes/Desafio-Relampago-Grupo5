// src/utils/hash.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Gera hash da senha
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compara senha com hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
