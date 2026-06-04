const PASSWORD_CATEGORIES = [
  /[A-Z]/,
  /[a-z]/,
  /[0-9]/,
  /[^A-Za-z0-9]/,
] as const;

export function getPasswordCategoryCount(password: string) {
  return PASSWORD_CATEGORIES.reduce(
    (count, pattern) => count + (pattern.test(password) ? 1 : 0),
    0
  );
}

export function validateRegistrationPassword(password: string) {
  if (password.length < 6) {
    return "密码长度至少 6 个字符";
  }

  if (getPasswordCategoryCount(password) < 2) {
    return "密码需至少包含大写字母、小写字母、数字、符号中的任意两类";
  }

  return null;
}
