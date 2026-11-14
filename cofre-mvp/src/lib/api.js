import { base44 } from '@/api/base44Client';

export async function fetchRecomendacoes(simulacao) {
  const res = await base44.functions.invoke('gerarRecomendacoes', simulacao ? { simulacao } : {});
  return res.data;
}

export async function registrarMovimentacao(payload) {
  const res = await base44.functions.invoke('registrarMovimentacao', payload);
  return res.data;
}