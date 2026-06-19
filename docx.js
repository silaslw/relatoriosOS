// ======================== GERAÇÃO DOCX ========================
// Globals preenchidos no primeiro uso
var Document, Packer, Paragraph, TextRun, AlignmentType;

// Label constante para o botão — evita duplicar o SVG inline em dois lugares
const _BTN_LABEL = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Gerar relatórios`;

async function gerarDocumentos() {
  const dados = lerDados();
  if (!dados.tecnicos.length) { toast('Adicione ao menos um técnico.'); return; }

  // Valida antes de gerar — mostra o primeiro erro encontrado
  const errosValidacao = _validarDados(dados);
  if (errosValidacao.length) { toast(errosValidacao[0], 4500); return; }

  const btn = sel('btn-gerar');
  btn.disabled    = true;
  btn.textContent = 'Gerando...';

  try {
    ({ Document, Packer, Paragraph, TextRun, AlignmentType } = docx);
    await gerarDocEquipamentos(dados);

    const totalVerif = dados.tecnicos.reduce(
      (acc, t) => acc + t.osList.filter(o => o.paraVerif).length, 0
    );

    if (totalVerif > 0) {
      await new Promise(r => setTimeout(r, 800));
      await gerarDocVerificacao(dados);
      toast('✓ 2 arquivos gerados: Equipamentos + Verificação de OS!', 3500);
    } else {
      toast('✓ Equipamentos Instalados gerado! (Nenhuma OS para verificação.)', 3500);
    }

    salvarNoHistorico(dados); // ← grava no histórico de métricas (era o bug principal)

  } catch (e) {
    toast('Erro ao gerar: ' + e.message, 4000);
    console.error(e);
  } finally {
    // finally garante que o botão seja reativado mesmo em caso de erro
    btn.disabled  = false;
    btn.innerHTML = _BTN_LABEL;
  }
}

// Validação prévia — retorna array de mensagens; vazio = OK
function _validarDados(dados) {
  const msgs = [];

  if (!dados.dataRef || dados.dataRef === '__.__') {
    msgs.push('Preencha a data de referência antes de gerar.');
  }

  dados.tecnicos.forEach((tec, i) => {
    const nomeTec = tec.nome || `Técnico ${i + 1}`;
    if (!tec.nome)         msgs.push(`${nomeTec}: selecione um colaborador.`);
    if (!tec.osList.length) msgs.push(`${nomeTec}: adicione ao menos uma OS.`);
    tec.osList.forEach((os, j) => {
      if (!os.numOS) msgs.push(`${nomeTec} — OS ${j + 1}: informe o número da OS.`);
    });
  });

  return msgs;
}

// ---- Helpers DOCX ----

function paraCenter(runs) {
  return new Paragraph({ alignment: AlignmentType.CENTER, children: runs });
}

function paraLeft(runs, spacing) {
  const opts = { children: runs };
  if (spacing) opts.spacing = spacing;
  return new Paragraph(opts);
}

function paraIndented(runs) {
  return new Paragraph({ indent: { left: 720 }, children: runs });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun({ text: '', font: 'Calibri', size: 28 })] });
}

function runBold(text, size = 28) {
  return new TextRun({ text, bold: true,   size, font: 'Calibri' });
}

function runNormal(text, size = 28) {
  return new TextRun({ text, bold: false,  size, font: 'Calibri' });
}

function runItalic(text, size = 28) {
  return new TextRun({ text, italics: true, size, font: 'Calibri' });
}

// ======================== DOC 1: EQUIPAMENTOS INSTALADOS ========================
async function gerarDocEquipamentos(dados) {
  const children = [];

  children.push(paraCenter([runBold('EQUIPAMENTOS INSTALADOS', 32)]));
  children.push(paraCenter([runNormal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  children.push(emptyLine());

  dados.tecnicos.forEach(tec => {
    children.push(paraLeft([runBold(tec.nome)]));

    tec.osList.forEach(os => {
      children.push(emptyLine());
      children.push(paraLeft([
        runBold(os.numOS),
        runNormal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      os.equips.forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        children.push(paraIndented([runNormal(txt)]));
      });

      if (os.obs) children.push(paraIndented([runItalic(os.obs)]));
    });

    children.push(emptyLine());
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  // Usa downloadBlob() de core.js — a função download() local foi removida (era duplicata)
  downloadBlob(blob, 'EQUIPAMENTOS INSTALADOS REF.' + dados.dataRef.replace('.', '_') + '.docx');
}

// ======================== DOC 2: VERIFICAÇÃO DE OS ========================
async function gerarDocVerificacao(dados) {
  const children = [];

  children.push(paraCenter([runBold('VERIFICAÇÃO DE ORDENS DE SERVICOS', 32)]));
  children.push(paraCenter([runNormal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  children.push(emptyLine());

  dados.tecnicos.forEach(tec => {
    const osVerif = tec.osList.filter(os => os.paraVerif);
    if (!osVerif.length) return;

    children.push(paraLeft([runBold(tec.nome)]));

    osVerif.forEach(os => {
      children.push(emptyLine());
      children.push(paraLeft([
        runBold(os.numOS),
        runNormal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      os.erros.forEach(err  => children.push(paraIndented([runNormal(err)])));

      os.equips.forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        children.push(paraIndented([runNormal(txt)]));
      });

      if (os.obs) children.push(paraIndented([runItalic(os.obs)]));
    });

    children.push(emptyLine());
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'VERIFICAÇÃO ORDENS DE SERVIÇO REF.' + dados.dataRef.replace('.', '_') + '.docx');
}