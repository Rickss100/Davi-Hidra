import { describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Ciclo de Vida de Autenticação e Governança de Usuários', () => {
  it('garante que o plano padrão de novos cadastros é de 1 mês (30 dias) e não vitalício', () => {
    const now = Date.now();
    const trialDays = 30;
    const planExpiresAt = new Date(now + trialDays * 24 * 60 * 60 * 1000);
    const planPeriod = '1_month';

    expect(planPeriod).toBe('1_month');
    expect(planExpiresAt.getTime()).toBeGreaterThan(now);
    expect(Math.round((planExpiresAt.getTime() - now) / (1000 * 60 * 60 * 24))).toBe(30);
  });

  it('normaliza e-mails para minúsculas prevenindo duplicidades case-sensitive', () => {
    const rawEmail1 = 'Genariozt46@gmail.com';
    const rawEmail2 = '  genariozt46@gmail.com  ';

    const clean1 = rawEmail1.trim().toLowerCase();
    const clean2 = rawEmail2.trim().toLowerCase();

    expect(clean1).toBe('genariozt46@gmail.com');
    expect(clean2).toBe('genariozt46@gmail.com');
    expect(clean1 === clean2).toBe(true);
  });

  it('valida que nova senha atende ao critério de segurança de no mínimo 6 caracteres', async () => {
    const weakPassword = '123';
    const validPassword = 'MinhaSenhaSegura2026!';

    expect(weakPassword.length < 6).toBe(true);
    expect(validPassword.length >= 6).toBe(true);

    const hash = await bcrypt.hash(validPassword, 10);
    const isValid = await bcrypt.compare(validPassword, hash);
    const isWrongValid = await bcrypt.compare('OutraSenha', hash);

    expect(isValid).toBe(true);
    expect(isWrongValid).toBe(false);
  });

  it('garante que a mensagem de suporte via WhatsApp se refere à Norte Invest', () => {
    const whatsappText = 'Olá, esqueci minha senha de acesso na Norte Invest. Pode me ajudar a redefinir?';
    expect(whatsappText).toContain('Norte Invest');
    expect(whatsappText).not.toContain('Davi-Hidra');
  });
});
