import type { T } from '../i18n/ui';

export type BookStatus = 'reading' | 'read' | 'want';

export interface Book {
  title: string;
  author: string;
  status: BookStatus;
  topic: T;
  /** O que ficou do livro, em uma ou duas frases. */
  note?: T;
  link?: string;
}

export const statusLabel: Record<BookStatus, T> = {
  reading: { pt: 'Lendo', en: 'Reading' },
  read: { pt: 'Lido', en: 'Read' },
  want: { pt: 'Quero ler', en: 'Want to read' },
};

/** A lista vem do Gabriel. Enquanto estiver vazia, a página mostra o convite para recomendar um livro. */
export const books: Book[] = [];
