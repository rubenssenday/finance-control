import { I18nService } from '../../src/common/i18n/i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService();
  });

  describe('resolveLocale', () => {
    it('should default to pt-BR when header is empty or undefined', () => {
      expect(service.resolveLocale(undefined)).toBe('pt-BR');
      expect(service.resolveLocale(null)).toBe('pt-BR');
      expect(service.resolveLocale('')).toBe('pt-BR');
    });

    it('should resolve pt-BR from standard Brazilian accept-language header', () => {
      expect(service.resolveLocale('pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('pt-BR');
      expect(service.resolveLocale('pt')).toBe('pt-BR');
    });

    it('should resolve en-US from English accept-language header', () => {
      expect(service.resolveLocale('en-US,en;q=0.9')).toBe('en-US');
      expect(service.resolveLocale('en')).toBe('en-US');
    });

    it('should fall back to pt-BR for unsupported languages', () => {
      expect(service.resolveLocale('fr-FR,fr;q=0.9,de;q=0.8')).toBe('pt-BR');
    });
  });

  describe('getMessage', () => {
    it('should return pt-BR message when requested in pt-BR', () => {
      const msg = service.getMessage('EXP001', 'pt-BR');
      expect(msg).toContain('Por favor, preencha todos os campos obrigatórios');
    });

    it('should return en-US message when requested in en-US', () => {
      const msg = service.getMessage('EXP001', 'en-US');
      expect(msg).toContain('Please fill in all mandatory fields');
    });

    it('should fall back to en-US or fallbackMessage if code not in pt-BR', () => {
      const msg = service.getMessage('UNKNOWN_CODE', 'pt-BR', 'Custom fallback');
      expect(msg).toBe('Custom fallback');
    });
  });

  describe('translate', () => {
    it('should translate error code using accept-language header', () => {
      const ptMsg = service.translate('AUTH001', 'Default', 'pt-BR');
      expect(ptMsg).toBe('Credenciais inválidas. Verifique seu e-mail e senha.');

      const enMsg = service.translate('AUTH001', 'Default', 'en-US');
      expect(enMsg).toBe('Invalid credentials. Please verify your email and password.');
    });

    it('should return original message if code is undefined', () => {
      expect(service.translate(undefined, 'Raw message', 'pt-BR')).toBe('Raw message');
    });
  });
});
