# Cofre Inteligente — Imperatech Sistemas

Solução desenvolvida pela **Imperatech Sistemas** para o desafio **Einsan Tech · Medical Security**. Frontend de estoque refrigerado e compras, integrado à IA e ao backend do SAI. Dados farmacêuticos e comerciais fictícios, operações persistidas em armazenamento privado na Vercel.

## Uso

Acesse https://cofre-inteligente-poc.vercel.app. O painel abre diretamente, sem cadastro, e-mail ou senha. Cada navegador tem um ambiente fictício independente e persistido na nuvem. Um cookie próprio mantém esse ambiente nas próximas visitas.

1. Registre movimentação por medicamento/lote ou identifique o código interno.
2. Selecione itens em Recomendações e use **Analisar e gerar pedido**. O backend consulta a IA e salva seu parecer antes do rascunho.
O botão **Limpar análise** remove o parecer atual da tela e permite uma nova chamada à IA, preservando histórico e pedidos vinculados.

3. Aprove e confirme o registro interno da compra.
4. Confira recebimento por lote, validade, temperatura e quantidade. Recebimentos parciais são permitidos; apenas recebimentos alteram o saldo físico do pedido.
5. Consulte auditoria, políticas, ofertas e conservação. Uma excursão coloca lotes afetados em quarentena.

Os fornecedores são fictícios. A confirmação não transmite pedidos externos. Leituras não estão conectadas a hardware real.

## Desenvolvimento

Node 22 ou 24, `npm ci`, `npm run dev`. `npm test` verifica as regras do motor. `npm run build` produz `dist/`.

O frontend chama `/api/cofre` no próprio domínio. Uma reescrita da Vercel encaminha as operações para `/api/cofre-demo` no backend SAI. Chaves de IA, service role e Blob permanecem no servidor. O cookie é HttpOnly e seleciona somente um workspace fictício de visitante.

## Backend (raiz do repositório)

- `src/routes/api/cofre-demo.ts`: API de acesso direto, com workspace fictício separado por navegador.
- `src/routes/api/cofre.ts`: API privada com sessão e função verificadas no servidor.
- `src/lib/cofre/demo.server.ts`: cookie próprio, operações públicas restritas ao ambiente fictício e limite de análises.
- `src/lib/cofre/domain.ts`: movimentações, FEFO, pedidos, recebimentos, conservação e auditoria.
- `src/lib/cofre/store.server.ts`: documento privado, leitura sem cache, gravação condicional por ETag e revalidação em concorrência. O ETag vem da API de metadados antes da leitura, evitando a divergência observada no header de download.
- `src/lib/cofre/service.server.ts`: análise real, invalidação de parecer após mudança e criação de pedidos.
- `src/lib/inventory-advisory.ts`: contrato validado com o provedor SAI; quantidades e fornecedores continuam sujeitos ao motor auditável.

O modelo de inventário usa `SAI_INVENTORY_MODEL`; não altera o modelo do módulo meteorológico. Credenciais já configuradas no projeto SAI são usadas apenas no servidor. A biblioteca Blob recebe credenciais da vinculação nativa do projeto, sem copiar segredos para o frontend.

## Verificação

Na raiz, `npm run test:cofre` executa os testes de fluxo e integridade. `npm run typecheck` valida o backend.

Quando `COFRE_VERIFY_AI=1` está configurado no build, `scripts/verify-cofre-runtime.mjs` cria um namespace sintético isolado, usa IA e Blob reais, gera um pedido, registra dois recebimentos, repete operações e testa retiradas simultâneas. Apenas esse namespace de teste é apagado. Falhas impedem a publicação do backend.

Verificação real concluída em 14/11/2026: modelo `openai/gpt-oss-120b`, 12 itens analisados, 1 pedido, 2 recebimentos, idempotência e concorrência aprovadas. Os 22 testes de backend e 10 testes do motor passaram. A interface foi verificada com provedor e autenticação controlados, incluindo login, movimento, análise, aprovação, recebimento, recarga, segunda sessão, falha do provedor e navegação móvel. A verificação real do provedor e da persistência é separada desse teste de interface.

## Operação e escopo

Workspace demonstrativo independente por navegador, com acesso direto. Há limite de 24 solicitações de análise por hora por ambiente. As APIs privadas e administrativas do SAI continuam protegidas e não recebem permissões desse acesso público. Estoque, auditoria, evidências dos pareceres e identificadores de operação são preservados na nuvem. O backup pode ser exportado em Auditoria e dados. Dados do protótipo anterior permanecem no navegador e têm exportação própria; não são mesclados silenciosamente ao saldo ativo.

O documento tem limite explícito de 32 MB; a aplicação recusa novas gravações ao atingir esse limite. Não há expurgo silencioso de registros. Um uso com medicamentos reais ou múltiplas instituições exige validação operacional e integração específica.

## Guia do avaliador

[Baixar o guia rápido em PDF](https://cofre-inteligente-poc.vercel.app/guia-avaliador.pdf). O documento tem acesso clicável, QR code, indicação de entrada sem credenciais e nove etapas de avaliação com os resultados esperados. Arquivo estático: `public/guia-avaliador.pdf`.

## Capturas do sistema em operação

[PDF com cinco telas e legendas](https://cofre-inteligente-poc.vercel.app/capturas-sistema.pdf) · [ZIP com cinco PNGs originais e legendas](https://cofre-inteligente-poc.vercel.app/capturas-sistema.zip).

As imagens têm 3840 × 2640 px e foram capturadas diretamente na versão publicada, usando operações com dados fictícios e a IA SAI real. Incluem painel de disponibilidade, histórico de conservação, fatores de reposição e simulação de consumo, pedido recebido e alerta térmico com quarentena. Arquivos individuais em `public/capturas/`.
