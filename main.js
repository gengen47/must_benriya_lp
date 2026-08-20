document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.hero')) {
    import('./inquiry.js?v=5').then(module => module.initInquiry()).catch(error => console.error('Inquiry module failed.', error));
  }

  const menu = document.querySelector('.menu');
  const nav = document.querySelector('nav');

  if (menu && nav) {
    menu.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(isOpen));
      menu.textContent = isOpen ? '閉じる' : 'メニュー';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menu.setAttribute('aria-expanded', 'false');
      menu.textContent = 'メニュー';
    }));
  }

  const filters = document.querySelectorAll('[data-filter]');
  const works = document.querySelectorAll('[data-cat]');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    works.forEach(work => {
      work.hidden = button.dataset.filter !== 'all' && work.dataset.cat !== button.dataset.filter;
    });
  }));

  const animated = document.querySelectorAll('.section-head,.services .service-row,.card,.reasons article,.flow li,.case-detail');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animated.forEach(item => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children];
      const order = Math.max(0, siblings.indexOf(entry.target));
      entry.target.style.transitionDelay = `${Math.min(order * 55, 220)}ms`;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px' });

  animated.forEach(item => observer.observe(item));
});
