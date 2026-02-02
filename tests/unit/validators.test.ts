// tests/unit/validators.test.ts
import { expect } from 'chai';
import { isValidEmail, isValidPassword, isValidCPF, isValidDate, isValidTime } from '../../src/utils/validators';

describe('Testes de Validadores - Funções Utilitárias', () => {

  describe('isValidEmail', () => {

    describe('Emails válidos', () => {
      it('deve validar email simples', () => {
        expect(isValidEmail('teste@email.com')).to.be.true;
      });

      it('deve validar email com números', () => {
        expect(isValidEmail('usuario123@email.com')).to.be.true;
      });

      it('deve validar email com pontos', () => {
        expect(isValidEmail('usuario.teste@email.com')).to.be.true;
      });

      it('deve validar email com hífen', () => {
        expect(isValidEmail('usuario-teste@email.com')).to.be.true;
      });

      it('deve validar email com subdomínio', () => {
        expect(isValidEmail('teste@mail.empresa.com')).to.be.true;
      });
    });

    describe('Emails inválidos', () => {
      it('deve rejeitar email sem @', () => {
        expect(isValidEmail('emailinvalido')).to.be.false;
      });

      it('deve rejeitar email sem domínio', () => {
        expect(isValidEmail('teste@')).to.be.false;
      });

      it('deve rejeitar email sem usuário', () => {
        expect(isValidEmail('@email.com')).to.be.false;
      });

      it('deve rejeitar email com espaço antes do @', () => {
        expect(isValidEmail('teste @email.com')).to.be.false;
      });

      it('deve rejeitar email com espaço depois do @', () => {
        expect(isValidEmail('teste@email .com')).to.be.false;
      });

      it('deve rejeitar email com espaços no meio', () => {
        expect(isValidEmail('te ste@email.com')).to.be.false;
      });

      it('deve rejeitar email com espaço no início', () => {
        expect(isValidEmail(' teste@email.com')).to.be.false;
      });

      it('deve rejeitar email com espaço no final', () => {
        expect(isValidEmail('teste@email.com ')).to.be.false;
      });

      it('deve rejeitar email vazio', () => {
        expect(isValidEmail('')).to.be.false;
      });

      it('deve rejeitar email com múltiplos @', () => {
        expect(isValidEmail('teste@@email.com')).to.be.false;
      });
    });

  });

  describe('isValidPassword', () => {

    describe('Senhas válidas', () => {
      it('deve aceitar senha com 6 caracteres', () => {
        expect(isValidPassword('senha1')).to.be.true;
      });

      it('deve aceitar senha com mais de 6 caracteres', () => {
        expect(isValidPassword('senha123456')).to.be.true;
      });

      it('deve aceitar senha com caracteres especiais', () => {
        expect(isValidPassword('senha@123')).to.be.true;
      });

      it('deve aceitar senha com letras maiúsculas e minúsculas', () => {
        expect(isValidPassword('Senha123')).to.be.true;
      });
    });

    describe('Senhas inválidas', () => {
      it('deve rejeitar senha com menos de 6 caracteres', () => {
        expect(isValidPassword('12345')).to.be.false;
      });

      it('deve rejeitar senha vazia', () => {
        expect(isValidPassword('')).to.be.false;
      });

      it('deve rejeitar senha com espaço no meio', () => {
        expect(isValidPassword('senha 123')).to.be.false;
      });

      it('deve rejeitar senha com espaço no início', () => {
        expect(isValidPassword(' senha123')).to.be.false;
      });

      it('deve rejeitar senha com espaço no final', () => {
        expect(isValidPassword('senha123 ')).to.be.false;
      });

      it('deve rejeitar senha com apenas espaços', () => {
        expect(isValidPassword('      ')).to.be.false;
      });

      it('deve rejeitar senha com 5 caracteres', () => {
        expect(isValidPassword('abcde')).to.be.false;
      });
    });

  });

  describe('isValidCPF', () => {

    describe('CPFs válidos', () => {
      it('deve validar CPF com 11 dígitos', () => {
        expect(isValidCPF('12345678901')).to.be.true;
      });

      it('deve validar CPF com zeros', () => {
        expect(isValidCPF('00000000000')).to.be.true;
      });

      it('deve validar CPF com dígitos repetidos', () => {
        expect(isValidCPF('11111111111')).to.be.true;
      });
    });

    describe('CPFs inválidos', () => {
      it('deve rejeitar CPF com menos de 11 dígitos', () => {
        expect(isValidCPF('123')).to.be.false;
      });

      it('deve rejeitar CPF com 10 dígitos', () => {
        expect(isValidCPF('1234567890')).to.be.false;
      });

      it('deve rejeitar CPF com mais de 11 dígitos', () => {
        expect(isValidCPF('123456789012')).to.be.false;
      });

      it('deve rejeitar CPF com letras', () => {
        expect(isValidCPF('12345abc901')).to.be.false;
      });

      it('deve rejeitar CPF com letras no início', () => {
        expect(isValidCPF('abc45678901')).to.be.false;
      });

      it('deve rejeitar CPF com letras no meio', () => {
        expect(isValidCPF('12345abc901')).to.be.false;
      });

      it('deve rejeitar CPF com letras no final', () => {
        expect(isValidCPF('12345678abc')).to.be.false;
      });

      it('deve rejeitar CPF vazio', () => {
        expect(isValidCPF('')).to.be.false;
      });

      it('deve rejeitar CPF com pontos e hífen', () => {
        expect(isValidCPF('123.456.789-01')).to.be.false;
      });

      it('deve rejeitar CPF com espaços', () => {
        expect(isValidCPF('123 456 789 01')).to.be.false;
      });

      it('deve rejeitar CPF com caracteres especiais', () => {
        expect(isValidCPF('123@456#789')).to.be.false;
      });
    });

  });

  describe('isValidDate', () => {

    describe('Datas válidas', () => {
      it('deve validar data no formato DD-MM-YYYY', () => {
        expect(isValidDate('15-01-2024')).to.be.true;
      });

      it('deve validar data com dia 01', () => {
        expect(isValidDate('01-01-2024')).to.be.true;
      });

      it('deve validar data com último dia do mês', () => {
        expect(isValidDate('31-12-2024')).to.be.true;
      });

      it('deve validar data de fevereiro válida', () => {
        expect(isValidDate('29-02-2024')).to.be.true; // ano bissexto
      });
    });

    describe('Datas inválidas', () => {
      it('deve rejeitar data no formato YYYY-MM-DD', () => {
        expect(isValidDate('2024-01-15')).to.be.false;
      });

      it('deve rejeitar data no formato MM/DD/YYYY', () => {
        expect(isValidDate('01/15/2024')).to.be.false;
      });

      it('deve rejeitar mês impossível', () => {
        expect(isValidDate('15-13-2024')).to.be.false;
      });

      it('deve rejeitar dia impossível', () => {
        expect(isValidDate('32-01-2024')).to.be.false;
      });

      it('deve rejeitar mês impossível (segundo campo)', () => {
        expect(isValidDate('15-13-2024')).to.be.false;
      });

      it('deve rejeitar formato com barras', () => {
        expect(isValidDate('15/01/2024')).to.be.false;
      });

      it('deve rejeitar data com letras', () => {
        expect(isValidDate('15-Jan-2024')).to.be.false;
      });

      it('deve rejeitar data incompleta', () => {
        expect(isValidDate('15-01')).to.be.false;
      });

      it('deve rejeitar data vazia', () => {
        expect(isValidDate('')).to.be.false;
      });

      it('deve rejeitar fevereiro com dia 30', () => {
        expect(isValidDate('30-02-2024')).to.be.false;
      });

      it('deve rejeitar dia zero', () => {
        expect(isValidDate('00-01-2024')).to.be.false;
      });

      it('deve rejeitar mês zero', () => {
        expect(isValidDate('15-00-2024')).to.be.false;
      });
    });

  });

  describe('isValidTime', () => {

    describe('Horários válidos', () => {
      it('deve validar hora no formato HH:MM', () => {
        expect(isValidTime('14:30')).to.be.true;
      });

      it('deve validar hora 00:00', () => {
        expect(isValidTime('00:00')).to.be.true;
      });

      it('deve validar hora 23:59', () => {
        expect(isValidTime('23:59')).to.be.true;
      });

      it('deve validar hora meio-dia', () => {
        expect(isValidTime('12:00')).to.be.true;
      });

      it('deve validar hora com minuto zero', () => {
        expect(isValidTime('10:00')).to.be.true;
      });
    });

    describe('Horários inválidos', () => {
      it('deve rejeitar hora 25:00', () => {
        expect(isValidTime('25:00')).to.be.false;
      });

      it('deve rejeitar hora 24:00', () => {
        expect(isValidTime('24:00')).to.be.false;
      });

      it('deve rejeitar minuto 60', () => {
        expect(isValidTime('14:60')).to.be.false;
      });

      it('deve rejeitar minuto maior que 59', () => {
        expect(isValidTime('14:70')).to.be.false;
      });

      it('deve rejeitar formato sem dois pontos', () => {
        expect(isValidTime('1430')).to.be.false;
      });

      it('deve rejeitar formato com um dígito na hora', () => {
        expect(isValidTime('9:30')).to.be.false;
      });

      it('deve rejeitar formato com um dígito no minuto', () => {
        expect(isValidTime('14:5')).to.be.false;
      });

      it('deve rejeitar hora vazia', () => {
        expect(isValidTime('')).to.be.false;
      });

      it('deve rejeitar hora com letras', () => {
        expect(isValidTime('14:3a')).to.be.false;
      });

      it('deve rejeitar formato 12h (AM/PM)', () => {
        expect(isValidTime('02:30 PM')).to.be.false;
      });
    });

  });

  describe('Testes de Edge Cases', () => {

    it('deve tratar null como inválido para email', () => {
      expect(isValidEmail(null as any)).to.be.false;
    });

    it('deve tratar undefined como inválido para senha', () => {
      expect(isValidPassword(undefined as any)).to.be.false;
    });

    it('deve tratar número como inválido para CPF', () => {
      expect(isValidCPF(12345678901 as any)).to.be.false;
    });

    it('deve validar strings com trim para email', () => {
      // Dependendo da implementação, pode precisar de trim
      expect(isValidEmail('  teste@email.com  ')).to.be.false;
    });

  });

});
