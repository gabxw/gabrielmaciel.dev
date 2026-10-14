// Botão de tema com dois estados: "seguir o sistema" e "o oposto do sistema".
// Voltar para o mesmo tema do sistema apaga a escolha salva.
const KEY = 'color-scheme';
const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')!;
const systemDark = matchMedia('(prefers-color-scheme: dark)');

function stored(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function currentScheme(): 'light' | 'dark' {
  const value = meta.content;
  if (value === 'light' || value === 'dark') return value;
  return systemDark.matches ? 'dark' : 'light';
}

function apply(value: string | null) {
  meta.content = value ?? 'light dark';
  window.dispatchEvent(new CustomEvent('schemechange', { detail: currentScheme() }));
}

document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = currentScheme() === 'dark' ? 'light' : 'dark';
    const system = systemDark.matches ? 'dark' : 'light';
    try {
      if (target === system) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, target);
    } catch {}
    apply(target === system ? null : target);
  });
});

// Outra aba mudou o tema.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) apply(e.newValue);
});

systemDark.addEventListener('change', () => {
  if (!stored()) apply(null);
});
