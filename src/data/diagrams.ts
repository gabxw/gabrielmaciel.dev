import type { T } from '../i18n/ui';

export interface DiagramNode {
  id: string;
  /** Posição na grade larga (desktop). No celular a grade é transposta. */
  col: number;
  row: number;
  title: string;
  sub: T;
  /** Peça central da arquitetura, desenhada com o verde do site. */
  accent?: boolean;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: T;
}

export interface Diagram {
  summary: T;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export const diagrams: Record<'flowforge' | 'conta-aberta' | 'zapbebidas', Diagram> = {
  flowforge: {
    summary: {
      pt: 'O webhook chega na API, que grava a execução e a outbox na mesma transação do PostgreSQL. O Dispatcher do Worker publica a outbox no RabbitMQ, a Engine consome a fila, grava um checkpoint a cada etapa e chama o destino externo com retry seguro.',
      en: 'The webhook reaches the API, which writes the execution and the outbox in the same PostgreSQL transaction. The Worker dispatcher publishes the outbox to RabbitMQ, the engine consumes the queue, saves a checkpoint after each step and calls the external target with safe retries.',
    },
    nodes: [
      { id: 'in', col: 0, row: 0, title: 'Webhook', sub: { pt: 'o evento chega', en: 'the event arrives' } },
      { id: 'api', col: 1, row: 0, title: 'API', sub: { pt: 'ASP.NET Core', en: 'ASP.NET Core' } },
      { id: 'db', col: 2, row: 0, title: 'PostgreSQL', sub: { pt: 'fonte da verdade', en: 'source of truth' }, accent: true },
      { id: 'disp', col: 3, row: 0, title: 'Dispatcher', sub: { pt: 'publica a outbox', en: 'publishes the outbox' } },
      { id: 'mq', col: 3, row: 1, title: 'RabbitMQ', sub: { pt: 'só transporta', en: 'only transports' } },
      { id: 'eng', col: 2, row: 1, title: 'Engine', sub: { pt: 'executa as etapas', en: 'runs the steps' }, accent: true },
      { id: 'out', col: 1, row: 1, title: 'Destino', sub: { pt: 'HTTP externo', en: 'external HTTP' } },
    ],
    edges: [
      { from: 'in', to: 'api', label: { pt: '202', en: '202' } },
      { from: 'api', to: 'db', label: { pt: 'mesma transação', en: 'one transaction' } },
      { from: 'db', to: 'disp', label: { pt: 'lê a outbox', en: 'reads outbox' } },
      { from: 'disp', to: 'mq', label: { pt: 'confirmação', en: 'confirm' } },
      { from: 'mq', to: 'eng', label: { pt: 'consome', en: 'consumes' } },
      { from: 'eng', to: 'db', label: { pt: 'checkpoint', en: 'checkpoint' } },
      { from: 'eng', to: 'out', label: { pt: 'retry seguro', en: 'safe retry' } },
    ],
  },
  'conta-aberta': {
    summary: {
      pt: 'O app em Next.js manda a pergunta para a API em .NET. O modelo de IA interpreta a pergunta e chama a ferramenta simular_custos, que roda no motor de cálculo em C# com premissas da FIPE e de fontes públicas. Os dados do cliente ficam no PostgreSQL.',
      en: 'The Next.js app sends the question to the .NET API. The AI model interprets it and calls the simular_custos tool, which runs in the C# calculation engine using FIPE prices and public sources. Customer data lives in PostgreSQL.',
    },
    nodes: [
      { id: 'app', col: 0, row: 0, title: 'App', sub: { pt: 'Next.js', en: 'Next.js' } },
      { id: 'api', col: 1, row: 0, title: 'API', sub: { pt: '.NET 10', en: '.NET 10' } },
      { id: 'ia', col: 2, row: 0, title: 'Claude / OpenAI', sub: { pt: 'entende a pergunta', en: 'reads the question' } },
      { id: 'calc', col: 2, row: 1, title: 'Motor de cálculo', sub: { pt: 'regras em C#', en: 'rules in C#' }, accent: true },
      { id: 'fipe', col: 3, row: 1, title: 'FIPE', sub: { pt: 'e fontes públicas', en: 'and public sources' } },
      { id: 'db', col: 1, row: 1, title: 'PostgreSQL', sub: { pt: 'contrato e uso', en: 'contract and usage' } },
    ],
    edges: [
      { from: 'app', to: 'api', label: { pt: 'pergunta', en: 'question' } },
      { from: 'api', to: 'ia', label: { pt: 'tool use', en: 'tool use' } },
      { from: 'ia', to: 'calc', label: { pt: 'simular_custos', en: 'simular_custos' } },
      { from: 'fipe', to: 'calc', label: { pt: 'premissas', en: 'assumptions' } },
      { from: 'api', to: 'db', label: { pt: 'dados', en: 'data' } },
    ],
  },
  zapbebidas: {
    summary: {
      pt: 'O cliente monta o pedido no catálogo, que chama a API em Node. A API grava no PostgreSQL, com cada loja isolada, e enfileira o trabalho para os workers, que avisam o cliente pelo WhatsApp. O Mercado Pago confirma os pagamentos por webhook.',
      en: 'The customer builds the order in the catalog, which calls the Node API. The API writes to PostgreSQL, with every store isolated, and queues work for the workers, which notify the customer on WhatsApp. Mercado Pago confirms payments through a webhook.',
    },
    nodes: [
      { id: 'cli', col: 0, row: 0, title: 'Cliente', sub: { pt: 'catálogo no celular', en: 'catalog on the phone' } },
      { id: 'web', col: 1, row: 0, title: 'Catálogo e painel', sub: { pt: 'React', en: 'React' } },
      { id: 'api', col: 2, row: 0, title: 'API', sub: { pt: 'Node e TypeScript', en: 'Node and TypeScript' }, accent: true },
      { id: 'db', col: 3, row: 0, title: 'PostgreSQL', sub: { pt: 'cada loja isolada', en: 'every store isolated' } },
      { id: 'work', col: 2, row: 1, title: 'Workers', sub: { pt: 'fila com retry', en: 'queue with retries' } },
      { id: 'wa', col: 1, row: 1, title: 'WhatsApp', sub: { pt: 'Evolution API', en: 'Evolution API' } },
      { id: 'mp', col: 3, row: 1, title: 'Mercado Pago', sub: { pt: 'planos', en: 'plans' } },
    ],
    edges: [
      { from: 'cli', to: 'web', label: { pt: 'pedido', en: 'order' } },
      { from: 'web', to: 'api' },
      { from: 'api', to: 'db' },
      { from: 'api', to: 'work', label: { pt: 'enfileira', en: 'enqueues' } },
      { from: 'work', to: 'wa', label: { pt: 'status', en: 'status' } },
      { from: 'mp', to: 'api', label: { pt: 'webhook', en: 'webhook' } },
    ],
  },
};
