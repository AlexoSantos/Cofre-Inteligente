export const formatBRL = (value, digits = 0) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);

export const formatCompactBRL = (value) => {
  const v = Number(value) || 0;
  if (Math.abs(v) >= 1000000) return `R$ ${(v / 1000000).toFixed(2).replace('.', ',')} mi`;
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil`;
  return formatBRL(v);
};

export const formatNumber = (value, digits = 0) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const daysUntil = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
};

export const expiryLabel = (days) => {
  if (days === null) return '—';
  if (days < 0) return 'Vencido';
  if (days === 0) return 'Vence hoje';
  return `${days} dias`;
};

export const severityOf = (days, critical = 30, warning = 90) => {
  if (days === null) return 'neutral';
  if (days <= critical) return 'critical';
  if (days <= warning) return 'warning';
  return 'ok';
};