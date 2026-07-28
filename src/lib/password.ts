/**
 * Password policy, shared by signup and the settings password change so the two
 * cannot drift apart — a weaker rule on either one makes the stronger rule
 * pointless.
 *
 * These checks run in the browser and are a UX affordance, not enforcement.
 * Anything that actually matters has to be re-checked server-side; see
 * BACKEND-CHANGES.md.
 */

export const PASSWORD_MIN_LENGTH = 8;

/**
 * BCrypt ($2a$, which the backend uses) silently ignores everything past 72
 * bytes. Rejecting longer input beats letting someone believe in a passphrase
 * that is really only its first 72 bytes.
 */
export const PASSWORD_MAX_BYTES = 72;

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "A lowercase letter (a–z)",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    label: "An uppercase letter (A–Z)",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "A number (0–9)",
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: "symbol",
    label: "A special character (!@#$%…)",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

/** Byte length, since the BCrypt limit counts bytes and not UTF-16 units. */
function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Lowercases only the leading character so a label reads naturally mid-sentence.
 * `toLowerCase()` on the whole string would turn "An uppercase letter (A–Z)"
 * into "an uppercase letter (a–z)", which asks for the opposite of the rule.
 */
function decapitalize(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * Returns the first reason `value` is unacceptable, or `null` if it passes.
 * Used for the message shown on submit; the live checklist reads
 * `PASSWORD_RULES` directly.
 */
export function getPasswordError(value: string): string | null {
  const unmet = PASSWORD_RULES.filter((rule) => !rule.test(value));
  if (unmet.length > 0) {
    return `Password must contain: ${unmet
      .map((rule) => decapitalize(rule.label))
      .join(", ")}.`;
  }
  if (byteLength(value) > PASSWORD_MAX_BYTES) {
    return `Password must be ${PASSWORD_MAX_BYTES} bytes or fewer.`;
  }
  return null;
}

export function isPasswordValid(value: string): boolean {
  return getPasswordError(value) === null;
}
