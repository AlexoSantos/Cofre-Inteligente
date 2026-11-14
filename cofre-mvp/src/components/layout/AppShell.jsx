import {useCofre} from '@/lib/CofreContext';
import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Boxes,
  ArrowLeftRight,
  Truck,
  ClipboardList,
  Thermometer,
  Menu,
  X,
  Snowflake,
  BookOpen,
  History,
  Settings,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/recomendacoes', label: 'Recomendações', icon: Sparkles },
  { to: '/estoque', label: 'Estoque & lotes', icon: Boxes },
  { to: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/pedidos', label: 'Pedidos de compra', icon: ClipboardList },
  { to: '/cofre', label: 'Cofre refrigerado', icon: Thermometer },
  { to: '/auditoria', label: 'Auditoria e dados', icon: History },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/metodologia', label: 'Pesquisa & metodologia', icon: BookOpen },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 px-2">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal text-white shadow-[0_0_0_1px_rgba(127,209,203,0.35),0_8px_20px_-10px_rgba(127,209,203,0.8)]">
        <Snowflake className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-[0.22em] text-teal-ice/70">Imperatech Sistemas</p>
        <p className="text-[15px] font-medium text-white">Cofre Inteligente</p>
      </div>
    </Link>
  );
}

function NavList({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-all duration-200',
              isActive
                ? 'bg-white/[0.07] text-white'
                : 'text-[#93a5a6] hover:bg-white/[0.04] hover:text-[#e6eeee]',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={`h-[17px] w-[17px] transition-colors ${
                  isActive ? 'text-teal-ice' : 'text-[#6f8486] group-hover:text-[#a9bdbd]'
                }`}
                strokeWidth={1.7}
              />
              <span className="tracking-[-0.01em]">{label}</span>
              {isActive && <span className="ml-auto h-1 w-1 rounded-full bg-teal-ice" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const {view}=useCofre();
  const latest=[...view.state.EventoCofre].filter(e=>e.tipo==='temperatura').sort((a,b)=>b.data.localeCompare(a.data))[0];
  return (
    <div className="mt-auto space-y-3 px-2 pb-2 pt-6">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal-ice" />
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8fa3a4]">Cofre simulado</p>
        </div>
        <p className="mt-1.5 num text-[13px] text-white">{latest?String(latest.temperatura).replace('.',',')+' °C':'Sem leitura'}</p>
        <p className="text-[11px] text-[#7e9294]">Última leitura registrada · dados fictícios</p>
      </div>
      <p className="px-1 text-[10px] leading-relaxed text-[#5d7173]">
        Desenvolvido por Imperatech Sistemas. MVP com dados fictícios e persistência na nuvem.
      </p>
    </div>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-ink px-4 py-6 lg:flex">
        <Brand />
        <div className="my-6 h-px bg-white/[0.07]" />
        <p className="label-xs mb-2 px-3 text-[#5d7173]">Operação</p>
        <NavList />
        <SidebarFooter />
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-white">
            <Snowflake className="h-4 w-4" strokeWidth={1.7} />
          </div>
          <span className="text-[14px] font-medium">Imperatech Sistemas</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white text-ink"
          aria-label="Abrir menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[264px] flex-col bg-ink px-4 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#93a5a6]"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="my-6 h-px bg-white/[0.07]" />
            <NavList onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </div>
        </div>
      )}

      <main className="lg:pl-[264px]">

        <Outlet />
      </main>
    </div>
  );
}