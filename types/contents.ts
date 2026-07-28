export interface User {
  id: number;
  name: string;
  password: string;
  role: string;
  description: string;
}

export interface WordEntry {
  id: number;
  language: string;
  pos: string;
  word: string;
  meaning: string;
  learned: boolean;
  kundoku: string;
  ondoku: string;
  pronunciation: string;
  example: string;
}

/** Spring PagedModel envelope. `page` is 0-based. */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface WordInput {
  language: string;
  pos: string;
  word: string;
  meaning: string;
  learned: boolean;
  kundoku: string;
  ondoku: string;
  pronunciation: string;
  example: string;
}

export interface SharedFolder {
  id: {
    userId: number;
    folderId: number;
  };
  user: User;
  wordFolder: WordFolder;
  createDate: string;
  likes: number;
}

export interface WordbookClientProps {
  authToken: string;
  userId: string;
}

export interface WordFolder {
  id: number;
  user: User;
  name: string;
  language: string;
}

export interface CreateSentencesPageProps {
  authToken: string | undefined | null;
  userId: string | undefined | null;
  wordId: string | undefined | null;
  word: string | undefined | null;
}

export interface ViewSentencesPageProps {
  authToken: string | undefined | null;
  userId: string | undefined | null;
  wordId: string | undefined | null;
}

export interface SentenceResponse {
  id: number;
  word: WordEntry;
  user: User;
  sentence: String;
  style: String;
  meaning: String;
}
