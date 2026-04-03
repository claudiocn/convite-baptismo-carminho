export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ erro: 'ID em falta' }), { status: 400 });

  let dados = await context.env.KV_CONVITES.get(id, { type: 'json' });

  if (dados) {
    // Garante que o array de histórico existe
    if (!dados.historico_vistas) {
      dados.historico_vistas = [];
    }

    // Adiciona o timestamp atual ao histórico
    dados.historico_vistas.push(new Date().toISOString());
    
    // Mantém a flag 'visto' a true para ser mais fácil de filtrar depois
    dados.visto = true; 

    // Atualiza a base de dados KV
    await context.env.KV_CONVITES.put(id, JSON.stringify(dados));

    // Devolve os dados para o frontend
    return new Response(JSON.stringify(dados), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ erro: 'Não encontrado' }), { status: 404 });
}

export async function onRequestPost(context) {
  const { id, status } = await context.request.json();
  
  if (!id || !status) return new Response(JSON.stringify({ erro: 'Dados inválidos' }), { status: 400 });

  let dados = await context.env.KV_CONVITES.get(id, { type: 'json' });

  if (dados) {
    dados.status = status; // "confirmado" ou "recusado"
    
    // Se quiseres, também podes guardar um histórico de respostas!
    if (!dados.historico_respostas) {
        dados.historico_respostas = [];
    }
    dados.historico_respostas.push({
        status: status,
        data: new Date().toISOString()
    });
    
    await context.env.KV_CONVITES.put(id, JSON.stringify(dados));
    return new Response(JSON.stringify({ status: dados.status }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ erro: 'Não encontrado' }), { status: 404 });
}