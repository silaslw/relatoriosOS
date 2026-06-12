// teste-ixc.js

async function fetchIXC(tabela, qtype, query, oper = '=') {
    // IMPORTANTE: Substitua pela URL do servidor onde seu arquivo api_ixc.php estará hospedado
    const urlMiddleware = 'https://seuservidor.com.br/api_ixc.php'; 
    
    const payload = { tabela, qtype, query, oper };
  
    const resposta = await fetch(urlMiddleware, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status} na tabela ${tabela}`);
    const dados = await resposta.json();
    return dados.registros || [];
}

async function carregarDadosOSCompleta(id_os) {
    // 1. Puxar dados base da OS
    const osBaseReq = await fetchIXC('suporte', 'id', id_os);
    if (osBaseReq.length === 0) throw new Error('OS não encontrada ou ID inválido.');
    
    const osData = osBaseReq[0];
    const idContrato = osData.id_contrato;
    
    // 2. Executar buscas paralelas para máxima performance
    const [produtos, comodatos, arquivos, diagnostico] = await Promise.all([
      fetchIXC('suporte_produtos_os', 'id_suporte', id_os),
      fetchIXC('cliente_contrato_comodato', 'id_contrato', idContrato),
      fetchIXC('uploads', 'id_registro', id_os),
      fetchIXC('suporte_assunto', 'id', osData.id_assunto)
    ]);

    // 3. Estruturação do objeto consolidado
    return {
      metadata: {
        status_api: "Sucesso",
        tempo_resposta: new Date().toISOString()
      },
      os_base: {
        id: osData.id,
        id_tecnico: osData.id_tecnico,
        id_contrato: idContrato,
        diagnostico: diagnostico.length > 0 ? diagnostico[0].assunto : 'Não definido',
        mensagem_tecnica: osData.mensagem // Geralmente o relato do cliente/atendente
      },
      abas: {
        produtos: produtos,
        comodato: comodatos,
        arquivos: arquivos.filter(arq => arq.tabela === 'suporte'),
      }
    };
}

async function executarTesteIXC() {
    const inputId = document.getElementById('input-teste-os').value.trim();
    const outputDebug = document.getElementById('output-debug-ixc');
    const btn = document.querySelector('button[onclick="executarTesteIXC()"]');

    if (!inputId) {
        outputDebug.value = "ERRO: Por favor, insira um ID de OS válido.";
        return;
    }

    try {
        // Estado de carregamento na UI
        btn.innerHTML = "Buscando...";
        btn.disabled = true;
        outputDebug.value = "Conectando ao middleware PHP e aguardando retorno do IXCSoft...\nIsso pode levar alguns segundos devido às múltiplas requisições simultâneas.";

        // Executa a orquestração
        const dadosCompletos = await carregarDadosOSCompleta(inputId);
        
        // Despeja o resultado no textarea com formatação JSON identada
        outputDebug.value = JSON.stringify(dadosCompletos, null, 2);

    } catch (erro) {
        outputDebug.value = `FALHA NA INTEGRAÇÃO:\n\n${erro.message}\n\nVerifique:\n1. Se o arquivo api_ixc.php está online.\n2. Se o CORS não está bloqueando a requisição.\n3. Se o Token do IXC tem permissão de leitura para todas as tabelas requeridas.`;
    } finally {
        // Restaura a UI
        btn.innerHTML = "Buscar Dados da OS";
        btn.disabled = false;
    }
}