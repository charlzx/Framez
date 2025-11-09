export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters
  return password.length >= 8;
};

export const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string } => {
  if (password.length < 8) {
    return { strength: 'weak', message: 'Password must be at least 8 characters' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (criteriaCount >= 3 && password.length >= 10) {
    return { strength: 'strong', message: 'Strong password' };
  } else if (criteriaCount >= 2 && password.length >= 8) {
    return { strength: 'medium', message: 'Medium password - consider adding special characters' };
  } else {
    return { strength: 'weak', message: 'Weak password - use uppercase, lowercase, numbers, and special characters' };
  }
};

export const validateName = (name: string): boolean => {
  // At least 2 characters
  return name.trim().length >= 2;
};

export const validatePostContent = (content: string): boolean => {
  // Allow empty content if there's an image, otherwise require at least 1 character
  return content.trim().length > 0;
};
