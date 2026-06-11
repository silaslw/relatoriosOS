// ======================== INFO BAR ========================
function updateActionInfo() {
  const tecCount = document.querySelectorAll('.tec-block').length;
  const osCount = document.querySelectorAll('.os-block').length;
  sel('action-info').textContent = `${tecCount} técnico(s) · ${osCount} OS cadastrada(s)`;
}
