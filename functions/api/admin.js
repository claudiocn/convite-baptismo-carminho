export async function onRequestGet(context) {
  // Lista todas as chaves no KV
  const listaChaves = await context.env.KV_CONVITES.list();
  
  // Vai buscar o valor de cada chave
  const resultados = await Promise.all(
    listaChaves.keys.map(async (item) => {
      const valor = await context.env.KV_CONVITES.get(item.name, { type: 'json' });
      return { id: item.name, ...valor };
    })
  );

  return new Response(JSON.stringify(resultados), {
    headers: { 'Content-Type': 'application/json' }
  });
}