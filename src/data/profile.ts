import type { T } from '../i18n/ui';

export interface Role {
  title: T;
  kind: T;
  start: string;
  /** Sem data de fim: cargo atual. */
  end?: string;
  items: T[];
  stack?: string[];
}

export interface Job {
  company: string;
  place: T;
  roles: Role[];
}

export const jobs: Job[] = [
  {
    company: 'Grupo Roma Brasil',
    place: { pt: 'Belo Horizonte, presencial', en: 'Belo Horizonte, on site' },
    roles: [
      {
        title: { pt: 'Desenvolvedor full stack', en: 'Full stack developer' },
        kind: { pt: 'Tempo integral', en: 'Full time' },
        start: '2026-06',
        items: [
          {
            pt: 'Desenvolvo o hub interno da empresa, em Laravel e SQL Server, usado por financeiro, contabilidade, logística, comercial, pós-vendas e TI. São mais de 160 commits meus no sistema.',
            en: "I develop the company's internal hub, in Laravel and SQL Server, used by finance, accounting, logistics, sales, after-sales and IT. I have made more than 160 commits to it.",
          },
          {
            pt: 'Criei o fechamento contábil configurável: tarefas por unidade e responsável, prazos, justificativa de atraso, anexos, histórico e avisos automáticos de prazo.',
            en: 'I built the configurable accounting close: tasks per branch and owner, deadlines, delay justifications, attachments, history and automatic deadline warnings.',
          },
          {
            pt: 'Construí a Conta Movimento do financeiro, com conciliação, filtros por situação e exportação para Excel por grupo, além do módulo de logística, do inventário rotativo do pós-vendas e da nota de débito em PDF.',
            en: "I built finance's account statement module, with reconciliation, status filters and Excel export by group, plus the logistics module, after-sales cycle counting and debit notes in PDF.",
          },
          {
            pt: 'Levei IA para o dia a dia da empresa: um assistente com a API da Anthropic que explica as diferenças entre a margem do Power BI e o gerencial contábil, e uma API em Node que consulta o ERP em modo somente leitura, com function calling, autenticação por chave e rate limit.',
            en: "I brought AI into the company's routine: an assistant built on the Anthropic API that explains the gaps between the Power BI margin and the management accounts, and a Node API that queries the ERP read-only, with function calling, key authentication and rate limiting.",
          },
          {
            pt: 'Fiz a API que mostra no hub o estado das automações em Python (agendada, rodando, concluída ou com falha) sem expor scripts, caminhos nem arquivos.',
            en: 'I built the API that shows the status of the Python automations in the hub (scheduled, running, done or failed) without exposing scripts, paths or files.',
          },
        ],
        stack: ['Laravel', 'PHP', 'SQL Server', 'Python', 'Node.js', 'Anthropic API', 'OpenAI'],
      },
      {
        title: { pt: 'Assistente de desenvolvimento', en: 'Development assistant' },
        kind: { pt: 'Estágio', en: 'Internship' },
        start: '2025-08',
        end: '2026-06',
        items: [
          {
            pt: 'Modernização de sistemas internos em Laravel: contatos corporativos, publicações internas com curtidas e comentários e painel para RH e Marketing.',
            en: 'Modernized internal Laravel systems: company directory, internal posts with likes and comments, and a dashboard for HR and Marketing.',
          },
          {
            pt: 'Automações em Python com Playwright para o faturamento, tirando rotinas manuais que levavam dias.',
            en: 'Python and Playwright automations for billing, removing manual routines that took days.',
          },
        ],
        stack: ['Laravel', 'PHP', 'Python', 'Playwright', 'PostgreSQL'],
      },
    ],
  },
  {
    company: 'SPM Infor',
    place: { pt: 'Belo Horizonte', en: 'Belo Horizonte' },
    roles: [
      {
        title: { pt: 'Assistente de suporte de TI', en: 'IT support assistant' },
        kind: { pt: 'Estágio', en: 'Internship' },
        start: '2024-10',
        end: '2025-04',
        items: [
          {
            pt: 'Suporte técnico, manutenção de computadores, apoio em redes e acompanhamento de ambientes monitorados pelo Zabbix.',
            en: 'Technical support, hardware maintenance, networking help and watching monitored environments in Zabbix.',
          },
        ],
      },
    ],
  },
  {
    company: 'Universo Elétrico',
    place: { pt: 'Belo Horizonte', en: 'Belo Horizonte' },
    roles: [
      {
        title: { pt: 'Assistente de vendas', en: 'Sales assistant' },
        kind: { pt: 'Jovem aprendiz', en: 'Apprentice' },
        start: '2023-08',
        end: '2024-10',
        items: [
          {
            pt: 'Atendimento ao cliente, apoio à equipe de vendas e controle de dados e relatórios no Excel.',
            en: 'Customer service, support for the sales team, and data tracking and reports in Excel.',
          },
        ],
      },
    ],
  },
];

export interface Study {
  school: string;
  course: T;
  start: string;
  end?: string;
}

export const studies: Study[] = [
  { school: 'UFBRA', course: { pt: 'Bacharelado em Engenharia de Software', en: "Bachelor's in Software Engineering" }, start: '2025-02' },
  { school: 'SENAI CTTI', course: { pt: 'Técnico em Desenvolvimento de Sistemas', en: 'Technical degree in Systems Development' }, start: '2024-02', end: '2025-08' },
];

export interface Tool {
  name: string;
  group: 'backend' | 'data' | 'front' | 'infra';
}

export const tools: Tool[] = [
  { name: 'C#', group: 'backend' },
  { name: '.NET', group: 'backend' },
  { name: 'Laravel', group: 'backend' },
  { name: 'PHP', group: 'backend' },
  { name: 'Python', group: 'backend' },
  { name: 'Node.js', group: 'backend' },
  { name: 'PostgreSQL', group: 'data' },
  { name: 'SQL Server', group: 'data' },
  { name: 'RabbitMQ', group: 'data' },
  { name: 'React', group: 'front' },
  { name: 'TypeScript', group: 'front' },
  { name: 'Tailwind', group: 'front' },
  { name: 'Docker', group: 'infra' },
  { name: 'Linux', group: 'infra' },
  { name: 'Git', group: 'infra' },
  { name: 'Playwright', group: 'infra' },
  { name: 'OpenTelemetry', group: 'infra' },
];

export const toolGroups: Record<Tool['group'], T> = {
  backend: { pt: 'Backend', en: 'Backend' },
  data: { pt: 'Dados e mensageria', en: 'Data and messaging' },
  front: { pt: 'Front-end', en: 'Front end' },
  infra: { pt: 'Infra e qualidade', en: 'Infra and quality' },
};
