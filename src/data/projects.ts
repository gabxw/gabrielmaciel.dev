import type { ImageMetadata } from 'astro';
import type { T } from '../i18n/ui';

import ffEditor from '../assets/projects/flowforge-editor.png';
import ffExecution from '../assets/projects/flowforge-execution.png';
import ffFailure from '../assets/projects/flowforge-execution-failure.png';
import caInicio from '../assets/projects/contaaberta-inicio.png';
import caConta from '../assets/projects/contaaberta-conta-aberta.png';
import caVale from '../assets/projects/contaaberta-vale-a-pena.png';
import caRetro from '../assets/projects/contaaberta-retrospectiva.png';
import zbHome from '../assets/projects/zapbebidas-home.png';
import acHome from '../assets/projects/agendecorte-home.png';

export type ProjectKind = 'backend' | 'fullstack';

export interface Shot {
  image: ImageMetadata;
  alt: T;
  /** Telas de celular ficam lado a lado, em coluna estreita. */
  phone?: boolean;
}

export interface Section {
  title: T;
  paragraphs?: T[];
  items?: T[];
}

export interface Project {
  slug: string;
  name: string;
  /** Mês de início, no formato AAAA-MM. */
  start: string;
  kind: ProjectKind;
  /** Produto no ar com cliente usando. */
  live: boolean;
  summary: T;
  context: T;
  stack: string[];
  links: { repo?: string; site?: string };
  /** GIF servido de /public, usado no lugar da imagem de capa. */
  motion?: { src: string; alt: T };
  cover?: Shot;
  gallery: Shot[];
  sections: Section[];
  featured: boolean;
}

export const kindLabel: Record<ProjectKind, T> = {
  backend: { pt: 'Backend', en: 'Backend' },
  fullstack: { pt: 'Full stack', en: 'Full stack' },
};

export const projects: Project[] = [
  {
    slug: 'flowforge',
    name: 'FlowForge',
    start: '2026-10',
    kind: 'backend',
    live: false,
    featured: true,
    summary: {
      pt: 'Motor de automação por workflows em .NET, no estilo do n8n, feito para continuar correto quando alguma coisa falha no meio do caminho.',
      en: 'A workflow automation engine in .NET, in the spirit of n8n, built to stay correct when something fails halfway through.',
    },
    context: { pt: 'Projeto pessoal', en: 'Personal project' },
    stack: ['.NET 10', 'C#', 'PostgreSQL', 'RabbitMQ', 'React', 'React Flow', 'OpenTelemetry', 'GitHub Actions'],
    links: { repo: 'https://github.com/gabxw/flowforge' },
    motion: {
      src: '/media/flowforge-percurso.gif',
      alt: {
        pt: 'Workflow publicado no FlowForge, um evento chegando por webhook e o caminho que a execução percorre no grafo.',
        en: 'A published FlowForge workflow, an event arriving by webhook and the path the execution takes through the graph.',
      },
    },
    gallery: [
      {
        image: ffEditor,
        alt: { pt: 'Editor visual do FlowForge com as etapas do workflow em grafo.', en: 'FlowForge visual editor with the workflow steps as a graph.' },
      },
      {
        image: ffExecution,
        alt: { pt: 'Tela de execução concluída, com o tempo de cada etapa.', en: 'A completed execution, with the time spent on each step.' },
      },
      {
        image: ffFailure,
        alt: { pt: 'Execução com falha, mostrando a etapa que falhou e as tentativas.', en: 'A failed execution, showing the step that failed and its attempts.' },
      },
    ],
    sections: [
      {
        title: { pt: 'Por que eu fiz', en: 'Why I built it' },
        paragraphs: [
          {
            pt: 'No trabalho eu vivo cercado de automações: rotinas agendadas, integrações, títulos gerados a partir de outro sistema. Quase todo problema que aparece não é "a API não funciona", é "a API funcionou, mas alguma coisa caiu logo depois". Eu queria entender esse tipo de falha de verdade, e não só tratar com um try/catch.',
            en: "At work I'm surrounded by automations: scheduled jobs, integrations, records generated from another system. Almost every problem is not \"the API doesn't work\", it's \"the API worked, but something went down right after\". I wanted to understand that kind of failure properly, not just wrap it in a try/catch.",
          },
          {
            pt: 'O FlowForge é a resposta que eu montei: você desenha um grafo, publica uma versão, e cada evento que chega por webhook vira uma execução independente, processada por um Worker com checkpoints, retry e recuperação depois de uma queda.',
            en: 'FlowForge is the answer I put together: you draw a graph, publish a version, and every event that arrives by webhook becomes an independent execution, processed by a Worker with checkpoints, retries and recovery after a crash.',
          },
        ],
      },
      {
        title: { pt: 'Como funciona por dentro', en: 'How it works inside' },
        paragraphs: [
          {
            pt: 'É um monólito modular com dois processos. A API recebe comandos e eventos e grava a execução e a mensagem de saída (outbox) na mesma transação do PostgreSQL. O Worker publica essa outbox no RabbitMQ, consome a fila e executa as etapas, gravando um checkpoint a cada passo. O PostgreSQL é a autoridade do estado; o RabbitMQ só transporta.',
            en: 'It is a modular monolith with two processes. The API accepts commands and events and writes the execution and its outgoing message (outbox) in the same PostgreSQL transaction. The Worker publishes that outbox to RabbitMQ, consumes the queue and runs the steps, saving a checkpoint after each one. PostgreSQL is the source of truth; RabbitMQ only carries messages.',
          },
        ],
      },
      {
        title: { pt: 'O que acontece quando algo dá errado', en: 'What happens when something goes wrong' },
        items: [
          {
            pt: 'O RabbitMQ está fora do ar quando o webhook chega: a API responde 202 mesmo assim, e o Worker publica quando o broker volta.',
            en: 'RabbitMQ is down when the webhook arrives: the API still answers 202, and the Worker publishes once the broker is back.',
          },
          {
            pt: 'O mesmo evento chega duas vezes ao mesmo tempo: a mesma Idempotency-Key devolve a mesma execução; corpo diferente com a mesma chave recebe 409.',
            en: 'The same event arrives twice at the same time: the same Idempotency-Key returns the same execution; a different body with the same key gets a 409.',
          },
          {
            pt: 'Um Worker trava e outro assume: um token de geração (fencing) impede o antigo de gravar por cima depois de perder a posse.',
            en: 'A Worker hangs and another takes over: a generation token (fencing) stops the old one from writing after it lost ownership.',
          },
          {
            pt: 'O Worker cai depois de enviar um POST: o POST não é reenviado. A tentativa fica marcada com resultado externo desconhecido, em vez de fingir que nada aconteceu.',
            en: "The Worker crashes right after sending a POST: the POST is not sent again. The attempt is marked as having an unknown external result instead of pretending nothing happened.",
          },
          {
            pt: 'Um Delay de horas está em andamento: a espera é estado no banco, não uma thread parada, e continua depois de um restart.',
            en: 'An hours-long Delay is running: the wait is state in the database, not a sleeping thread, and it survives a restart.',
          },
        ],
        paragraphs: [
          {
            pt: 'Cada um desses casos tem teste de integração rodando com PostgreSQL e RabbitMQ de verdade.',
            en: 'Each of these cases has an integration test running against real PostgreSQL and RabbitMQ.',
          },
        ],
      },
      {
        title: { pt: 'O que ele não promete', en: 'What it does not promise' },
        paragraphs: [
          {
            pt: 'Não existe exactly-once em sistema externo, e eu preferi deixar isso claro. O FlowForge garante at-least-once com deduplicação local e mostra quando o efeito remoto é desconhecido. Retry só acontece no que é seguro repetir: métodos idempotentes ou destinos que aceitam Idempotency-Key.',
            en: "Exactly-once doesn't exist across external systems, and I chose to say so. FlowForge guarantees at-least-once with local deduplication and shows when the remote effect is unknown. Retries only happen where repeating is safe: idempotent methods or targets that accept an Idempotency-Key.",
          },
        ],
      },
      {
        title: { pt: 'Onde a IA entrou', en: 'Where AI came in' },
        paragraphs: [
          {
            pt: 'Usei IA no processo, e ela me fez andar rápido. Mas foi revisando o que ela escrevia que eu mais aprendi: alguns dos casos acima eu só descobri porque uma revisão encontrou uma execução que ficava presa por horas.',
            en: 'I used AI along the way, and it let me move fast. But reviewing what it wrote is where I learned the most: some of the cases above only exist because a review found an execution that could get stuck for hours.',
          },
        ],
      },
    ],
  },
  {
    slug: 'conta-aberta',
    name: 'Conta Aberta',
    start: '2026-10',
    kind: 'fullstack',
    live: false,
    featured: true,
    summary: {
      pt: 'App de carro por assinatura que mostra ao cliente o que a mensalidade cobre. Nasceu no hackathon Ruptura 2026 e continuei depois do evento até virar um app completo.',
      en: 'A car subscription app that shows customers what their monthly fee covers. It started at the Ruptura 2026 hackathon and I kept building it afterwards.',
    },
    context: { pt: 'Hackathon Ruptura 2026', en: 'Ruptura 2026 hackathon' },
    stack: ['.NET 10', 'ASP.NET Core', 'PostgreSQL', 'EF Core', 'Next.js', 'TypeScript', 'Claude', 'OpenAI'],
    links: { repo: 'https://github.com/gabxw/conta-aberta' },
    cover: {
      image: caInicio,
      phone: true,
      alt: { pt: 'Tela inicial do Conta Aberta com o valor que a assinatura já cobriu no mês.', en: 'Conta Aberta home screen with how much the subscription has covered this month.' },
    },
    gallery: [
      { image: caConta, phone: true, alt: { pt: 'A conta do mês: o que foi feito, o que é contrato e o que é estimativa.', en: "The month's statement: what was done, what is contract and what is an estimate." } },
      { image: caVale, phone: true, alt: { pt: 'Comparação entre assinar e comprar, com premissas editáveis.', en: 'Subscribing versus buying, with editable assumptions.' } },
      { image: caRetro, phone: true, alt: { pt: 'Retrospectiva do ciclo para compartilhar.', en: 'A shareable recap of the subscription cycle.' } },
    ],
    sections: [
      {
        title: { pt: 'O desafio', en: 'The challenge' },
        paragraphs: [
          {
            pt: 'Passei quatro dias no Ruptura 2026, dentro do Localiza Labs, num desafio sobre o app da assinatura: fazer o cliente abrir o app no dia a dia, e não só quando tem um problema. Na primeira mentoria me perguntaram qual era a dor, e eu não soube responder. Voltamos do zero e fomos atrás de dado.',
            en: "I spent four days at Ruptura 2026, inside Localiza Labs, on a challenge about the subscription app: get customers to open it in their daily routine, not only when something is wrong. In the first mentoring session I was asked what the pain was, and I couldn't answer. We started over and went looking for data.",
          },
          {
            pt: 'O próprio material do case dava a pista: o app tinha NPS 84, mas a assinatura ficava perto de 45; 36% de quem abria o app usava menos de duas vezes por mês, e só 48% renovavam. Minha leitura foi que o cliente paga a mensalidade e não enxerga o que ela cobre.',
            en: 'The case material gave the hint: the app had an NPS of 84, but the subscription was around 45; 36% of users opened the app fewer than twice a month, and only 48% renewed. My read was that customers pay the fee and never see what it covers.',
          },
        ],
      },
      {
        title: { pt: 'O que o app faz', en: 'What the app does' },
        items: [
          { pt: 'Todo dia: quanto a assinatura já cobriu no mês e o benefício do clube que serve para onde o cliente está.', en: 'Every day: how much the subscription has covered this month and the club perk that fits where the customer is.' },
          { pt: 'Todo mês: a conta aberta, separando o que foi feito, o que é contrato e o que é estimativa.', en: 'Every month: the open statement, separating what was done, what is contract and what is an estimate.' },
          { pt: 'Quando quiser: "vale a pena?", comparando com comprar à vista ou financiado, com premissas da FIPE e de fontes públicas.', en: 'Any time: "is it worth it?", comparing against buying outright or financing, using FIPE prices and public sources.' },
          { pt: 'No fim do ciclo: uma retrospectiva para compartilhar.', en: 'At the end of the cycle: a recap to share.' },
        ],
      },
      {
        title: { pt: 'O número vem da regra, a explicação vem do modelo', en: 'The number comes from the rules, the explanation from the model' },
        paragraphs: [
          {
            pt: 'O assistente usa tool use: o modelo nunca escreve um valor que não tenha saído do motor de cálculo em C#. Ele interpreta a pergunta ("e se eu desse 40% de entrada?"), chama a ferramenta e explica o resultado. Ações como renovar ou trocar de carro ficam no app, sempre com confirmação. Sem chave de API, o app usa perguntas guiadas que chamam o mesmo motor.',
            en: 'The assistant uses tool use: the model never writes a figure that did not come out of the C# calculation engine. It interprets the question ("what if I paid 40% upfront?"), calls the tool and explains the result. Actions like renewing or switching cars stay in the app, always with confirmation. Without an API key, the app falls back to guided questions that call the same engine.',
          },
        ],
      },
    ],
  },
  {
    slug: 'zapbebidas',
    name: 'ZapBebidas',
    start: '2025-10',
    kind: 'fullstack',
    live: true,
    featured: true,
    summary: {
      pt: 'SaaS de cardápio digital e pedidos pelo WhatsApp para distribuidoras de bebidas, com mensalidade fixa e sem comissão por pedido.',
      en: 'A SaaS for beverage distributors: digital catalog and WhatsApp ordering, with a flat monthly fee and no per-order commission.',
    },
    context: { pt: 'Produto próprio, no ar', en: 'My own product, live' },
    stack: ['React', 'TypeScript', 'PostgreSQL', 'Realtime', 'Evolution API', 'Mercado Pago', 'VPS'],
    links: { site: 'https://zapbebidas.com' },
    cover: {
      image: zbHome,
      alt: { pt: 'Página inicial do ZapBebidas.', en: 'ZapBebidas landing page.' },
    },
    gallery: [],
    sections: [
      {
        title: { pt: 'O problema', en: 'The problem' },
        paragraphs: [
          {
            pt: 'Distribuidora pequena vende pelo WhatsApp, e o pedido chega bagunçado: áudio, foto, mensagem picada. Os marketplaces organizam isso, mas cobram de 12% a 30% de cada venda. Eu quis dar à loja um canal próprio, com o link dela, pagando um valor fixo.',
            en: 'Small distributors sell over WhatsApp, and orders arrive as a mess of voice notes, photos and scattered messages. Marketplaces organize that, but take 12% to 30% of each sale. I wanted to give stores their own channel, on their own link, for a flat fee.',
          },
        ],
      },
      {
        title: { pt: 'O que eu construí', en: 'What I built' },
        items: [
          { pt: 'Plataforma multi-loja do zero, com banco compartilhado e cada loja isolada das outras.', en: 'A multi-store platform from scratch, with a shared database and every store isolated from the others.' },
          { pt: 'Integração com o WhatsApp via Evolution API: conexão por QR Code, aviso automático de status e central de conversas no painel.', en: 'WhatsApp integration through Evolution API: QR code pairing, automatic status messages and a conversations inbox in the dashboard.' },
          { pt: 'Kanban de pedidos atualizado em tempo real e mensagens automáticas configuráveis por status.', en: 'A real-time order kanban and automatic messages configurable per status.' },
          { pt: 'Planos mensais com pagamento pelo Mercado Pago, já com cliente pagante na fase piloto.', en: 'Monthly plans paid through Mercado Pago, already with a paying customer in the pilot.' },
        ],
      },
      {
        title: { pt: 'O que eu aprendi', en: 'What I learned' },
        paragraphs: [
          {
            pt: 'Mandar mensagem direto do front quebra na primeira instabilidade da API do WhatsApp, então os envios passam por uma fila com retry. E a parte mais difícil não foi código: foi pensar em cliente, operação e dinheiro entrando, e não só na feature bonita.',
            en: "Sending messages straight from the frontend breaks the first time the WhatsApp API hiccups, so messages go through a queue with retries. And the hardest part wasn't code: it was thinking about customers, operations and revenue, not just the nice feature.",
          },
        ],
      },
    ],
  },
  {
    slug: 'agendecorte',
    name: 'AgendeCorte',
    start: '2026-01',
    kind: 'fullstack',
    live: true,
    featured: false,
    summary: {
      pt: 'SaaS de agendamento online para barbearias, com agenda, equipe, financeiro e avisos pelo WhatsApp.',
      en: 'An online booking SaaS for barbershops, with schedule, staff, finances and WhatsApp reminders.',
    },
    context: { pt: 'Produto próprio, no ar', en: 'My own product, live' },
    stack: ['React', 'TypeScript', 'PostgreSQL', 'Supabase', 'Tailwind CSS', 'Evolution API', 'Vercel'],
    links: { site: 'https://agendecorte.com' },
    cover: {
      image: acHome,
      alt: { pt: 'Página inicial do AgendeCorte com o painel da barbearia.', en: 'AgendeCorte landing page with the barbershop dashboard.' },
    },
    gallery: [],
    sections: [
      {
        title: { pt: 'O que é', en: 'What it is' },
        paragraphs: [
          {
            pt: 'Uma página de agendamento pronta para cada barbearia e um painel para o dono acompanhar agenda, equipe e recebimentos. O cliente marca o horário sozinho e recebe a confirmação pelo WhatsApp.',
            en: 'A ready-made booking page for each barbershop and a dashboard where the owner follows the schedule, staff and payments. Customers book on their own and get the confirmation on WhatsApp.',
          },
        ],
      },
      {
        title: { pt: 'Como eu fiz', en: 'How I built it' },
        items: [
          { pt: 'Reaproveitei o que aprendi no ZapBebidas: multi-loja, isolamento entre clientes e integração com o WhatsApp.', en: 'I reused what I learned on ZapBebidas: multi-store, isolation between customers and the WhatsApp integration.' },
          { pt: 'Agenda online com gestão de horários e painel responsivo, pensado para ser usado no celular entre um corte e outro.', en: 'Online scheduling with time-slot management and a responsive dashboard, meant to be used on a phone between haircuts.' },
        ],
      },
    ],
  },
  {
    slug: 'gasfacil',
    name: 'GásFácil',
    start: '2026-04',
    kind: 'fullstack',
    live: false,
    featured: false,
    summary: {
      pt: 'Sistema para distribuidoras de gás: landing page, painel operacional e um bot de WhatsApp que recebe pedidos.',
      en: 'A system for gas distributors: landing page, operations dashboard and a WhatsApp bot that takes orders.',
    },
    context: { pt: 'Projeto pessoal', en: 'Personal project' },
    stack: ['Next.js', 'Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'WhatsApp'],
    links: { repo: 'https://github.com/gabxw/gasfacil' },
    gallery: [],
    sections: [
      {
        title: { pt: 'O que tem', en: "What's in it" },
        items: [
          { pt: 'Monorepo com duas aplicações: a web em Next.js (landing page e painel) e o backend em Express com o bot de WhatsApp e as APIs do painel.', en: 'A monorepo with two apps: the Next.js web app (landing page and dashboard) and the Express backend with the WhatsApp bot and dashboard APIs.' },
          { pt: 'Catálogo de botijões, bairros de entrega, pedidos e estoque.', en: 'Cylinder catalog, delivery areas, orders and stock.' },
          { pt: 'No primeiro boot o backend cria revendedor, catálogo, bairros e usuário administrador, para o sistema já subir utilizável.', en: 'On first boot the backend seeds the reseller, catalog, delivery areas and an admin user, so the system starts out usable.' },
        ],
      },
    ],
  },
  {
    slug: 'vertice-hub',
    name: 'VÉRTICE Hub',
    start: '2025-12',
    kind: 'fullstack',
    live: false,
    featured: false,
    summary: {
      pt: 'E-commerce completo, do catálogo ao checkout, com pagamento pelo Mercado Pago e PayPal e painel administrativo.',
      en: 'A complete e-commerce, from catalog to checkout, with Mercado Pago and PayPal payments and an admin dashboard.',
    },
    context: { pt: 'Projeto pessoal', en: 'Personal project' },
    stack: ['React', 'Vite', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'Mercado Pago', 'PayPal'],
    links: { repo: 'https://github.com/gabxw/vertice-hub' },
    gallery: [],
    sections: [
      {
        title: { pt: 'O que tem', en: "What's in it" },
        items: [
          { pt: 'Monorepo com a loja em React e Vite e a API em Node, Express e Prisma.', en: 'A monorepo with the React and Vite storefront and the Node, Express and Prisma API.' },
          { pt: 'Autenticação, catálogo, carrinho, checkout, pedidos e painel administrativo.', en: 'Authentication, catalog, cart, checkout, orders and an admin dashboard.' },
          { pt: 'Duas formas de pagamento integradas: Mercado Pago e PayPal.', en: 'Two payment providers integrated: Mercado Pago and PayPal.' },
        ],
      },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
