# gabrielmaciel.dev

Portfólio pessoal do Gabriel Maciel. Site estático feito com Astro, three.js, GSAP e cannon-es, em português e inglês, com tema claro e escuro.

## O que tem

- **Início**: hero com um grafo 3D do caminho de um evento no FlowForge (webhook, API, outbox, RabbitMQ, worker, destino). Dá para mandar eventos, mandar duplicado e derrubar a fila.
- **Sobre, trajetória, projetos em destaque e contato.**
- **Ferramentas**: blocos 3D com física (cannon-es) que caem e podem ser arremessados.
- **Projetos** (`/projetos/`, `/en/projects/`): lista com filtro e uma página por projeto.
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
