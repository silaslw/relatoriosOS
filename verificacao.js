// ======================== VERIFICAÇÃO ========================
function toggleVerif(oid) {
  const chk = sel('verif-chk-' + oid);
  const reason = sel('verif-reason-' + oid);
  const badge = sel('verif-badge-' + oid);
  reason.classList.toggle('show', chk.checked);
  badge.style.display = chk.checked ? '' : 'none';
}
