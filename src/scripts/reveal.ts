// Animações de rolagem. Só rodam quando o visitante não pediu movimento reduzido.
declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

const root = document.documentElement;

async function init() {
  if (!root.classList.contains('js-motion')) return;

  const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
    import('gsap/SplitText'),
  ]);
  gsap.registerPlugin(ScrollTrigger, SplitText);
  window.__motionReady = true;

  // Títulos sobem linha por linha, saindo de trás de uma máscara.
  document.querySelectorAll<HTMLElement>('[data-reveal="title"]').forEach((el) => {
    gsap.set(el, { opacity: 1 });
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      },
    );
  });

  // Imagens se abrem de baixo para cima.
  document.querySelectorAll<HTMLElement>('[data-reveal="clip"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 1, clipPath: 'inset(100% 0% 0% 0% round 14px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 14px)',
        duration: 1.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      },
    );
  });

  // Linha da trajetória acompanha a rolagem.
  document.querySelectorAll<HTMLElement>('[data-timeline-progress]').forEach((line) => {
    gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: line.parentElement,
          start: 'top 70%',
          end: 'bottom 60%',
          scrub: 0.4,
        },
      },
    );
  });

  // Itens de lista entram em sequência quando a lista aparece.
  document.querySelectorAll<HTMLElement>('[data-reveal="stagger"]').forEach((list) => {
    gsap.set(list, { opacity: 1 });
    gsap.from(list.children, {
      opacity: 0,
      y: 20,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.07,
      scrollTrigger: { trigger: list, start: 'top 88%', once: true },
    });
  });
}

init().catch(() => root.classList.remove('js-motion'));

export {};
