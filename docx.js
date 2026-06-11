// ======================== GERAÇÃO DOCX ========================
// Globals preenchidos no primeiro uso
var Document, Packer, Paragraph, TextRun, AlignmentType;

async function gerarDocumentos() {
  const dados = lerDados();
  if (!dados.tecnicos.length) { toast('Adicione ao menos um técnico.'); return; }

  const btn = sel('btn-gerar');
  btn.disabled = true;
  btn.textContent = 'Gerando...';

  try {
    ({ Document, Packer, Paragraph, TextRun, AlignmentType } = docx);
    await gerarDocEquipamentos(dados);
    const totalVerif = dados.tecnicos.reduce((acc, t) => acc + t.osList.filter(o => o.paraVerif).length, 0);
    if (totalVerif > 0) {
      await new Promise(r => setTimeout(r, 800));
      await gerarDocVerificacao(dados);
      toast('✓ 2 arquivos gerados: Equipamentos + Verificação de OS!', 3500);
    } else {
      toast('✓ Equipamentos Instalados gerado! (Nenhuma OS para verificação.)', 3500);
    }
  } catch (e) {
    toast('Erro ao gerar: ' + e.message, 4000);
    console.error(e);
  }

  btn.disabled = false;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Gerar relatórios`;
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
  return new Paragraph({
    indent: { left: 720 },
    children: runs
  });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun({ text: '', font: 'Calibri', size: 28 })] });
}

function runBold(text, size = 28) {
  return new TextRun({ text, bold: true, size, font: 'Calibri' });
}

function runNormal(text, size = 28) {
  return new TextRun({ text, bold: false, size, font: 'Calibri' });
}

function runItalic(text, size = 28) {
  return new TextRun({ text, italics: true, size, font: 'Calibri' });
}

// ======================== DOC 1: EQUIPAMENTOS INSTALADOS ========================
async function gerarDocEquipamentos(dados) {
  const children = [];

  // Título
  children.push(paraCenter([runBold('EQUIPAMENTOS INSTALADOS', 32)]));
  children.push(paraCenter([runNormal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  children.push(emptyLine());

  dados.tecnicos.forEach(tec => {
    // Nome do técnico
    children.push(paraLeft([runBold(tec.nome)]));

    tec.osList.forEach(os => {
      children.push(emptyLine());
      // Número OS em negrito + tipo em normal, mesmo parágrafo
      children.push(paraLeft([
        runBold(os.numOS),
        runNormal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      // Equipamentos
      os.equips.forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        children.push(paraIndented([runNormal(txt)]));
      });

      // Observação
      if (os.obs) {
        children.push(paraIndented([runItalic(os.obs)]));
      }
    });

    children.push(emptyLine());
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  download(blob, 'EQUIPAMENTOS_INSTALADOS_REF_' + dados.dataRef.replace('.','_') + '.docx');
}

// ======================== DOC 2: VERIFICAÇÃO DE OS ========================
async function gerarDocVerificacao(dados) {
  // Filtra apenas OS marcadas para verificação
  const children = [];

  children.push(paraCenter([runBold('VERIFICACAO DE ORDENS DE SERVICOS', 32)]));
  children.push(paraCenter([runNormal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  children.push(emptyLine());

  let temRegistros = false;

  dados.tecnicos.forEach(tec => {
    const osVerif = tec.osList.filter(os => os.paraVerif);
    if (!osVerif.length) return;
    temRegistros = true;

    children.push(paraLeft([runBold(tec.nome)]));

    osVerif.forEach(os => {
      children.push(emptyLine());
      // Número OS + tipo
      children.push(paraLeft([
        runBold(os.numOS),
        runNormal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      // Erros
      os.erros.forEach(err => {
        children.push(paraIndented([runNormal(err)]));
      });

      // Equipamentos
      os.equips.forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        children.push(paraIndented([runNormal(txt)]));
      });

      // Observação adicional
      if (os.obs) {
        children.push(paraIndented([runItalic(os.obs)]));
      }
    });

    children.push(emptyLine());
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  download(blob, 'VERIFICACAO_OS_REF_' + dados.dataRef.replace('.','_') + '.docx');
}

// ======================== DOWNLOAD ========================
function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
