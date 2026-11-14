import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-[11.5px] text-ink">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-ink-muted">{entry.name}</span>
          <span className="num ml-auto">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function ConsumptionChart({ data, reorderPoint = 120 }) {
  return (
    <div className="h-[248px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E6E6B" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#0E6E6B" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#EDEAE3" vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 10, fill: '#8b9a9b' }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis tick={{ fontSize: 10, fill: '#8b9a9b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#c9c4b9', strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="saldo"
            name="Saldo projetado"
            stroke="#0E6E6B"
            strokeWidth={2}
            fill="url(#saldoFill)"
          />
          <Line
            type="monotone"
            dataKey="consumo"
            name="Consumo/dia"
            stroke="#7FD1CB"
            strokeWidth={1.8}
            dot={false}
            strokeDasharray="4 3"
          />
          <ReferenceLine
            y={reorderPoint}
            stroke="#C9761B"
            strokeDasharray="5 4"
            label={{ value: 'ponto de pedido', position: 'insideTopRight', fontSize: 9, fill: '#C9761B' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}