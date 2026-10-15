import type { ImageMetadata } from 'astro';
import type { T } from '../i18n/ui';

import algernon from '../assets/books/algernon.jpg';
import pragmatico from '../assets/books/pragmatico.jpg';
import arquitetura from '../assets/books/arquitetura.jpg';
import dados from '../assets/books/dados.jpg';
import codigoLimpo from '../assets/books/codigo-limpo.jpg';
import crimeECastigo from '../assets/books/crime-e-castigo.jpg';
import brasCubas from '../assets/books/bras-cubas.jpg';
import pequenoPrincipe from '../assets/books/pequeno-principe.jpg';

export type BookStatus = 'reading' | 'read' | 'want';

export interface Book {
  /** Título da edição brasileira em `pt` e o título em inglês em `en`. */
  title: T;
  author: string;
  status: BookStatus;
  topic: T;
  /** Capa da edição brasileira. */
  cover: ImageMetadata;
  /** O que ficou do livro, em uma ou duas frases. */
  note?: T;
  /** Página da edição na Amazon Brasil. */
  link: string;
}

const amazon = (asin: string) => `https://www.amazon.com.br/dp/${asin}`;

export const statusLabel: Record<BookStatus, T> = {
  reading: { pt: 'Lendo', en: 'Reading' },
  read: { pt: 'Lido', en: 'Read' },
  want: { pt: 'Quero ler', en: 'Want to read' },
};

const engineering: T = { pt: 'Engenharia de software', en: 'Software engineering' };
const literature: T = { pt: 'Literatura', en: 'Literature' };

/** A ordem aqui é a ordem em que os livros aparecem na estante. */
export const books: Book[] = [
  {
    title: { pt: 'Código Limpo', en: 'Clean Code' },
    author: 'Robert C. Martin',
    status: 'read',
    topic: engineering,
    cover: codigoLimpo,
    link: amazon('8576082675'),
  },
  {
    title: { pt: 'Crime e Castigo', en: 'Crime and Punishment' },
    author: 'Fiódor Dostoiévski',
    status: 'read',
    topic: literature,
    cover: crimeECastigo,
    link: amazon('8573266465'),
  },
  {
    title: { pt: 'O Pequeno Príncipe', en: 'The Little Prince' },
    author: 'Antoine de Saint-Exupéry',
    status: 'read',
    topic: literature,
    cover: pequenoPrincipe,
    link: amazon('8595081514'),
  },
  {
    title: { pt: 'Flores para Algernon', en: 'Flowers for Algernon' },
    author: 'Daniel Keyes',
    status: 'reading',
    topic: literature,
    cover: algernon,
    link: amazon('B07F1YS9NB'),
  },
  {
    title: { pt: 'O Programador Pragmático', en: 'The Pragmatic Programmer' },
    author: 'David Thomas, Andrew Hunt',
    status: 'read',
    topic: engineering,
    cover: pragmatico,
    link: amazon('8582606877'),
  },
  {
    title: { pt: 'Fundamentos da Arquitetura de Software', en: 'Fundamentals of Software Architecture' },
    author: 'Mark Richards, Neal Ford',
    status: 'read',
    topic: engineering,
    cover: arquitetura,
    link: amazon('8550819859'),
  },
  {
    title: { pt: 'Projetando Aplicações com Uso Intensivo de Dados', en: 'Designing Data-Intensive Applications' },
    author: 'Martin Kleppmann',
    status: 'read',
    topic: engineering,
    cover: dados,
    link: amazon('6583913062'),
  },
  {
    title: { pt: 'Memórias Póstumas de Brás Cubas', en: 'The Posthumous Memoirs of Brás Cubas' },
    author: 'Machado de Assis',
    status: 'read',
    topic: literature,
    cover: brasCubas,
    link: amazon('8582850018'),
  },
];
