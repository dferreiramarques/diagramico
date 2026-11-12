# Roadmap do Diagramico

Estado em 2026-11-04 (avaliação dos próximos passos no fim). A versão pública e simplificada (NOW / NEXT / LATER) está na landing, na secção Roadmap; esta é a versão completa. As datas e os esforços são estimativas de uma pessoa a trabalhar sozinha, para ordenar o trabalho, não compromissos.

## Os três níveis

| | **Free** (feito) | **Equipas** (pago) | **Premium** (pago, fora de âmbito por agora) |
|---|---|---|---|
| Desenhar, alinhar, lanes coladas, decisões BPMN | ✔ | ✔ | ✔ |
| Exportar: texto IA, Mermaid, SVG, PNG, JSON, ligação `#d=` (completa) e ligação curta `/s/ID` | ✔ | ✔ | ✔ |
| Importar: draw.io, Visio, texto IA, Mermaid | ✔ | ✔ | ✔ |
| Gravação | Só no browser (`localStorage`) | **Na conta Google** do utilizador | **Na infraestrutura do cliente** |
| Colaboração em tempo real (lobby + mesa, cursor colorido com nome) | — | ✔ | Só na rede interna |
| Comentários de revisão (pontos presos a formas, setas ou ao quadro) | ✔ | ✔ | ✔ |
| Comentários em conversa (respostas, resolver, menções), partilhados | — | ✔ | ✔ |
| Acesso: *team member* (ler e escrever) e *reviewer* (só ler) | — | ✔ | ✔ |

Princípio: tudo o que está no Free continua a funcionar sem conta e sem servidor. O pago acrescenta; nunca tira.

## O que já existe e se reaproveita

| Peça | Onde | Para quê |
|---|---|---|
| Login Google + gravação em `appDataFolder` (Google Identity Services, scope `drive.appdata`) | `taskboards/app.js` | Fase 1 |
| Servidor Node com WebSocket (`ws`), salas, sessões, reconexão, deploy no Railway | `bitnik-platform` (`@bitnik/server`, `@bitnik/client`) | Fase 2 |
| Identidade, lobby e "mesa" como conceitos | `bitnik-platform` | Fase 2 |
| Modelo de diagrama simples e plano (`nodes[]`, `edges[]` com ids) | `app/index.html` | Fases 2 e 3 |

## Duas restrições que moldam o desenho

1. **O `appDataFolder` do Google Drive é privado a cada utilizador.** Funciona para "guardar na minha conta", mas um diagrama lá guardado **não pode ser partilhado** com outra pessoa. Logo, a colaboração não pode viver no Drive: o diagrama de uma sessão vive num servidor (sala), e o Drive fica como cópia pessoal de cada utilizador.
2. **Colaborar muda a promessa de privacidade.** Hoje a landing diz que "os dados ficam no teu browser". Numa sala colaborativa o conteúdo passa pelo servidor. É preciso dizê-lo, definir quanto tempo se guarda, e manter o Free exatamente como é.

## Fases

### Fase 0: fechar o Free e medir a procura (agora)
- Lista de espera: **o aviso de RGPD e a caixa de consentimento já estão no formulário**; **ligada ao Formspree** (`maeqaqrn`), com `connect-src` já aberto para `formspree.io`.
- Medir visitas sem cookies: **feito (2026-11-12) com contagem própria no servidor** (`/api/event`, totais diários anónimos; ver `docs/ARQUITETURA.md`), em vez de Plausible ou GoatCounter, para a página continuar sem terceiros. Falta definir `STATS_KEY` no Railway para ler os totais em `/api/stats`.
- Rever o texto "equipas" da landing para listar as funcionalidades pagas acima, sem prometer datas.
- Criar o repositório privado do servidor desde o início (o editor atual fica MIT, já publicado).
- **Critério para avançar:** um número de inscrições definido de antemão (sugestão: 50 emails ou 5% das visitas únicas) e respostas ao "O que desenhas?".

### Fase 1: contas, cobrança e gravar no Google
Âmbito:
- Entrar com Google (como no Taskboards). Sem conta, o Free fica igual.
- **Gravar e abrir diagramas na conta**: `drive.appdata`, um ficheiro por diagrama, com `updated` para resolver conflitos (o mais recente ganha, e aviso se houver divergência). Migração dos diagramas de `localStorage` para a conta com um clique.
- Uma camada `Storage` na app (`local`, `drive`, mais tarde `server`) em vez de chamadas diretas ao `localStorage`. **Faz-se já aqui, porque é o que mantém o Premium possível.**
- **Um servidor mínimo** (Railway) só para cobrança: Stripe Checkout, webhook, tabela de direitos (quem tem Equipas) e um `/me` que valida o token Google. Diferença para o Taskboards, que não tem servidor.
- Estado "plano" visível na app e portal de faturação.

Fora: colaboração, comentários, papéis.
**Esforço (estimativa):** 2 a 3 semanas. **Risco:** verificação do ecrã de consentimento da Google (o scope `drive.appdata` é não sensível, o que ajuda) e o IVA/faturação.

### Fase 2: colaboração em tempo real e papéis de acesso
Âmbito:
- **Sala = lobby + mesa.** O dono carrega em "Colaborar", cria uma sala e recebe uma **ligação de colaboração**. Quem entra passa pelo lobby (nome, ou nome da conta Google) e senta-se à mesa.
- **Presença:** cursor colorido com o nome, forma selecionada de cada pessoa, lista de quem está lá.
- **Sincronização com um servidor autoritativo.** O servidor ordena operações simples sobre o JSON do diagrama (`setCampo`, `adicionar`, `apagar`, `mover`) e difunde-as. Como o modelo é plano e por ids, **não é preciso CRDT** nesta fase: bloqueia-se por forma (quem a está a editar) e o último a escrever ganha por campo. Reavalia-se (Yjs) se aparecerem conflitos reais.
- Desfazer/refazer **por utilizador** (hoje é por snapshot do documento inteiro e teria de mudar).
- **Papéis, aplicados no servidor:** *team member* (ler e escrever) e *reviewer* (só ler). Cada sala tem duas ligações, uma por papel, que o dono pode renovar para revogar.
- Persistência da sala: o servidor guarda o último estado (volume ou SQLite) durante um prazo definido, para a ligação abrir depois; o dono pode "guardar no meu Drive".
- Limites por plano: lugares de escrita (preço por *team member*; *reviewers* gratuitos), salas ativas.

Reaproveita as salas, sessões e reconexão do `bitnik-platform`.
**Esforço:** 4 a 6 semanas, a fase mais difícil. **Risco:** desfazer por utilizador, conflitos ao mover lanes (levam as formas), reconexão e latência.

### Fase 3: comentários
Âmbito:
- Comentário ancorado a uma forma, seta, lane ou ponto do quadro; conversa (respostas), resolver e reabrir; contador por forma.
- Guardados no documento (`comments[]`), sincronizados na sala e incluídos na exportação JSON e na ligação.
- Notificação dentro da app para quem foi mencionado (sem email nesta fase).
- *Reviewer* **pode comentar mas não editar** (a decisão é tua, ver abaixo).

**Esforço:** 2 a 3 semanas.

### Fase 4: lançamento das Equipas
- Preços e limites (sugestão: preço por *team member*, *reviewers* gratuitos), página de preços, termos e política de privacidade.
- Email aos inscritos na lista de espera, avisando do lançamento.
- Monitorização, cópias de segurança do servidor, suporte básico.
- Pequena documentação de equipa (como convidar, papéis, comentários).

### Premium (só para pensar, fora de âmbito)
É o mesmo produto, com os dados do lado do cliente:
- **Gravação na infraestrutura do cliente:** o adaptador `Storage` ganha um destino que aponta para o servidor deles.
- **Colaboração só na rede interna:** o servidor de salas empacotado (Docker, um só processo) corre na rede deles, sem sair para a internet.
- Autenticação por **SSO (OIDC/SAML)** em vez de Google.

**O que preservar desde já para não fechar esta porta:** o `Storage` abstrato (Fase 1), a autenticação atrás de uma interface (Google hoje, OIDC amanhã), o servidor sem dependências de serviços externos (só `ws` e um volume) e a configuração por variáveis de ambiente.

## Decisões em aberto (precisas antes da Fase 2)

1. **Persistência das salas:** quanto tempo guarda o servidor um diagrama colaborativo (30 dias? enquanto a subscrição estiver ativa?) e o que acontece ao cancelar o plano.
2. **Quem paga o lugar:** só quem escreve (team member) ou também quem comenta (reviewer)? Recomendo: reviewers gratuitos, comentam, não editam.
3. **Convidar por ligação ou por email:** a ligação por papel é o mais simples; o convite por email (lista de pessoas autorizadas) só se for pedido.
4. **Identidade de quem entra pela ligação:** exigir conta Google ou aceitar apenas um nome? Aceitar só nome é mais fácil, mas perde-se rasto de quem fez o quê.
5. **Licença:** o editor atual fica MIT (já publicado). **O servidor das Equipas e do Premium nasce num repositório privado desde o primeiro commit**, e só depois se decide se e como o abrir (por exemplo FSL, que passa a MIT ao fim de 2 anos). Até lá, a landing não faz promessas sobre a licença de nada além do editor.

## Marcos de decisão

| Marco | Pergunta | Se a resposta for não |
|---|---|---|
| Fim da Fase 0 | Há procura medida na lista de espera? | Não construir contas; melhorar o Free e a mensagem |
| Fim da Fase 1 | Alguém paga só por gravar na conta Google? | Ainda assim avançar para colaboração, que é o motivo principal; rever o preço |
| Fim da Fase 2 | Equipas usam as salas de forma recorrente? | Parar antes dos comentários e ouvir os utilizadores |

## Estimativa total

Fases 1 a 4: **cerca de 10 a 15 semanas** de trabalho contínuo, com a Fase 2 a pesar mais de um terço. Sem a Fase 0 concluída, nenhuma destas semanas deve ser gasta.

## Avaliação de 2026-11-04: próximos passos e como rentabilizar

**Ponto de partida.** O Free está completo e entretanto ganhou imagens coladas, labels de setas arrastáveis, colar no cursor e auto-scroll ao ligar setas. Ainda não há audiência, não há medição de visitas e a lista de espera está ligada mas sem tráfego. Por isso o plano das Fases 1 a 4 (10 a 15 semanas) está **prematuro**: a Fase 0 do próprio roadmap diz que nenhuma dessas semanas se gasta sem procura medida.

### Onde estão as probabilidades de dinheiro
| Via | Esforço | Receita realista | Comentário |
|---|---|---|---|
| **Equipas** (conta Google + colaboração + comentários) | 10-15 semanas | Média/alta, mas só com utilizadores | Faz sentido **depois** de haver uso recorrente. É o plano atual. |
| **Pro individual** barato (gravar na conta Google, exportar PNG/SVG sem marca, histórico de versões) | 2-3 semanas (Fase 1) | Baixa/média | Mais rápido de lançar do que colaboração; testa se alguém paga. |
| **Serviço de IA** (resumir/documentar o fluxo com IA a partir do texto compacto) | 1-2 semanas, mas tem custo por chamada | Média | É o diferencial do produto ("o fluxo vira documentação"). Cobrar por créditos ou dentro do Pro. O modo "prompt copiável" atual é o Free. |
| **Embed / white-label** para docs e blogs (o editor já funciona em `EMBED`) | 1-2 semanas | Baixa | Boa para distribuição, fraca para receita direta. |
| **Serviços**: workshops e mapeamento de processos para empresas, usando o Diagramico | 0 (só tempo) | **Imediata**, mas não escala | Ganha dinheiro e dá clientes e feedback já, antes de qualquer fase técnica. |
| **Premium** (infraestrutura do cliente, SSO) | Grande | Alta por cliente, ciclo longo | Só com procura explícita de uma empresa. Fora de âmbito. |

### Recomendação (por ordem)
1. **Distribuição e medição primeiro (2-3 semanas, quase só marketing):**
   - Instalar analítica sem cookies (GoatCounter/Plausible) na landing e na app, com os eventos: abrir a app, primeiro diagrama, exportar texto IA, inscrição na lista.
   - Publicar no Show HN, Product Hunt, r/ProductManagement, r/sysadmin, comunidades de BPMN e de documentação com IA, e LinkedIn em PT. Mensagem única: *"desenha o fluxo, a IA escreve a documentação"*.
   - 3 a 5 artigos/tutoriais curtos com GIFs (já existem `assets/flow-pt.gif` e `flow-en.gif`) e exemplos prontos de fluxos que as pessoas pesquisam (onboarding, aprovações, tickets).
   - Verificar SEO básico: título/descrição já existem; falta `og:image`, sitemap e uma página por caso de uso.
2. **Medir o critério da Fase 0:** 50 emails ou 5% das visitas únicas. Sem isso, não construir contas.
3. **Em paralelo, 1 a 2 conversas por semana com utilizadores** (quem usa e para quê). Perguntar o que pagariam e quanto.
4. **Se houver sinal:** lançar o **Pro individual (Fase 1)** antes das Equipas, com cobrança por Stripe e gravação na conta Google. É o teste mais barato de disposição para pagar. Preço de partida a validar: 4 a 6 EUR/mês ou 40 a 50 EUR/ano.
5. **Só depois** colaboração e comentários (Fases 2 e 3), com preço por *team member* e *reviewers* gratuitos.

### O que não fazer já
- Construir colaboração em tempo real sem utilizadores recorrentes.
- Esforço em Premium/SSO sem uma empresa a pedir.
- Mexer na licença do editor (continua MIT; servidor das Equipas privado desde o primeiro commit).

### Riscos
- **Concorrência forte e gratuita** (draw.io, Excalidraw, Mermaid Live, Lucidchart, Miro). O diferencial tem de ser o fluxo "diagrama → texto compacto → IA" e a rapidez com teclado, não "mais um editor".
- **Custo e abuso** do modo IA se for alojado: limitar por conta e por dia.
- **IVA e faturação** (Stripe Tax) desde o primeiro pagamento.
- **Privacidade:** a promessa "os dados ficam no browser" deve continuar verdadeira no Free; imagens coladas ficam no diagrama (localStorage e ligações), o que aumenta o tamanho dos links partilhados.

### Plano de 30 dias
| Semana | Foco | Saída |
|---|---|---|
| 1 | Analítica, `og:image`, sitemap, página de preços honesta ("Equipas em preparação") | Visitas e eventos medidos. **Feito no código em 2026-11-12**; falta publicar e definir `STATS_KEY` |
| 2 | 3 tutoriais + lançamento em 2 comunidades | Primeiros utilizadores e inscrições. **Guias feitos em 2026-11-12** (`/guides/pt/`, `/guides/en/`); posts redigidos em `docs/LANCAMENTO.md`, **por publicar** |
| 3 | 5 conversas com utilizadores; corrigir o que bloquear o primeiro diagrama | Lista de dores e do que pagariam |
| 4 | Decisão: ≥ marco da Fase 0? Sim: arrancar Pro (Fase 1). Não: iterar na mensagem e canais | Decisão registada neste ficheiro |

### Decisões que preciso de ti
1. **Objetivo de receita:** rendimento complementar rápido (então, serviços e Pro) ou construir um produto de equipas a prazo?
2. **Tempo semanal** disponível, porque define se o Pro (2-3 semanas) ou as Equipas (10-15) são realistas.
3. **Mercado:** PT/EU primeiro ou global em inglês? Condiciona canais, preço e IVA.
