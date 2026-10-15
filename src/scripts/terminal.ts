// Terminal escondido do site. Os dados vêm do JSON que o Astro deixa dentro do <dialog>.
interface TermData {
  locale: 'pt' | 'en';
  alternate: string;
  routes: { home: string; projects: string; books: string };
  contact: { email: string; linkedin: string; github: string };
  projects: { slug: string; name: string; summary: string; live: boolean; url: string; stack: string[] }[];
  books: { title: string; author: string; status: string; reading: boolean }[];
  daily: string[];
  tools: string[];
}

const ART = [
  '  ██████   ███    ███',
  ' ██        ████  ████',
  ' ██   ███  ██ ████ ██',
  ' ██    ██  ██  ██  ██',
  '  ██████   ██      ██',
].join('\n');

const text = {
  pt: {
    welcome: 'Bem-vindo ao terminal do gabrielmaciel.dev. Digite help para ver os comandos.',
    help: [
      ['help', 'lista os comandos'],
      ['whoami', 'quem eu sou, em uma frase'],
      ['neofetch', 'meu perfil no estilo terminal'],
      ['projetos', 'lista os projetos; projetos <nome> abre um deles'],
      ['livros', 'o que já li e o que estou lendo'],
      ['stack', 'as ferramentas que eu uso'],
      ['contato', 'e-mail, LinkedIn e GitHub'],
      ['email', 'copia meu e-mail'],
      ['cd <página>', 'vai para inicio, projetos ou livros'],
      ['tema', 'troca entre claro e escuro'],
      ['idioma', 'muda o site para inglês'],
      ['hora', 'que horas são em Belo Horizonte'],
      ['clear', 'limpa a tela'],
      ['exit', 'fecha o terminal (ou Esc)'],
    ],
    whoami:
      'Gabriel Maciel. Desenvolvedor de software em Belo Horizonte, com foco em backend: sistemas, APIs, integrações e automações. Hoje no Grupo Roma Brasil, estudando Engenharia de Software.',
    notFound: (c: string) => `comando não encontrado: ${c}. Digite help.`,
    noProject: (c: string) => `projeto não encontrado: ${c}. Digite projetos para ver a lista.`,
    opening: (n: string) => `abrindo ${n}...`,
    copied: 'e-mail copiado para a área de transferência.',
    copyFail: 'não consegui copiar; o e-mail é',
    theme: (t: string) => `tema ${t === 'dark' ? 'escuro' : 'claro'} ativado.`,
    lang: 'switching to English...',
    time: (t: string) => `${t} em Belo Horizonte (UTC-3).`,
    sudo: 'permissão negada. boa tentativa.',
    rm: 'aqui não. esse site tem backup e eu tenho apego.',
    pages: 'páginas: inicio  projetos  livros',
    cdUnknown: (p: string) => `página não encontrada: ${p}. Use inicio, projetos ou livros.`,
    projectsHint: 'Digite projetos <nome>, por exemplo: projetos flowforge',
    live: 'no ar',
    neo: {
      role: 'Função',
      roleV: 'Desenvolvedor de software, foco em backend',
      place: 'Local',
      placeV: 'Belo Horizonte, MG (UTC-3)',
      work: 'Trabalho',
      workV: 'Grupo Roma Brasil',
      study: 'Estudo',
      studyV: 'Engenharia de Software, UFBRA',
      stack: 'Stack',
      projects: 'Projetos',
      projectsV: (n: number, live: number) => `${n} (${live} no ar)`,
      books: 'Livros',
      booksV: (n: number, reading?: string) => `${n}${reading ? `, lendo ${reading}` : ''}`,
      off: 'Fora do código',
      offV: 'economia, literatura, música e viagens',
      shell: 'Shell',
      shellV: 'gm-sh 1.0, feito para este site',
    },
  },
  en: {
    welcome: 'Welcome to the gabrielmaciel.dev terminal. Type help to see the commands.',
    help: [
      ['help', 'lists the commands'],
      ['whoami', 'who I am, in one sentence'],
      ['neofetch', 'my profile, terminal style'],
      ['projects', 'lists the projects; projects <name> opens one'],
      ['books', "what I've read and what I'm reading"],
      ['stack', 'the tools I use'],
      ['contact', 'email, LinkedIn and GitHub'],
      ['email', 'copies my email'],
      ['cd <page>', 'goes to home, projects or books'],
      ['theme', 'switches between light and dark'],
      ['lang', 'switches the site to Portuguese'],
      ['time', "what time it is in Belo Horizonte"],
      ['clear', 'clears the screen'],
      ['exit', 'closes the terminal (or Esc)'],
    ],
    whoami:
      'Gabriel Maciel. Software developer in Belo Horizonte, Brazil, focused on backend: systems, APIs, integrations and automations. Currently at Grupo Roma Brasil, studying Software Engineering.',
    notFound: (c: string) => `command not found: ${c}. Type help.`,
    noProject: (c: string) => `project not found: ${c}. Type projects to see the list.`,
    opening: (n: string) => `opening ${n}...`,
    copied: 'email copied to the clipboard.',
    copyFail: "couldn't copy it; the email is",
    theme: (t: string) => `${t} theme on.`,
    lang: 'mudando para português...',
    time: (t: string) => `${t} in Belo Horizonte (UTC-3).`,
    sudo: 'permission denied. nice try.',
    rm: 'not here. this site has backups and I have feelings.',
    pages: 'pages: home  projects  books',
    cdUnknown: (p: string) => `page not found: ${p}. Use home, projects or books.`,
    projectsHint: 'Type projects <name>, for example: projects flowforge',
    live: 'live',
    neo: {
      role: 'Role',
      roleV: 'Software developer, backend focused',
      place: 'Location',
      placeV: 'Belo Horizonte, Brazil (UTC-3)',
      work: 'Work',
      workV: 'Grupo Roma Brasil',
      study: 'Study',
      studyV: 'Software Engineering, UFBRA',
      stack: 'Stack',
      projects: 'Projects',
      projectsV: (n: number, live: number) => `${n} (${live} live)`,
      books: 'Books',
      booksV: (n: number, reading?: string) => `${n}${reading ? `, reading ${reading}` : ''}`,
      off: 'Off the clock',
      offV: 'economics, literature, music and travel',
      shell: 'Shell',
      shellV: 'gm-sh 1.0, built for this site',
    },
  },
};

export function mountTerminal(dialog: HTMLDialogElement) {
  const data: TermData = JSON.parse(dialog.querySelector('[data-term-data]')!.textContent!);
  const t = text[data.locale];
  const out = dialog.querySelector<HTMLElement>('[data-term-out]')!;
  const form = dialog.querySelector<HTMLFormElement>('[data-term-form]')!;
  const input = dialog.querySelector<HTMLInputElement>('[data-term-input]')!;
  const history: string[] = [];
  let cursor = 0;

  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

  function print(html: string, cls = '') {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.innerHTML = html;
    out.append(line);
    out.scrollTop = out.scrollHeight;
  }

  const go = (url: string, label: string) => {
    print(esc(t.opening(label)), 'l-dim');
    setTimeout(() => (window.location.href = url), 350);
  };

  const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length));

  function neofetch() {
    const live = data.projects.filter((p) => p.live).length;
    const reading = data.books.find((b) => b.reading)?.title;
    const n = t.neo;
    const rows: [string, string][] = [
      [n.role, n.roleV],
      [n.place, n.placeV],
      [n.work, n.workV],
      [n.study, n.studyV],
      [n.stack, data.daily.slice(0, 6).join(', ')],
      [n.projects, n.projectsV(data.projects.length, live)],
      [n.books, n.booksV(data.books.length, reading)],
      [n.off, n.offV],
      [n.shell, n.shellV],
    ];
    const info = [
      '<b>gabriel</b>@<b>maciel</b>',
      '-'.repeat(16),
      ...rows.map(([k, v]) => `<b>${esc(k)}</b>: ${esc(v)}`),
      '<span class="swatches">' + ['#052e16', '#15803d', '#22c55e', '#4ade80', '#bbf7d0', '#e4ede7'].map((c) => `<i style="background:${c}"></i>`).join('') + '</span>',
    ].join('\n');
    print(`<div class="neo"><div class="neo-art">${esc(ART)}</div><div class="neo-info">${info}</div></div>`);
  }

  const pageAlias: Record<string, string> = {
    inicio: data.routes.home,
    início: data.routes.home,
    home: data.routes.home,
    '~': data.routes.home,
    projetos: data.routes.projects,
    projects: data.routes.projects,
    livros: data.routes.books,
    books: data.routes.books,
  };

  const commands: Record<string, (args: string[]) => void> = {
    help: () => print(t.help.map(([c, d]) => `<span class="l-ok">${esc(pad(c, 14))}</span>${esc(d)}`).join('\n')),
    whoami: () => print(esc(t.whoami)),
    neofetch,
    projetos: (args) => {
      if (args[0]) {
        const q = args.join(' ').toLowerCase();
        const p = data.projects.find((x) => x.slug === q || x.name.toLowerCase().startsWith(q));
        if (p) go(p.url, p.name);
        else print(esc(t.noProject(q)), 'l-err');
        return;
      }
      print(
        data.projects
          .map((p) => `<span class="l-ok">${esc(pad(p.slug, 14))}</span>${esc(p.summary)}${p.live ? ` <span class="l-dim">[${t.live}]</span>` : ''}`)
          .join('\n'),
      );
      print(esc(t.projectsHint), 'l-dim');
    },
    livros: () =>
      print(data.books.map((b) => `<span class="l-ok">${esc(pad(b.status, 10))}</span>${esc(b.title)} <span class="l-dim">${esc(b.author)}</span>`).join('\n')),
    stack: () => print(data.tools.map((x) => (data.daily.includes(x) ? `<span class="l-ok">${esc(x)}</span>` : esc(x))).join('  ')),
    contato: () =>
      print(
        [
          `email     <a href="mailto:${esc(data.contact.email)}">${esc(data.contact.email)}</a>`,
          `linkedin  <a href="${esc(data.contact.linkedin)}">${esc(data.contact.linkedin.replace('https://www.', ''))}</a>`,
          `github    <a href="${esc(data.contact.github)}">${esc(data.contact.github.replace('https://', ''))}</a>`,
        ].join('\n'),
      ),
    email: async () => {
      try {
        await navigator.clipboard.writeText(data.contact.email);
        print(esc(t.copied), 'l-ok');
      } catch {
        print(`${esc(t.copyFail)} ${esc(data.contact.email)}`, 'l-err');
      }
    },
    cd: (args) => {
      const target = (args[0] ?? '~').toLowerCase().replace(/\/$/, '');
      const url = pageAlias[target];
      if (url) go(url, target);
      else print(esc(t.cdUnknown(target)), 'l-err');
    },
    ls: () => print(esc(t.pages)),
    tema: (args) => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')!;
      const current = meta.content === 'dark' || (meta.content !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      const wanted = args[0] ? (/^(claro|light)$/i.test(args[0]) ? 'light' : 'dark') : current === 'dark' ? 'light' : 'dark';
      if (wanted !== current) document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click();
      print(esc(t.theme(wanted)), 'l-ok');
    },
    idioma: () => go(data.alternate, data.locale === 'pt' ? 'English' : 'Português'),
    hora: () => {
      const now = new Intl.DateTimeFormat(data.locale === 'pt' ? 'pt-BR' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo',
      }).format(new Date());
      print(esc(t.time(now)));
    },
    echo: (args) => print(esc(args.join(' '))),
    history: () => print(history.map((h, i) => `${String(i + 1).padStart(3)}  ${esc(h)}`).join('\n') || ' '),
    clear: () => (out.innerHTML = ''),
    exit: () => dialog.close(),
    sudo: () => print(esc(t.sudo), 'l-err'),
    rm: () => print(esc(t.rm), 'l-err'),
  };

  // Os mesmos comandos em português e inglês.
  const alias: Record<string, string> = {
    ajuda: 'help',
    sobre: 'whoami',
    projects: 'projetos',
    open: 'projetos',
    abrir: 'projetos',
    books: 'livros',
    ferramentas: 'stack',
    tools: 'stack',
    contact: 'contato',
    theme: 'tema',
    lang: 'idioma',
    language: 'idioma',
    time: 'hora',
    date: 'hora',
    limpar: 'clear',
    cls: 'clear',
    sair: 'exit',
    quit: 'exit',
    historico: 'history',
  };

  function run(raw: string) {
    const line = raw.trim();
    print(`<span>gabriel@maciel:~$</span> ${esc(line)}`, 'l-cmd');
    if (!line) return;
    history.push(line);
    cursor = history.length;
    const [name, ...args] = line.split(/\s+/);
    const key = alias[name.toLowerCase()] ?? name.toLowerCase();
    const cmd = commands[key];
    if (cmd) cmd(args);
    else print(esc(t.notFound(name)), 'l-err');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      cursor = Math.max(0, cursor - 1);
      input.value = history[cursor];
    } else if (e.key === 'ArrowDown' && history.length) {
      e.preventDefault();
      cursor = Math.min(history.length, cursor + 1);
      input.value = history[cursor] ?? '';
    } else if (e.key === 'Tab') {
      // Completa o nome do comando.
      e.preventDefault();
      const names = [...Object.keys(commands), ...Object.keys(alias)];
      const match = names.filter((n) => n.startsWith(input.value.toLowerCase()));
      if (match.length === 1) input.value = match[0] + ' ';
      else if (match.length > 1) print(match.join('  '), 'l-dim');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  dialog.querySelector('[data-term-close]')!.addEventListener('click', () => dialog.close());
  dialog.querySelectorAll<HTMLButtonElement>('[data-term-chip]').forEach((b) =>
    b.addEventListener('click', () => {
      run(b.dataset.termChip!);
      input.focus();
    }),
  );
  // Clicar fora da janela fecha o terminal.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  let greeted = false;
  return {
    open() {
      if (!dialog.open) dialog.showModal();
      if (!greeted) {
        greeted = true;
        print(esc(t.welcome), 'l-dim');
        run('neofetch');
      }
      // No celular não abre o teclado sozinho: os atalhos embaixo já resolvem a maior parte.
      if (matchMedia('(pointer: fine)').matches) input.focus();
    },
  };
}
