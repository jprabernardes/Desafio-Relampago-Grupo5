// tests/unit/validators.test.ts
import { expect } from 'chai';
import { isValidEmail, isValidPassword, isValidCPF, isValidDate, isValidTime } from '../../src/utils/validators';

describe('Testes de Validadores', () => {
  describe('isValidEmail', () => {
    it('deve validar email correto', () => {
      expect(isValidEmail('teste@email.com')).to.be.true;
    });

    it('deve rejeitar email inválido', () => {
      expect(isValidEmail('email_invalido')).to.be.false;
    });
  });

  describe('isValidPassword', () => {
    it('deve aceitar senha com 6+ caracteres', () => {
      expect(isValidPassword('senha123')).to.be.true;
    });

    it('deve rejeitar senha com menos de 6 caracteres', () => {
      expect(isValidPassword('12345')).to.be.false;
    });
  });

  describe('isValidCPF', () => {
    it('deve validar CPF com 11 dígitos', () => {
      expect(isValidCPF('12345678901')).to.be.true;
    });

    it('deve rejeitar CPF inválido', () => {
      expect(isValidCPF('123')).to.be.false;
    });
  });

  describe('isValidDate', () => {
    it('deve validar data no formato YYYY-MM-DD', () => {
      expect(isValidDate('2024-01-15')).to.be.true;
    });

    it('deve rejeitar data inválida', () => {
      expect(isValidDate('15/01/2024')).to.be.false;
    });
  });

  describe('isValidTime', () => {
    it('deve validar hora no formato HH:MM', () => {
      expect(isValidTime('14:30')).to.be.true;
    });

    it('deve rejeitar hora inválida', () => {
      expect(isValidTime('25:00')).to.be.false;
    });
  });
});
