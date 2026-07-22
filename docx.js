// ======================== GERAÇÃO DOCX (DRY & BUG-FREE) ========================

// Configuração padrão de página para reutilização estrutural
const CONFIG_PAGINA_PADRAO = {
  size: { width: 11906, height: 16838 },
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
};

async function gerarDocumentos() {
  const dados = lerDados();
  if (!dados?.tecnicos?.length) { toast('Adicione ao menos um técnico.'); return; }

  const btn = sel('btn-gerar');
  btn.disabled = true;
  btn.textContent = 'Gerando...';

  try {
    if (!window.docx) throw new Error("Biblioteca docx não carregada corretamente.");

    await gerarDocEquipamentos(dados);
    
    // Filtro seguro contra propriedades nulas/indefinidas
    const totalVerif = dados.tecnicos.reduce((acc, t) => {
      const listaOS = t.osList || [];
      return acc + listaOS.filter(o => o && o.paraVerif).length;
    }, 0);

    if (totalVerif > 0) {
      await new Promise(r => setTimeout(r, 800));
      await gerarDocVerificacao(dados);
      toast('✓ 2 arquivos gerados: Equipamentos + Verificação de OS!', 3500);
    } else {
      toast('✓ Equipamentos Instalados gerado! (Nenhuma OS para verificação.)', 3500);
    }

    // Gravação no histórico (Garante a persistência que estava ausente na chamada)
    if (typeof salvarNoHistorico === 'function') {
      salvarNoHistorico(dados);
    }

    // LIMPA O RASCUNHO após gerar com sucesso
    if (typeof limparRascunho === 'function') {
      limparRascunho();
    }

  } catch (e) {
    toast('Erro ao gerar: ' + e.message, 4000);
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Gerar relatórios`;
  }
}

// ---- Helpers DOCX ----
function paraCenter(runs) {
  return new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, children: runs });
}

function paraLeft(runs, spacing) {
  const opts = { children: runs };
  if (spacing) opts.spacing = spacing;
  return new docx.Paragraph(opts);
}

function paraIndented(runs) {
  return new docx.Paragraph({ indent: { left: 720 }, children: runs });
}

function emptyLine() {
  return new docx.Paragraph({ children: [new docx.TextRun({ text: '', font: 'Calibri', size: 28 })] });
}

function runBold(text, size = 28) {
  return new docx.TextRun({ text: String(text), bold: true, size, font: 'Calibri' });
}

function runNormal(text, size = 28) {
  return new docx.TextRun({ text: String(text), bold: false, size, font: 'Calibri' });
}

function runItalic(text, size = 28) {
  return new docx.TextRun({ text: String(text), italics: true, size, font: 'Calibri' });
}

// Trata com segurança o nome do arquivo, trocando TODOS os pontos por underscores
function formatarNomeArquivo(prefixo, dataRef) {
  const dataLimpa = String(dataRef || '').replace(/\./g, '_');
  return `${prefixo} REF.${dataLimpa}.docx`;
}

// ======================== DOC 1: EQUIPAMENTOS INSTALADOS ========================
async function gerarDocEquipamentos(dados) {
  const children = [];

  children.push(paraCenter([runBold('EQUIPAMENTOS INSTALADOS', 32)]));
  children.push(paraCenter([runNormal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  children.push(emptyLine());

  dados.tecnicos.forEach(tec => {
    const listaOS = tec.osList || [];
    if (!listaOS.length) return; // Otimização: Não lista técnicos sem produtividade no dia

    children.push(paraLeft([runBold(tec.nome)]));

    listaOS.forEach(os => {
      children.push(emptyLine());
      children.push(paraLeft([
        runBold(os.numOS),
        runNormal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      (os.equips || []).forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        children.push(paraIndented([runNormal(txt)]));
      });

      if (os.obs) {
        children.push(paraIndented([runItalic(os.obs)]));
      }
    });

    children.push(emptyLine());
  });

  const doc = new docx.Document({
    sections: [{ properties: { page: CONFIG_PAGINA_PADRAO }, children }]
  });

  const blob = await docx.Packer.toBlob(doc);
  download(blob, formatarNomeArquivo('EQUIPAMENTOS INSTALADOS', dados.dataRef));
}

// ======================== DOC 2: VERIFICAÇÃO DE OS ========================
async function gerarDocVerificacao(dados) {
  const children = [];

  children.push(paraCenter([runBold('VERIFICAÇÃO DE ORDENS DE SERVICOS', 32)]));
  children.push(paraCenter([runNormal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  children.push(emptyLine());

  dados.tecnicos.forEach(tec => {
    const listaOS = tec.osList || [];
    const osVerif = listaOS.filter(os => os && os.paraVerif);
    if (!osVerif.length) return;

    children.push(paraLeft([runBold(tec.nome)]));

    osVerif.forEach(os => {
      children.push(emptyLine());
      children.push(paraLeft([
        runBold(os.numOS),
        runNormal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      (os.erros || []).forEach(err => {
        children.push(paraIndented([runNormal(err)]));
      });

      (os.equips || []).forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        children.push(paraIndented([runNormal(txt)]));
      });

      if (os.obs) {
        children.push(paraIndented([runItalic(os.obs)]));
      }
    });

    children.push(emptyLine());
  });

  const doc = new docx.Document({
    sections: [{ properties: { page: CONFIG_PAGINA_PADRAO }, children }]
  });

  const blob = await docx.Packer.toBlob(doc);
  download(blob, formatarNomeArquivo('VERIFICAÇÃO ORDENS DE SERVIÇO', dados.dataRef));
}

// ======================== DOWNLOAD ========================
function download(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  // Mantido fluxo assíncrono para garantir o ciclo de evento do clique no browser
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}