const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
};

// Minimum 8 characters, and must include at least one uppercase letter,
// one lowercase letter, one number, and one special character.
export const isStrongPassword = (password) => {
  if (typeof password !== "string" || password.length < 8) return false;

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

export const PASSWORD_RULES =
  "Must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
