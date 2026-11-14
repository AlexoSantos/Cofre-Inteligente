import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-1.5 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <p className="num text-[12px] text-ink">{String(payload[0].value).replace('.', ',')} °C</p>
    </div>
  );
}

export default function TemperatureChart({events=[]}) {
  const data=[...events].sort((a,b)=>a.data.localeCompare(b.data)).slice(-40).map(e=>({hora:new Date(e.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}),temperatura:e.temperatura}));
  if(!data.length)return <p className="text-xs text-ink-muted py-8">Nenhuma leitura registrada para este cofre.</p>;
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="#EDEAE3" vertical={false} />
          <XAxis dataKey="hora" tick={{ fontSize: 9.5, fill: '#8b9a9b' }} axisLine={false} tickLine={false} interval={3} />
          <YAxis domain={[dataMin=>Math.min(0,dataMin-1),dataMax=>Math.max(10,dataMax+1)]} tick={{ fontSize: 9.5, fill: '#8b9a9b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<Tip />} />
          <ReferenceLine y={8} stroke="#B4453A" strokeDasharray="4 4" label={{ value: 'limite 8 °C', fontSize: 9, fill: '#B4453A', position: 'insideTopRight' }} />
          <ReferenceLine y={2} stroke="#B4453A" strokeDasharray="4 4" label={{ value: 'limite 2 °C', fontSize: 9, fill: '#B4453A', position: 'insideBottomRight' }} />
          <Line type="linear" dataKey="temperatura" stroke="#0E6E6B" strokeWidth={1.8} dot={{r:3}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}