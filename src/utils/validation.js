function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value) {
  return text(value).toLowerCase();
}

export function validateRegistration(body) {
  const data = {
    name: text(body.name),
    email: normalizeEmail(body.email),
    password: typeof body.password === 'string' ? body.password : '',
    passwordConfirm: typeof body.passwordConfirm === 'string' ? body.passwordConfirm : '',
  };
  const errors = {};

  if (data.name.length < 2 || data.name.length > 60) {
    errors.name = 'Your name must be between 2 and 60 characters.';
  }
  if (!data.email.includes('@') || data.email.length > 254) {
    errors.email = 'Enter a valid email address.';
  }
  if (data.password.length < 8) {
    errors.password = 'The password must have at least 8 characters.';
  }
  if (data.passwordConfirm !== data.password) {
    errors.passwordConfirm = 'Passwords do not match.';
  }

  return { data, errors };
}
