// Motor de decisão de reposição e compra do Medical Security.
// Fonte única de verdade: usado pela função gerarRecomendacoes.

export const CAPITAL_DAY_RATE = 0.00035; // hipótese de custo de capital: 0,035% ao dia (~1,05% em 30 dias)

const DAY = 86400000;

export function startOfDay(value) {
  const raw = String(value || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw + 'T00:00:00Z');
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return new Date(NaN);
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const get = key => parts.find(p => p.type === key).value;
  return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00Z`);
}

export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - (from instanceof Date ? from : startOfDay(from))) / DAY);
}

function round(n, digits = 0) {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

function ceilTo(n, step) {
  const s = step > 0 ? step : 1;
  return Math.ceil(n / s) * s;
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const DECISAO = {
  comprar_agora: { label: 'Comprar agora', tom: 'critico' },
  repor: { label: 'Repor no ciclo', tom: 'atencao' },
  monitorar: { label: 'Monitorar', tom: 'ok' },
  nao_comprar: { label: 'Não comprar', tom: 'excedente' },
};

function buildFatores(item) {
  const fatores = [];
  const { demanda, tendencia, saldo, saldoEfetivo, cobertura, alvo, segurancaDias, prazoEscolhido, loteRisco, escolhido, alternativaMaisBarata, valorRisco, capitalLiberavel, unidade } = item;

  fatores.push({
    titulo: 'Consumo',
    valor: `${round(demanda, 1)} ${unidade}/dia`,
    detalhe:
      tendencia === 0
        ? 'Sem variação calculável entre as duas janelas; isso não comprova estabilidade nem ausência de sazonalidade.'
        : `Tendência de ${tendencia > 0 ? '+' : ''}${round(tendencia, 0)}% nos últimos 30 dias frente ao período anterior.`,
    tom: tendencia > 15 ? 'critico' : tendencia < -15 ? 'ok' : 'neutro',
  });

  fatores.push({
    titulo: 'Saldo e cobertura',
    valor: `${round(saldo, 0)} ${unidade} · ${round(cobertura, 1)} dias`,
    detalhe:
      saldoEfetivo !== saldo
        ? `Do saldo físico, ${round(saldo - saldoEfetivo, 0)} ${unidade} não devem ser consumidos antes do vencimento. Cobertura efetiva de ${round(cobertura, 1)} dias contra alvo de ${round(alvo, 0)}.`
        : `Cobertura de ${round(cobertura, 1)} dias contra alvo de ${round(alvo, 0)} dias definido para a classe do item.`,
    tom: cobertura < prazoEscolhido ? 'critico' : cobertura < alvo ? 'atencao' : 'ok',
  });

  fatores.push({
    titulo: 'Estoque de segurança',
    valor: `${round(segurancaDias, 0)} dias`,
    detalhe: `Protege variação de consumo e atraso de entrega: equivale a ${round(demanda * segurancaDias, 0)} ${unidade}.`,
    tom: 'neutro',
  });

  if (escolhido) {
    fatores.push({
      titulo: 'Prazo do fornecedor',
      valor: `${escolhido.fornecedor_nome} · ${escolhido.prazo} dias`,
      detalhe:
        escolhido.prazo >= cobertura
          ? `O prazo de entrega atinge ou supera a cobertura atual (${round(cobertura, 1)} dias): a ruptura acontece antes da reposição chegar.`
          : `A entrega chega em ${escolhido.prazo} dias, dentro da cobertura de ${round(cobertura, 1)} dias.`,
      tom: escolhido.prazo >= cobertura ? 'critico' : 'ok',
    });
  }

  if (loteRisco) {
    fatores.push({
      titulo: 'Validade',
      valor: `Lote ${loteRisco.lote} · ${loteRisco.dias} dias`,
      detalhe: `${round(loteRisco.risco, 0)} ${unidade} do lote vencem antes de serem consumidos — perda projetada de R$ ${round(valorRisco, 0).toLocaleString('pt-BR')}.`,
      tom: 'atencao',
    });
  }

  if (alternativaMaisBarata && escolhido && alternativaMaisBarata.fornecedor_nome !== escolhido.fornecedor_nome) {
    fatores.push({
      titulo: 'Trade-off de fornecedor',
      valor: `${alternativaMaisBarata.fornecedor_nome} · ${alternativaMaisBarata.prazo} dias`,
      detalhe: `Menor preço unitário: R$ ${alternativaMaisBarata.preco}; prazo: ${alternativaMaisBarata.prazo} dias; disponibilidade: ${alternativaMaisBarata.disponibilidade}. Oferta escolhida: R$ ${escolhido.preco}/un e ${escolhido.prazo} dias. Avaliação considera prazo e disponibilidade confirmada; prêmio não é economia.`,
      tom: 'atencao',
    });
  }

  if (capitalLiberavel > 0) {
    fatores.push({
      titulo: 'Capital imobilizado',
      valor: `R$ ${round(capitalLiberavel, 0).toLocaleString('pt-BR')}`,
      detalhe: `O saldo cobre ${round(cobertura, 0)} dias. Reduzir para ${round(alvo, 0)} dias libera capital e diminui exposição a vencimento.`,
      tom: 'ok',
    });
  }

  return fatores;
}

export function computeRecommendations({ medicamentos, lotes, movimentacoes, ofertas, hoje }) {
  const today = startOfDay(hoje || new Date());
  const inicio30 = new Date(today.getTime() - 30 * DAY);
  const inicio60 = new Date(today.getTime() - 60 * DAY);

  const consumo = {};
  for (const mv of movimentacoes || []) {
    const qtd = -num(mv.quantidade);
    if (qtd <= 0 || mv.tipo !== 'saida') continue;
    const d = startOfDay(mv.data);
    if (!Number.isFinite(d.getTime()) || d < inicio60 || d >= today) continue;
    const key = mv.medicamento_id || mv.medicamento_nome;
    if (!consumo[key]) consumo[key] = { atual: 0, anterior: 0 };
    if (d >= inicio30) consumo[key].atual += qtd;
    else consumo[key].anterior += qtd;
  }

  const lotesPorMed = {};
  for (const l of lotes || []) {
    if (!lotesPorMed[l.medicamento_id]) lotesPorMed[l.medicamento_id] = [];
    lotesPorMed[l.medicamento_id].push(l);
  }

  const ofertasPorMed = {};
  for (const o of ofertas || []) {
    if (!ofertasPorMed[o.medicamento_id]) ofertasPorMed[o.medicamento_id] = [];
    ofertasPorMed[o.medicamento_id].push(o);
  }

  const recomendacoes = (medicamentos || []).map((m) => {
    const c = consumo[m.id] || { atual: 0, anterior: 0 };
    const demandaBase = c.atual / 30;
    const demanda = demandaBase > 0 ? demandaBase : num(m.demanda_media_dia, 0);
    const tendencia = c.anterior > 0 ? ((c.atual - c.anterior) / c.anterior) * 100 : 0;
    const alvo = num(m.cobertura_alvo_dias, 30);
    const segurancaDias = num(m.estoque_seguranca_dias, 10);
    const multiplo = num(m.multiplo_compra, 1) || 1;
    const unidade = m.unidade || 'un';
    const precoRef = num(m.preco_referencia, 0);

    const doMed = lotesPorMed[m.id] || [];
    const saldoFisico = doMed.reduce((sum, l) => sum + Math.max(0, num(l.quantidade)), 0);
    const disponiveis = doMed.filter((l) => l.status === 'disponivel');
    const validos = disponiveis
      .filter((l) => Number.isFinite(startOfDay(l.validade).getTime()) && startOfDay(l.validade) > today && num(l.quantidade) > 0)
      .map(l => ({...l, quantidade: Math.max(0, num(l.quantidade) - Math.max(0, num(l.quantidade_reservada)))}))
      .sort((a, b) => new Date(a.validade) - new Date(b.validade));
    const vencidos = disponiveis.filter((l) => startOfDay(l.validade) <= today && num(l.quantidade) > 0);

    const saldo = validos.reduce((s, l) => s + num(l.quantidade), 0);

    // FEFO: perdas anteriores não podem voltar a ocupar capacidade de consumo.
    let consumivelAcumulado = 0;
    let qtdRisco = 0;
    let valorRisco = 0;
    let loteRisco = null;
    for (const l of validos) {
      const dias = Math.max(0, daysBetween(today, l.validade));
      const capacidadeRestante = Math.max(0, demanda * dias - consumivelAcumulado);
      const consumivel = Math.min(num(l.quantidade), capacidadeRestante);
      const risco = Math.max(0, num(l.quantidade) - consumivel);
      consumivelAcumulado += consumivel;
      qtdRisco += risco;
      valorRisco += risco * num(l.valor_unitario, precoRef);
      if (risco > 0 && !loteRisco) loteRisco = { lote: l.lote, dias, risco, validade: l.validade };
    }
    const valorVencidos = vencidos.reduce((s, l) => s + num(l.quantidade) * num(l.valor_unitario, precoRef), 0);
    valorRisco += valorVencidos;

    const saldoEfetivo = Math.max(0, saldo - qtdRisco);
    const cobertura = demanda > 0 ? saldoEfetivo / demanda : 999;

    // Avaliação de fornecedores: preço + custo de capital do prazo
    const avaliadas = (ofertasPorMed[m.id] || [])
      .map((o) => {
        const prazo = num(o.prazo_entrega_dias, 15);
        const preco = num(o.preco_unitario, precoRef);
        return {
          fornecedor_nome: o.fornecedor_nome,
          preco,
          prazo,
          disponibilidade: o.disponibilidade || 'imediata',
          viavel: prazo >= 0 && prazo < cobertura && preco > 0 && o.disponibilidade === 'imediata',
          custo_capital_dia: preco * CAPITAL_DAY_RATE,
        };
      })
      .sort((a, b) => a.preco - b.preco);

    const viaveis = avaliadas.filter((o) => o.viavel);
    let escolhido = viaveis.length
      ? viaveis.slice().sort((a, b) => a.preco * (1 + a.prazo * CAPITAL_DAY_RATE) - b.preco * (1 + b.prazo * CAPITAL_DAY_RATE))[0]
      : avaliadas.slice().sort((a, b) => a.prazo - b.prazo)[0] || null;
    const alternativaMaisBarata = avaliadas[0] || null;
    const prazoEscolhido = escolhido ? escolhido.prazo : 10;
    const semOfertaViavel = viaveis.length === 0;

    // Quantidade: elevar a posição projetada na entrega até o alvo + segurança
    const posicaoNaEntrega = Math.max(0, saldoEfetivo - demanda * prazoEscolhido);
    const quantidadeIdeal = Math.max(0, demanda * (alvo + segurancaDias) - posicaoNaEntrega);
    let quantidade = quantidadeIdeal > 0 && demanda > 0 ? ceilTo(quantidadeIdeal, multiplo) : 0;

    let decisao = 'monitorar';
    if (demanda <= 0) {
      decisao = 'monitorar';
    } else if (cobertura <= prazoEscolhido + 2) {
      decisao = 'comprar_agora';
    } else if (saldoEfetivo <= demanda * prazoEscolhido + demanda * segurancaDias) {
      decisao = 'repor';
    } else if (cobertura > alvo * 1.6) {
      decisao = 'nao_comprar';
    }
    if (decisao === 'nao_comprar') quantidade = 0;
    if (decisao === 'monitorar' || !escolhido) quantidade = 0;

    const precoEscolhido = escolhido ? escolhido.preco : precoRef;
    const valorSugerido = quantidade * precoEscolhido;
    const capitalLiberavel =
      decisao === 'nao_comprar' ? Math.max(0, (saldoEfetivo - demanda * (alvo + segurancaDias)) * precoRef) : 0;
    // prêmio pago pela velocidade de entrega frente à oferta mais barata
    const premioFornecedor =
      escolhido && alternativaMaisBarata && alternativaMaisBarata.fornecedor_nome !== escolhido.fornecedor_nome
        ? Math.max(0, escolhido.preco - alternativaMaisBarata.preco) * quantidade
        : 0;

    const premioUrgencia = premioFornecedor;
    const economiaFornecedor = 0;
    const registrosConsumo = (movimentacoes || []).filter(mv => mv.medicamento_id === m.id && mv.tipo === 'saida' && num(mv.quantidade) < 0 && startOfDay(mv.data) >= inicio30 && startOfDay(mv.data) < today);
    const diasObservados = new Set(registrosConsumo.map(mv => String(mv.data).slice(0, 10))).size;
    const qualidade = { dias_observados: diasObservados, fonte: demandaBase > 0 ? 'saídas registradas / 30 dias' : 'parâmetro cadastrado, sem consumo observado', confianca: diasObservados >= 14 ? 'histórico parcial; validar completude' : 'baixa; revisão manual necessária' };
    let score = 0;
    if (demanda > 0) {
      score += Math.max(0, Math.min(60, (1 - Math.min(cobertura, alvo) / alvo) * 60));
      score += Math.max(0, Math.min(20, tendencia / 2));
    }
    score += Math.min(20, (valorRisco / Math.max(1, saldo * precoRef)) * 25);
    if (m.criticidade === 'Vital') score += 8;
    else if (m.criticidade === 'Alta') score += 4;
    score = Math.round(Math.min(100, score));

    const item = {
      medicamento_id: m.id,
      nome: m.nome,
      apresentacao: m.apresentacao,
      principio_ativo: m.principio_ativo,
      categoria: m.categoria,
      classe_abc: m.classe_abc,
      criticidade: m.criticidade,
      unidade,
      codigo_gtin: m.codigo_gtin || '',
      decisao,
      decisao_label: DECISAO[decisao].label,
      score,
      demanda: round(demanda, 2),
      tendencia: round(tendencia, 0),
      saldo: round(saldo, 0),
      saldoFisico,
      saldoBloqueado: Math.max(0, saldoFisico - saldo),
      semOfertaViavel,
      qualidade,
      multiplo,
      premioUrgencia,
      economiaFornecedor,
      saldoEfetivo: round(saldoEfetivo, 0),
      qtdRisco: round(qtdRisco, 0),
      valorRisco: round(valorRisco, 0),
      saldoValor: round(saldo * precoRef, 0),
      cobertura: round(cobertura, 1),
      alvo,
      segurancaDias,
      prazoEscolhido,
      pontoPedido: round(demanda * prazoEscolhido + demanda * segurancaDias, 0),
      quantidade,
      valorSugerido: round(valorSugerido, 0),
      capitalLiberavel: round(capitalLiberavel, 0),
      premioFornecedor: round(premioFornecedor, 0),
      precoEscolhido,
      validadeProximaDias: loteRisco ? loteRisco.dias : null,
      loteRisco,
      fornecedor: escolhido
        ? { nome: escolhido.fornecedor_nome, preco: escolhido.preco, prazo: escolhido.prazo }
        : null,
      alternativas: avaliadas.map((o) => ({
        fornecedor_nome: o.fornecedor_nome,
        preco: o.preco,
        prazo: o.prazo,
        disponibilidade: o.disponibilidade,
        viavel: o.viavel,
        custo_total: round(o.preco * quantidade * (1 + o.prazo * CAPITAL_DAY_RATE), 0),
        diferenca: round(o.preco - precoEscolhido, 0),
      })),
      lotes: validos.map((l) => ({
        lote: l.lote,
        quantidade: num(l.quantidade),
        validade: l.validade,
        dias: daysBetween(today, l.validade),
        cofre: l.cofre,
      })),
      narrativa: '',
    };

    item.fatores = buildFatores({
      ...item,
      escolhido: escolhido ? { fornecedor_nome: escolhido.fornecedor_nome, prazo: escolhido.prazo, preco: escolhido.preco } : null,
      alternativaMaisBarata,
      valorRisco: item.valorRisco,
      prazoEscolhido,
    });

    item.fatores.push({ titulo: 'Qualidade dos dados', valor: qualidade.confianca, detalhe: `${diasObservados} dias com saídas na janela de 30 dias. Fonte: ${qualidade.fonte}. Dias sem registro podem ser ausência de consumo ou falha de captura.`, tom: 'atencao' });
    if (semOfertaViavel) item.fatores.push({ titulo: 'Viabilidade da compra', valor: 'Nenhuma oferta confirmada chega antes da ruptura', detalhe: 'O fornecedor exibido é uma alternativa para consulta. Validar disponibilidade e remanejamento/compra emergencial; a compra sugerida não garante evitar falta.', tom: 'critico' });
    item.narrativa = decisao === 'nao_comprar'
      ? `Não comprar: cobertura efetiva de ${round(cobertura, 1)} dias contra alvo de ${alvo}. Avaliar redistribuição de lotes em risco. Capital potencialmente reduzível: R$ ${round(capitalLiberavel).toLocaleString('pt-BR')}; não é economia realizada.`
      : decisao === 'monitorar'
      ? `Monitorar: cobertura de ${round(cobertura, 1)} dias. Não gerar compra neste ciclo; revisar consumo e validade.`
      : `${semOfertaViavel ? 'Risco de ruptura: nenhuma oferta confirmada chega a tempo. Avaliar alternativa emergencial. ' : ''}Repor ${quantidade} ${unidade}; cobertura efetiva ${round(cobertura, 1)} dias, prazo ${prazoEscolhido} dias, segurança ${segurancaDias} dias. ${escolhido ? `Consultar ${escolhido.fornecedor_nome}.` : 'Obter cotação; não há fornecedor selecionável.'} ${qualidade.confianca}.`;

    return item;
  });

  recomendacoes.sort((a, b) => b.score - a.score);

  const resumo = {
    total_itens: recomendacoes.length,
    comprar_agora: recomendacoes.filter((r) => r.decisao === 'comprar_agora').length,
    repor: recomendacoes.filter((r) => r.decisao === 'repor').length,
    nao_comprar: recomendacoes.filter((r) => r.decisao === 'nao_comprar').length,
    monitorar: recomendacoes.filter((r) => r.decisao === 'monitorar').length,
    valor_sugerido: round(recomendacoes.reduce((s, r) => s + r.valorSugerido, 0), 0),
    valor_em_risco: round(recomendacoes.reduce((s, r) => s + r.valorRisco, 0), 0),
    capital_liberavel: round(recomendacoes.reduce((s, r) => s + r.capitalLiberavel, 0), 0),
    capital_imobilizado: round(recomendacoes.reduce((s, r) => s + r.saldoValor, 0), 0),
    cobertura_media: round(
      recomendacoes.filter((r) => r.cobertura < 900).reduce((s, r) => s + r.cobertura, 0) /
        Math.max(1, recomendacoes.filter((r) => r.cobertura < 900).length),
      0
    ),
    premio_prazo: round(recomendacoes.reduce((s, r) => s + r.premioFornecedor, 0), 0),
  };

  return { resumo, recomendacoes };
}

export function simulate(item, params) {
  const demandaPct = Math.max(-100, Math.min(500, num(params.demanda_pct, 0)));
  const prazo = Math.max(0, num(params.prazo_dias, item.prazoEscolhido));
  const alvo = Math.max(1, num(params.cobertura_alvo, item.alvo));
  const seguranca = Math.max(0, num(params.seguranca_dias, item.segurancaDias));
  const demanda = item.demanda * (1 + demandaPct / 100);
  let consumivel = 0;
  for (const lote of item.lotes || []) {
    consumivel += Math.min(num(lote.quantidade), Math.max(0, demanda * Math.max(0, num(lote.dias)) - consumivel));
  }
  const saldoEfetivo = item.lotes?.length ? consumivel : item.saldoEfetivo;
  const cobertura = demanda > 0 ? saldoEfetivo / demanda : 999;
  const posicaoNaEntrega = Math.max(0, saldoEfetivo - demanda * prazo);
  const ideal = Math.max(0, demanda * (alvo + seguranca) - posicaoNaEntrega);
  const quantidade = ideal > 0 && demanda > 0 ? ceilTo(ideal, item.multiplo || 1) : 0;
  const valor = quantidade * (item.precoEscolhido || 0);
  return {
    demanda: round(demanda, 1),
    cobertura: round(cobertura, 1),
    ruptura_dias: round(cobertura, 0),
    quantidade,
    valor: round(valor, 0),
    ponto_pedido: round(demanda * prazo + demanda * seguranca, 0),
    risco_ruptura: cobertura <= prazo,
    delta_valor: round(valor - item.valorSugerido, 0),
  };
}
