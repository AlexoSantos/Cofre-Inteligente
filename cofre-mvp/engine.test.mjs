import { test } from 'node:test';
import assert from 'node:assert/strict';
import {computeRecommendations, simulate} from './src/lib/recommendationEngine.js';
const hoje='2026-11-13T12:00:00Z';
const med={id:'m1',nome:'Produto fictício',demanda_media_dia:10,cobertura_alvo_dias:30,estoque_seguranca_dias:5,multiplo_compra:6,preco_referencia:100};
const lot=(q=50,validade='2027-05-01',extra={})=>({medicamento_id:'m1',lote:'L',quantidade:q,validade,status:'disponivel',...extra});
const offer=(nome='Rápido',preco=100,prazo=2,extra={})=>({medicamento_id:'m1',fornecedor_nome:nome,preco_unitario:preco,prazo_entrega_dias:prazo,disponibilidade:'imediata',...extra});
const run=(extra={})=>computeRecommendations({medicamentos:[med],lotes:[lot()],movimentacoes:[],ofertas:[offer()],hoje,...extra}).recomendacoes[0];
test('transferências/perdas/ajustes e eventos futuros não viram consumo',()=>{
 const base={medicamento_id:'m1',quantidade:-300,data:'2026-11-12'};
 const r=run({movimentacoes:[{...base,tipo:'saida'},{...base,tipo:'transferencia'},{...base,tipo:'perda'},{...base,tipo:'ajuste'},{...base,tipo:'saida',data:'2026-12-01'}]});
 assert.equal(r.demanda,10); assert.match(r.qualidade.fonte,/saídas/);
});
test('FEFO não transforma perdas antigas em cobertura de lotes posteriores',()=>{
 const r=run({lotes:[lot(100,'2026-11-14'),lot(10,'2027-01-01'),lot(100,'2026-11-16')]});
 assert.equal(r.qtdRisco,170); assert.equal(r.saldoEfetivo,40);
});
test('quarentena e vencidos são excluídos, reserva não vira disponível',()=>{
 const r=run({lotes:[lot(20,'2027-01-01',{quantidade_reservada:5}),lot(100,'2026-11-12'),lot(50,'2027-01-01',{status:'quarentena'})]});
 assert.equal(r.saldo,15);assert.equal(r.saldoFisico,170);assert.equal(r.saldoBloqueado,155);
});
test('fornecedor barato que chega após ruptura perde para oferta viável',()=>{
 const r=run({ofertas:[offer('Barato',80,10),offer('Rápido',100,2)]});
 assert.equal(r.fornecedor.nome,'Rápido'); assert.equal(r.semOfertaViavel,false);assert.equal(r.economiaFornecedor,0); assert.ok(r.premioUrgencia>0);
});
test('sem fornecedor viável a narrativa não promete evitar falta',()=>{
 const r=run({ofertas:[offer('Lento',80,15)]});
 assert.equal(r.semOfertaViavel,true);assert.match(r.narrativa,/nenhuma oferta confirmada chega a tempo/);assert.doesNotMatch(r.narrativa,/evita ruptura/);
});
test('oferta sob encomenda não é confirmada como viável',()=>{
 const r=run({ofertas:[offer('Incerto',70,1,{disponibilidade:'sob_encomenda'}),offer()]});assert.equal(r.fornecedor.nome,'Rápido');
});
test('sem ofertas não gera quantidade de pedido fictício',()=>{const r=run({ofertas:[]});assert.equal(r.fornecedor,null);assert.equal(r.quantidade,0);});
test('estoque suficiente em monitoramento não gera compra desnecessária',()=>{const r=run({lotes:[lot(300)]});assert.equal(r.decisao,'monitorar');assert.equal(r.quantidade,0);});
test('simulação de consumo recalcula perdas por validade e múltiplos',()=>{
 const r=run({lotes:[lot(100,'2026-11-14')]}); const sim=simulate(r,{demanda_pct:100,prazo_dias:2});assert.equal(sim.cobertura,1); assert.equal(sim.quantidade%6,0);
});
test('saída insuficiente deixa explícita a baixa qualidade do histórico',()=>{const r=run();assert.match(r.qualidade.confianca,/baixa/);assert.match(r.qualidade.fonte,/parâmetro/);});
