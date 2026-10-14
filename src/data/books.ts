import type { T } from '../i18n/ui';

export type BookStatus = 'reading' | 'read' | 'want';

export interface Book {
  /** Título da edição brasileira em `pt` e o título em inglês em `en`. */
  title: T;
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

const engineering: T = { pt: 'Engenharia de software', en: 'Software engineering' };
const literature: T = { pt: 'Literatura', en: 'Literature' };

export const books: Book[] = [
  {
    title: { pt: 'Flores para Algernon', en: 'Flowers for Algernon' },
    author: 'Daniel Keyes',
    status: 'reading',
    topic: literature,
  },
  {
    title: { pt: 'O Programador Pragmático', en: 'The Pragmatic Programmer' },
    author: 'David Thomas, Andrew Hunt',
    status: 'read',
    topic: engineering,
  },
  {
    title: { pt: 'Fundamentos da Arquitetura de Software', en: 'Fundamentals of Software Architecture' },
    author: 'Mark Richards, Neal Ford',
    status: 'read',
    topic: engineering,
  },
  {
    title: { pt: 'Projetando Aplicações com Uso Intensivo de Dados', en: 'Designing Data-Intensive Applications' },
    author: 'Martin Kleppmann',
    status: 'read',
    topic: engineering,
  },
  {
    title: { pt: 'Código Limpo', en: 'Clean Code' },
    author: 'Robert C. Martin',
    status: 'read',
    topic: engineering,
  },
  {
    title: { pt: 'Crime e Castigo', en: 'Crime and Punishment' },
    author: 'Fiódor Dostoiévski',
    status: 'read',
    topic: literature,
  },
  {
    title: { pt: 'Memórias Póstumas de Brás Cubas', en: 'The Posthumous Memoirs of Brás Cubas' },
    author: 'Machado de Assis',
    status: 'read',
    topic: literature,
  },
  {
    title: { pt: 'O Pequeno Príncipe', en: 'The Little Prince' },
    author: 'Antoine de Saint-Exupéry',
    status: 'read',
    topic: literature,
  },
];
