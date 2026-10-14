export const locales = ['pt', 'en'] as const;
export type Locale = (typeof locales)[number];

/** Texto com versão nos dois idiomas. */
export type T = Record<Locale, string>;

export const htmlLang: Record<Locale, string> = { pt: 'pt-BR', en: 'en' };

type RouteKey = 'home' | 'projects' | 'books';

const routes: Record<RouteKey, Record<Locale, string>> = {
  home: { pt: '/', en: '/en/' },
  projects: { pt: '/projetos/', en: '/en/projects/' },
  books: { pt: '/livros/', en: '/en/books/' },
};

export function route(key: RouteKey, locale: Locale): string {
  return routes[key][locale];
}

export function projectRoute(slug: string, locale: Locale): string {
  return `${routes.projects[locale]}${slug}/`;
}

export const ui = {
  pt: {
    skip: 'Pular para o conteúdo',
    nav: { home: 'Início', projects: 'Projetos', books: 'Livros' },
    navLabel: 'Navegação principal',
    langLabel: 'Idioma',
    langSwitch: 'Read in English',
    langShort: 'EN',
    theme: { toLight: 'Usar tema claro', toDark: 'Usar tema escuro' },
    role: 'Desenvolvedor backend',
    city: 'Belo Horizonte, Brasil',
    localTime: 'Agora em BH',
    footerNote: 'Feito com Astro, three.js e GSAP.',
    contactCta: 'Falar comigo',
    seeProjects: 'Ver projetos',
    copyEmail: 'Copiar e-mail',
    copied: 'E-mail copiado',
    backToProjects: 'Todos os projetos',
    viewProject: 'Ver projeto',
    visit: 'Abrir o site',
    source: 'Ver o código',
    related: 'Outros projetos',
  },
  en: {
    skip: 'Skip to content',
    nav: { home: 'Home', projects: 'Projects', books: 'Books' },
    navLabel: 'Main navigation',
    langLabel: 'Language',
    langSwitch: 'Ler em português',
    langShort: 'PT',
    theme: { toLight: 'Switch to light theme', toDark: 'Switch to dark theme' },
    role: 'Backend developer',
    city: 'Belo Horizonte, Brazil',
    localTime: 'Now in BH',
    footerNote: 'Built with Astro, three.js and GSAP.',
    contactCta: 'Get in touch',
    seeProjects: 'See projects',
    copyEmail: 'Copy email',
    copied: 'Email copied',
    backToProjects: 'All projects',
    viewProject: 'View project',
    visit: 'Open the site',
    source: 'View the code',
    related: 'More projects',
  },
} as const;

export const contact = {
  email: 'gabriel.jmaciel13@gmail.com',
  linkedin: 'https://www.linkedin.com/in/gabrieljmacieldev',
  github: 'https://github.com/gabxw',
};

const monthsPt = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-06" vira "jun 2026" ou "Jun 2026". */
export function formatMonth(ym: string, locale: Locale): string {
  const [y, m] = ym.split('-').map(Number);
  return `${(locale === 'pt' ? monthsPt : monthsEn)[m - 1]} ${y}`;
}
