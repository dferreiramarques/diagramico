# Roadmap do Diagramico

Estado em 2026-10-13. A versão pública e simplificada (NOW / NEXT / LATER) está na landing, na secção Roadmap; esta é a versão completa. As datas e os esforços são estimativas de uma pessoa a trabalhar sozinha, para ordenar o trabalho, não compromissos.

## Os três níveis

| | **Free** (feito) | **Equipas** (pago) | **Premium** (pago, fora de âmbito por agora) |
|---|---|---|---|
| Desenhar, alinhar, lanes coladas, decisões BPMN | ✔ | ✔ | ✔ |
| Exportar: texto IA, Mermaid, SVG, PNG, JSON, ligação `#d=` | ✔ | ✔ | ✔ |
| Importar: draw.io, Visio, texto IA, Mermaid | ✔ | ✔ | ✔ |
| Gravação | Só no browser (`localStorage`) | **Na conta Google** do utilizador | **Na infraestrutura do cliente** |
| Colaboração em tempo real (lobby + mesa, cursor colorido com nome) | — | ✔ | Só na rede interna |
| Comentários | — | ✔ | ✔ |
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
- Ligar a lista de espera (falta o URL do formulário), com aviso de RGPD e consentimento.
- Medir visitas sem cookies (Plausible ou GoatCounter).
- Rever o texto "equipas" da landing para listar as funcionalidades pagas acima, sem prometer datas.
- Decidir a licença (a MIT permite copiar e vender o código).
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
5. **Licença:** com um produto pago, a MIT deixa de fazer sentido para o código do servidor. Decidir antes da Fase 1.

## Marcos de decisão

| Marco | Pergunta | Se a resposta for não |
|---|---|---|
| Fim da Fase 0 | Há procura medida na lista de espera? | Não construir contas; melhorar o Free e a mensagem |
| Fim da Fase 1 | Alguém paga só por gravar na conta Google? | Ainda assim avançar para colaboração, que é o motivo principal; rever o preço |
| Fim da Fase 2 | Equipas usam as salas de forma recorrente? | Parar antes dos comentários e ouvir os utilizadores |

## Estimativa total

Fases 1 a 4: **cerca de 10 a 15 semanas** de trabalho contínuo, com a Fase 2 a pesar mais de um terço. Sem a Fase 0 concluída, nenhuma destas semanas deve ser gasta.
