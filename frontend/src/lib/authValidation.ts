export type LoginFormValues = {
  identifier: string;
  password: string;
};

export type RegisterFormValues = {
  name: string;
  uniqueUserId: string;
  email: string;
  password: string;
};

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_ID_RE = /^[a-zA-Z0-9_]{3,24}$/;

export function validateLogin(
  values: LoginFormValues
): FieldErrors<"identifier" | "password"> {
  const errors: FieldErrors<"identifier" | "password"> = {};
  const identifier = values.identifier.trim();
  const password = values.password;

  if (!identifier) {
    errors.identifier = "Enter your email or username.";
  }
  if (!password) {
    errors.password = "Enter your password.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export function validateRegister(
  values: RegisterFormValues
): FieldErrors<"name" | "uniqueUserId" | "email" | "password"> {
  const errors: FieldErrors<"name" | "uniqueUserId" | "email" | "password"> =
    {};
  const name = values.name.trim();
  const uniqueUserId = values.uniqueUserId.trim();
  const email = values.email.trim();
  const password = values.password;

  if (!name) {
    errors.name = "Enter your name.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!uniqueUserId) {
    errors.uniqueUserId = "Choose a username.";
  } else if (!USER_ID_RE.test(uniqueUserId)) {
    errors.uniqueUserId =
      "Use 3–24 letters, numbers, or underscores.";
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Create a password.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export function firstErrorKey<T extends string>(
  errors: FieldErrors<T>
): T | null {
  const keys = Object.keys(errors) as T[];
  return keys.length ? keys[0] : null;
}

export function mapAuthError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  const message = err.message || "";
  const status =
    "status" in err && typeof (err as { status?: number }).status === "number"
      ? (err as { status: number }).status
      : undefined;

  if (
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("networkerror")
  ) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  if (status === 401) {
    return "Invalid email/user ID or password.";
  }
  if (status === 409) {
    return "An account with that email or username already exists.";
  }
  if (status === 400) {
    return message || "Please check your details and try again.";
  }
  if (status && status >= 500) {
    return "The server had a problem. Please try again in a moment.";
  }

  return message || "Something went wrong. Please try again.";
}
