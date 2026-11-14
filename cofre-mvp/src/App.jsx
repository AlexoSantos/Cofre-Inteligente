import Auditoria from '@/pages/Auditoria';
import Configuracoes from '@/pages/Configuracoes';
import {CofreProvider} from '@/lib/CofreContext';
import {HashRouter, Routes, Route} from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/pages/Dashboard';
import Recomendacoes from '@/pages/Recomendacoes';
import Estoque from '@/pages/Estoque';
import Movimentacoes from '@/pages/Movimentacoes';
import Fornecedores from '@/pages/Fornecedores';
import Pedidos from '@/pages/Pedidos';
import Cofre from '@/pages/Cofre';
import Metodologia from '@/pages/Metodologia';
export default function App(){return <CofreProvider><HashRouter><Routes><Route element={<AppShell/>}><Route index element={<Dashboard/>}/><Route path="recomendacoes" element={<Recomendacoes/>}/><Route path="estoque" element={<Estoque/>}/><Route path="movimentacoes" element={<Movimentacoes/>}/><Route path="fornecedores" element={<Fornecedores/>}/><Route path="pedidos" element={<Pedidos/>}/><Route path="cofre" element={<Cofre/>}/><Route path="auditoria" element={<Auditoria/>}/><Route path="configuracoes" element={<Configuracoes/>}/><Route path="metodologia" element={<Metodologia/>}/><Route path="*" element={<Dashboard/>}/></Route></Routes></HashRouter></CofreProvider>}
