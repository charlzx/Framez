import {
  validateEmail,
  validatePassword,
  getPasswordStrength,
  validateName,
  validatePostContent,
} from '../validation';

describe('validateEmail', () => {
  it('accepts common valid email formats', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@sub.domain.co')).toBe(true);
  });

  it('rejects malformed email inputs', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('missing.local.part@')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('requires at least eight characters', () => {
    expect(validatePassword('1234567')).toBe(false);
    expect(validatePassword('12345678')).toBe(true);
  });
});

describe('getPasswordStrength', () => {
  it('flags passwords shorter than eight characters as weak', () => {
    expect(getPasswordStrength('Short1!')).toEqual({
      strength: 'weak',
      message: 'Password must be at least 8 characters',
    });
  });

  it('returns weak when requirements are not met despite length', () => {
    expect(getPasswordStrength('abcdefgh')).toEqual({
      strength: 'weak',
      message: 'Weak password - use uppercase, lowercase, numbers, and special characters',
    });
  });

  it('returns medium when length is sufficient but criteria are limited', () => {
    expect(getPasswordStrength('Password1')).toEqual({
      strength: 'medium',
      message: 'Medium password - consider adding special characters',
    });
  });

  it('returns strong when length and criteria thresholds are met', () => {
    expect(getPasswordStrength('StrongPass1!')).toEqual({
      strength: 'strong',
      message: 'Strong password',
    });
  });
});

describe('validateName', () => {
  it('requires at least two non-space characters', () => {
    expect(validateName('A')).toBe(false);
    expect(validateName('  ')).toBe(false);
    expect(validateName('Al')).toBe(true);
  });
});

describe('validatePostContent', () => {
  it('rejects empty or whitespace-only content', () => {
    expect(validatePostContent('')).toBe(false);
    expect(validatePostContent('   ')).toBe(false);
  });

  it('accepts content with non-whitespace characters', () => {
    expect(validatePostContent('Hello Framez')).toBe(true);
  });
});
