// theme.js - APENAS código JavaScript aqui dentro!
(function () {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
})();

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  let newTheme = currentTheme === 'light' ? 'dark' : 'light';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButtonIcon(newTheme);
}

function updateThemeButtonIcon(theme) {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  
  // O ícone permanece o mesmo independente do estado atual do tema
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M 12 3 A 9 9 0 0 0 12 21 Z" fill="currentColor" stroke="none"></path></svg>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  updateThemeButtonIcon(currentTheme);
});