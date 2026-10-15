# gabrielmaciel.dev

Portfólio pessoal do Gabriel Maciel. Site estático feito com Astro, three.js, GSAP e cannon-es, em português e inglês, com tema claro e escuro.

## O que tem

- **Início**: fundo de partículas em WebGL com shader próprio (`src/scripts/world.ts`). No topo as partículas formam um globo só com os continentes, com Belo Horizonte marcada e arcos saindo dela; ao rolar, viram um terreno em onda e depois uma galáxia em espiral. O globo gira ao arrastar e as partículas desviam do ponteiro. Os pontos dos continentes saem de `scripts/gerar-globo.mjs`.
- **Cabeçalho** flutuante com o horário de Belo Horizonte ao vivo.
- **Terminal escondido**: a tecla ` ou Ctrl+K abre um terminal com `help`, `neofetch`, `projetos`, `livros`, `contato`, `tema`, `idioma` e outros (`src/scripts/terminal.ts`). No celular abre pelo link do rodapé.
- **Sobre, trajetória, projetos em destaque e contato.**
- **Ferramentas**: blocos 3D com física (cannon-es) que caem e podem ser arremessados.
- **Projetos** (`/projetos/`, `/en/projects/`): lista com filtro e uma página por projeto. FlowForge, Conta Aberta e ZapBebidas têm "Em números" (contado nos repositórios, `stats` em `src/data/projects.ts`) e diagrama de arquitetura (`src/data/diagrams.ts`). A página do FlowForge tem a demo 3D do caminho de um evento.
- **Livros** (`/livros/`, `/en/books/`): lista com filtro por situação.

## Onde mexer no conteúdo

| O quê | Arquivo |
|---|---|
| Projetos (textos, stack, links, imagens) | `src/data/projects.ts` |
| Trajetória, formação e ferramentas | `src/data/profile.ts` |
| Livros | `src/data/books.ts` |
| Textos fixos de navegação e rodapé | `src/i18n/ui.ts` |
| Textos do hero e da demo | `src/components/Hero.astro` |
| Cores e tipografia | `src/styles/global.css` |

Todo texto tem versão `pt` e `en`.

## Rodar

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera a pasta dist/
npm run preview  # serve a dist/
```

## Publicação

O site fica no GitHub Pages, de graça. Todo push na `main` roda o workflow `.github/workflows/deploy.yml`, que gera o build e publica.

O domínio `gabrielmaciel.dev` é da Hostinger e só aponta para o GitHub Pages. O arquivo `public/CNAME` diz ao GitHub qual é o domínio. Na zona DNS da Hostinger ficam:

| Tipo | Nome | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | gabxw.github.io |

O certificado HTTPS é emitido pelo próprio GitHub depois que o DNS propaga.

## Acessibilidade e desempenho

- As cenas 3D carregam depois do conteúdo e param quando saem da tela ou a aba fica oculta.
- Sem WebGL, o hero mostra uma versão estática do grafo e a seção de ferramentas mostra só a lista.
- Com "reduzir movimento" ligado no sistema, não há animação de entrada nem eventos automáticos.
- O botão de pausa no registro da demo para todo o movimento automático.
