"use client";

import { api } from "./api";
import type { Page, WordEntry } from "../../types/contents";

export const WORDS_PAGE_SIZE = 10;

// Stable ordering matters: without it the backend may return rows in an
// arbitrary order and the same word can show up on two different pages.
const DEFAULT_SORT = "id,ASC";

// Bulk reads use a bigger window so whole-folder loads don't turn into
// hundreds of round trips.
const BULK_PAGE_SIZE = 200;

export const EMPTY_WORDS_PAGE: Page<WordEntry> = {
  content: [],
  page: 0,
  size: WORDS_PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

/** One page of a folder's words. `page` is 0-based, matching the backend. */
export async function fetchWordsPage(
  folderId: number,
  page: number,
  size: number = WORDS_PAGE_SIZE,
): Promise<Page<WordEntry>> {
  const response = await api.get<Page<WordEntry>>(
    `/folder/getwords/${folderId}`,
    { params: { page, size, sort: DEFAULT_SORT } },
  );
  return response.data;
}

/** Word count only — asks for a single row and reads totalElements off it. */
export async function fetchWordCount(folderId: number): Promise<number> {
  const { totalElements } = await fetchWordsPage(folderId, 0, 1);
  return totalElements;
}

/**
 * Every word in a folder. Only for callers that genuinely need the whole set —
 * the quiz picks random questions and builds distractors from the full pool.
 * Everything that just displays words should page instead.
 */
export async function fetchAllWords(folderId: number): Promise<WordEntry[]> {
  const firstPage = await fetchWordsPage(folderId, 0, BULK_PAGE_SIZE);
  if (firstPage.totalPages <= 1) return firstPage.content;

  const remaining = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchWordsPage(folderId, index + 1, BULK_PAGE_SIZE),
    ),
  );
  return [...firstPage.content, ...remaining.flatMap((p) => p.content)];
}
