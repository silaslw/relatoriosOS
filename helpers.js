// ======================== HELPERS DOM ========================
function sel(id) { return document.getElementById(id); }
function val(id) { const e = sel(id); return e ? e.value.trim().toUpperCase() : ''; }
function raw(id) { const e = sel(id); return e ? e.value.trim() : ''; }

function selectOpts(opts, placeholder) {
  return `<option value="">${placeholder}</option>` +
    opts.map(o => `<option value="${o}">${o}</option>`).join('');
}

function toast(msg, dur = 2500) {
  const t = sel('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// Header date
(function() {
  const d = new Date();

})();
