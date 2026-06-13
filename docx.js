// ==========================================================================
// GERAÇÃO DE DOCUMENTOS .DOCX
// ==========================================================================

// Referências da lib docx (preenchidas no primeiro uso)
var Document, Packer, Paragraph, TextRun, AlignmentType;

async function gerarDocumentos() {
  const dados = lerDados();

  if (!dados.tecnicos.length) {
    toast('Adicione ao menos um técnico com uma OS preenchida.', 3000);
    return;
  }

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
      toast('✓ Equipamentos Instalados gerado! (Sem OS para verificação.)', 3500);
    }

    // Persiste no histórico somente após geração bem-sucedida
    salvarNoHistorico(dados);

  } catch (e) {
    toast('Erro ao gerar: ' + e.message, 4000);
    console.error(e);
  }

  btn.disabled  = false;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
    Gerar relatórios`;
}

// ======================== HELPERS DOCX ========================

function _pCenter(runs) {
  return new Paragraph({ alignment: AlignmentType.CENTER, children: runs });
}

function _pLeft(runs, spacing) {
  const opts = { children: runs };
  if (spacing) opts.spacing = spacing;
  return new Paragraph(opts);
}

function _pIndented(runs) {
  return new Paragraph({ indent: { left: 720 }, children: runs });
}

function _emptyLine() {
  return new Paragraph({ children: [new TextRun({ text: '', font: 'Calibri', size: 28 })] });
}

function _bold(text, size = 28)   { return new TextRun({ text, bold: true,    size, font: 'Calibri' }); }
function _normal(text, size = 28) { return new TextRun({ text, bold: false,   size, font: 'Calibri' }); }
function _italic(text, size = 28) { return new TextRun({ text, italics: true, size, font: 'Calibri' }); }

function _pageSection(children) {
  return {
    properties: {
      page: {
        size:   { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children
  };
}

// ======================== DOC 1: EQUIPAMENTOS INSTALADOS ========================

async function gerarDocEquipamentos(dados) {
  const ch = [];

  ch.push(_pCenter([_bold('EQUIPAMENTOS INSTALADOS', 32)]));
  ch.push(_pCenter([_normal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  ch.push(_emptyLine());

  dados.tecnicos.forEach(tec => {
    ch.push(_pLeft([_bold(tec.nome)]));

    tec.osList.forEach(os => {
      ch.push(_emptyLine());
      ch.push(_pLeft([
        _bold(os.numOS),
        _normal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      os.equips.forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        ch.push(_pIndented([_normal(txt)]));
      });

      if (os.obs) ch.push(_pIndented([_italic(os.obs)]));
    });

    ch.push(_emptyLine());
  });

  const doc  = new Document({ sections: [_pageSection(ch)] });
  const blob = await Packer.toBlob(doc);
  const name = 'EQUIPAMENTOS_INSTALADOS_REF_' + dados.dataRef.replace('.', '_') + '.docx';
  downloadBlob(blob, name);
}

// ======================== DOC 2: VERIFICAÇÃO DE OS ========================

async function gerarDocVerificacao(dados) {
  const ch = [];

  ch.push(_pCenter([_bold('VERIFICACAO DE ORDENS DE SERVICOS', 32)]));
  ch.push(_pCenter([_normal('REFERENTE AO DIA ' + dados.dataRef, 32)]));
  ch.push(_emptyLine());

  dados.tecnicos.forEach(tec => {
    const osVerif = tec.osList.filter(os => os.paraVerif);
    if (!osVerif.length) return;

    ch.push(_pLeft([_bold(tec.nome)]));

    osVerif.forEach(os => {
      ch.push(_emptyLine());
      ch.push(_pLeft([
        _bold(os.numOS),
        _normal(os.tipo ? ' (' + os.tipo + ')' : '')
      ]));

      os.erros.forEach(err => ch.push(_pIndented([_normal(err)])));

      os.equips.forEach(eq => {
        let txt = eq.modelo + ' (' + eq.serial + ')';
        if (eq.status) txt += ' ' + eq.status;
        ch.push(_pIndented([_normal(txt)]));
      });

      if (os.obs) ch.push(_pIndented([_italic(os.obs)]));
    });

    ch.push(_emptyLine());
  });

  const doc  = new Document({ sections: [_pageSection(ch)] });
  const blob = await Packer.toBlob(doc);
  const name = 'VERIFICACAO_OS_REF_' + dados.dataRef.replace('.', '_') + '.docx';
  downloadBlob(blob, name);
}