/**
 * The language a folder's meanings are written in — i.e. the language its owner
 * speaks, not the language being studied (that one is `WordFolder.language`).
 * Stored as an ISO 639-1 code so folders from different users can be matched;
 * only the display name is ever shown in the UI.
 */
export interface MeaningLanguage {
  code: string;
  name: string;
}

// Order is deliberate: it drives every dropdown, so the most common choices
// come first rather than being sorted alphabetically.
export const MEANING_LANGUAGES: MeaningLanguage[] = [
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
];

export const DEFAULT_MEANING_LANGUAGE = "en";

const NAME_BY_CODE = new Map(MEANING_LANGUAGES.map((l) => [l.code, l.name]));

/**
 * Reduces anything the browser or an older record may hand us ("ko-KR", "EN")
 * to a bare lowercase code. Returns "" for a missing value so callers can tell
 * "not set" apart from a real code.
 */
export function normalizeMeaningLanguage(
  value: string | null | undefined,
): string {
  if (!value) return "";
  return value.trim().toLowerCase().split(/[-_]/)[0];
}

/** "ko" -> "Korean". Unknown codes are shown as-is rather than hidden. */
export function meaningLanguageName(value: string | null | undefined): string {
  const code = normalizeMeaningLanguage(value);
  if (!code) return "Not set";
  return NAME_BY_CODE.get(code) ?? code.toUpperCase();
}

/**
 * Best guess at the language the user writes meanings in, used to preselect the
 * dropdown. Falls back to English when the browser locale isn't one we list.
 */
export function detectMeaningLanguage(): string {
  if (typeof navigator === "undefined") return DEFAULT_MEANING_LANGUAGE;
  for (const locale of navigator.languages ?? [navigator.language]) {
    const code = normalizeMeaningLanguage(locale);
    if (NAME_BY_CODE.has(code)) return code;
  }
  return DEFAULT_MEANING_LANGUAGE;
}

/**
 * " · Korean" for tacking onto a folder name. Empty when the folder has no code
 * yet, so folders created before this field existed just show their name.
 */
export function meaningLanguageSuffix(
  value: string | null | undefined,
  separator = " · ",
): string {
  const code = normalizeMeaningLanguage(value);
  return code ? `${separator}${meaningLanguageName(code)}` : "";
}

/** Filter predicate for the meaning-language dropdowns. "" means "all". */
export function matchesMeaningLanguage(
  value: string | null | undefined,
  filter: string,
): boolean {
  if (!filter) return true;
  return normalizeMeaningLanguage(value) === normalizeMeaningLanguage(filter);
}

/**
 * The distinct meaning languages present in a set of folders, for building a
 * filter dropdown. Follows MEANING_LANGUAGES order so the filters and the
 * create-folder picker read the same way; folders with no code are left out.
 */
export function meaningLanguagesIn(
  items: { meaningLanguage?: string | null }[],
): MeaningLanguage[] {
  const codes = new Set<string>();
  for (const item of items) {
    const code = normalizeMeaningLanguage(item.meaningLanguage);
    if (code) codes.add(code);
  }
  const known = MEANING_LANGUAGES.filter((lang) => codes.has(lang.code));
  // anything a folder carries that we don't list goes last, in code order
  const unknown = [...codes]
    .filter((code) => !NAME_BY_CODE.has(code))
    .sort()
    .map((code) => ({ code, name: meaningLanguageName(code) }));
  return [...known, ...unknown];
}
