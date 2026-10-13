# Diagramico: contribuições humanas e contribuições de IA

Documento de apoio, escrito por Claude (a IA) com base **apenas** em duas conversas e no histórico do Git:

- a **conversa de partida**, no Claude (modo Cowork, ligada ao projeto Claude "Diagramico"), de 2026-10-09, onde nasceram a primeira versão do editor, o `README.md` e o `LICENSE`;
- a **conversa de trabalho**, com o Claude Code, de 2026-10-09 a 2026-10-13.

Versão final, fechada a 2026-10-13. Documentos relacionados: [`BOAS-PRATICAS-AUTORIA.md`](BOAS-PRATICAS-AUTORIA.md) (como trabalhar daqui para a frente) e [`PROMPT-SEGMENTACAO-AUTORIA.md`](PROMPT-SEGMENTACAO-AUTORIA.md) (como produzir este documento noutros projetos).

**Não é aconselhamento jurídico.** Serve para organizar provas e levar a um advogado, que decidirá o que conta para efeitos de direitos de autor na tua jurisdição.

## Limites do que aqui se afirma

- **Cada capítulo só cobre a sua conversa.** O capítulo "Ponto de partida" foi escrito pela IA da conversa de partida, a partir do que lá está. Os capítulos 1 a 4 foram escritos pela IA da conversa de trabalho. Nenhuma das duas vê o que aconteceu fora da sua conversa: testes que fizeste sozinho, conversas com outras pessoas, outras sessões de IA.
- **O ponto de partida ficou documentado**, com uma exceção: o commit `d991f4c` (2026-10-09, 22:07), que acrescentou `docs/ARQUITETURA.md` e `.nojekyll`. O `ARQUITETURA.md` não foi produzido na conversa de partida e a sua origem não consta em nenhuma das duas.
- **Os papéis dividem-se sem fronteiras limpas.** Quase tudo resultou de um diálogo: pediste ou decidiste, a IA propôs, implementou e mostrou, tu aprovaste, corrigiste ou rejeitaste. As tabelas indicam **quem originou** cada coisa; o texto diz quando foi decidido em conjunto.
- **Não se atribuem percentagens.** Não há medida honesta do "quanto" de cada um.
- **Modelos de IA.** A conversa de partida estava configurada para o modelo `claude-opus-5-5` (o modelo que respondeu em cada momento pode ter variado). A conversa de trabalho, segundo os commits, usou Claude Sonnet 5.5.

## Cronologia

| Data e hora (Lisboa) | O que aconteceu | Onde |
|---|---|---|
| Antes de 2026-10-09 | Já existia um projeto Claude chamado "Diagramico", ao qual a conversa de partida estava ligada (sem documentos) | claude.ai |
| 2026-10-09, início da tarde | David descreve o MVP. A IA constrói a 1.ª versão e publica-a como artefacto privado no claude.ai (versão 1). Esta versão não chegou ao Git | Conversa de partida |
| 2026-10-09, cerca das 15:20 | David pede modo claro/escuro e um zip para o GitHub. A IA entrega a versão 2 e o zip | Conversa de partida |
| 2026-10-09, 15:25 | Commit `7f1dfc3` "Add files via upload" (versão com tema e botão "Exportar imagem") | GitHub, por David |
| 2026-10-09, cerca das 15:38 | David pede o botão "Exportar" e a opção de inglês. A IA entrega a versão 3 e um novo zip | Conversa de partida |
| 2026-10-09, 15:40 | Commit `e357913` "Add files via upload" (versão com PT/EN e botão único "Exportar") | GitHub, por David |
| 2026-10-09, cerca das 15:53 | David pede importação do draw.io e do Visio com aviso de incompatibilidades. A IA entrega a versão 4 e um novo zip | Conversa de partida |
| 2026-10-09, 15:55 | Commit `a81fd79` "Add files via upload". O `index.html` é **idêntico byte a byte** ao da versão 4 entregue (verificado pela IA) | GitHub, por David |
| 2026-10-09, 22:07 | Commit `d991f4c` "d": `docs/ARQUITETURA.md` e `.nojekyll` | Origem não consta nas conversas |
| 2026-10-09, 22:15 | Commit `5796afb`: primeiro trabalho da conversa de trabalho | Conversa de trabalho |
| 2026-10-09, depois das 22:15 | Na conversa de partida, David pergunta pelo estado e se o repositório tem a última versão. A IA verifica que o repositório está à frente da sua cópia, mas não altera nada | Conversa de partida |
| 2026-10-09 a 2026-10-13 | 23 commits de `5796afb` a `c47fb02` (o último às 12:51 de 2026-10-13, revisão de segurança) | Conversa de trabalho |
| 2026-10-13 | David pede este documento, discute com a IA o valor do seu papel (capítulo 7), decide publicá-lo em `docs/` no repositório público e pede o guia de boas práticas e o prompt reutilizável | Conversa de partida |

## Como se divide o trabalho

| Quem | O que fez em geral |
|---|---|
| **David** | Exerceu a **direção de produto e de design** (ver capítulo 7). Especificou o MVP (objetivo, formas, tipografia, comportamento das caixas, swimlanes, persistência, interação ao estilo Miro); definiu o produto, a estratégia, o público, o posicionamento, os planos pagos e as regras de comportamento da interface; decidiu entre alternativas; testou o resultado e corrigiu a direção; publicou no GitHub; geriu a infraestrutura (domínio, DNS, Railway) |
| **IA (Claude)** | Escreveu o código e os textos (incluindo a 1.ª versão do editor, o README e o LICENSE), desenhou o formato de texto para IA, propôs alternativas técnicas e de produto, fez análises e testes, gerou os GIFs e a documentação |

---

## 0. Ponto de partida (2026-10-09, conversa de partida)

### 0.1 Decisões, ideias e design de produto (origem: David)

| Tema | A decisão ou ideia |
|---|---|
| Nome | A conversa estava ligada a um projeto Claude já chamado **"Diagramico"** antes da primeira mensagem. A conversa não mostra quem escolheu o nome nem quando |
| Objetivo | Uma aplicação para **desenhar diagramas lógicos e user flows**, cujo resultado possa ser uma **imagem** ou um **texto para ser digerido por IA como documentação e explicação de lógica** |
| Formato para IA | "Não tem que ser JSON, vê o melhor formato." Requisito: a IA tem de o entender e o formato deve **consumir menos tokens**. A escolha concreta foi delegada à IA (ver 0.3) |
| Caixas e texto | Caixa para ações do utilizador; o **tamanho da caixa ajusta-se à quantidade de texto**; para ter uma caixa maior, **aumenta-se o tamanho de letra**, sem redimensionar à mão |
| Tipografia | **IBM Plex Sans**, e a **versão de consola (IBM Plex Mono) para as notas**; estilos **regular, negrito e itálico** |
| Eventos | **Círculos para eventos**: início, fim, pausa e mudança de swimlane |
| Swimlanes | **Swimlanes para pessoas, equipas e departamentos** |
| Ações | **"Trapézio inclinado" para ações**, "o mesmo que no desenho de diagramas" |
| Outras formas | Documentos, dados, processos: "vê a melhor maneira" (delegado à IA) |
| Notação | "Podes seguir a BPMN 2.0", mas como **ferramenta mais simplificada**: para já, **o mínimo que explique utilizadores a interagir com uma ferramenta** |
| Plataforma | **Webapp** com gestão de portfólio por utilizador. No MVP: **um só utilizador**, sempre aberta, a **gravar no localStorage ou num pacote de cópia de segurança**. Gestão de portfólio e **partilha em equipa ficam para depois do MVP** |
| Interação | **Gráficos fluidos, semelhantes ao Miro** no controlo das formas e do diagrama; **quadro branco infinito** |
| Tema | Pediu a **opção de modo escuro e modo claro** |
| Distribuição | Pediu **um zip para colocar no GitHub**. Depois **carregou ele próprio** os ficheiros no repositório (commits `7f1dfc3`, `e357913`, `a81fd79`) |
| Botão de exportação | Pediu que o botão "Texto para IA" passasse a dizer só **"Exportar"** |
| Idioma | Pediu a **possibilidade de mudar para inglês** |
| Importação | Perguntou se era possível importar do **draw.io e do Lucidchart** com uma **conversão literal**. Depois decidiu: **botões "Importar do draw.io" e "Importar do Visio"** e, **ao clicar, um aviso sobre as incompatibilidades que podem surgir e como resolvê-las** |
| Verificação | Perguntou se a versão remota no repositório era a mais recente |

**Correções e rejeições.** Nesta conversa, David **não corrigiu nem rejeitou** nada do que a IA entregou. A única avaliação explícita foi "está óptimo", antes de pedir as alterações seguintes. Também não consta que tenha enviado capturas de ecrã ou relatado erros nesta conversa.

### 0.2 Trabalho da IA

| Área | O que a IA fez |
|---|---|
| Arquitetura | Aplicação num **único ficheiro HTML**, sem dependências, com desenho em **Canvas 2D** e um motor próprio de paginação de texto (quebra de linha, medição, negrito e itálico dentro do texto) |
| Formas | Interpretou o "trapézio inclinado" como **paralelogramo** (Ação do utilizador) e criou o conjunto de formas: Passo/processo (retângulo arredondado), Decisão (losango), **Ecrã/interface** (forma acrescentada por iniciativa da IA, para user flows), Documento (base ondulada), Dados (cilindro), Nota (canto dobrado, em Plex Mono). Desenhou os ícones dos eventos (barras de pausa, setas de mudança de lane) e as cores por defeito de cada evento |
| Texto | Regras de tamanho automático (larguras máximas, margens, tamanhos mínimos), escala de tamanhos de letra, atalhos `[` `]`, **markdown dentro do texto** (`**negrito**`, `*itálico*`) e Ctrl B / Ctrl I |
| Ligações | Conectores em cotovelo, retos e curvos; escolha automática dos lados; modos de percurso (horizontal→vertical, vertical→horizontal, Z); rótulos, setas (fim, ambas, nenhuma) e tracejado. **Pontos laterais**: arrastar para ligar, clicar para criar a forma seguinte; `Tab` para o mesmo efeito |
| Edição | Seleção e seleção por área, **guias de alinhamento automático**, desfazer/refazer, copiar/colar/duplicar, barra de opções contextual, paleta de 7 cores, zoom, deslocamento, pinça em ecrãs táteis, atalhos de teclado e painel de ajuda |
| Swimlanes | Lanes como elementos independentes empilháveis; a forma pertence à lane onde está o seu centro; mover a lane leva o conteúdo; redimensionar; "adicionar lane por baixo"; tipos **pessoa, equipa, departamento** (pedidos por David) e **sistema** (acrescentado pela IA) |
| Formato de texto para IA | Desenhou o formato (secções `DIAGRAM`, `SYNTAX`, `LANES`, `NODES`, `FLOW`, `NOTES`; IDs com o prefixo da lane; tipos em inglês; sequências lineares encadeadas numa linha; ordem do fluxo a partir dos eventos de início) e a estimativa de tokens |
| Outras exportações | **Mermaid** (por iniciativa da IA), JSON completo e PNG (1×/2×/3×, fundo transparente, só a seleção) |
| Persistência | Gravação automática no localStorage, **lista simples de diagramas** (novo, duplicar, apagar com confirmação), cópia de segurança e importação em JSON. A lista foi uma escolha da IA, já que o portfólio tinha ficado para depois do MVP |
| Design visual | Paleta e tokens de cor para claro e escuro, disposição das barras, ícones SVG, marca tipográfica "Diagram**ico**", diagrama de exemplo ("Compra na loja online", em PT e EN) |
| Tema | Três estados (automático, claro, escuro) e atalho `Shift T`. O estado "automático" foi acrescentado pela IA |
| Idioma | Dicionário PT/EN de toda a interface, deteção da língua do browser e atalho `Shift L`. Decisão da IA: o texto para IA usa sempre palavras-chave em inglês, incluindo os tipos de lane |
| Botão Exportar | Além de mudar o nome, a IA **retirou o botão separado "Exportar imagem"** e passou o PNG para um separador da mesma janela. Explicou a mudança na resposta |
| Pacote para o GitHub | `index.html`, `README.md` (em português), **`LICENSE` MIT com "Copyright (c) 2026 David Ferreira Marques"** (a escolha da MIT foi da IA, com a nota "troca-a se preferires") e `.nojekyll` |
| Importação do draw.io | Leitor de XML do draw.io (comprimido ou não; várias páginas), correspondência de estilos para formas, conversão de HTML para negrito e itálico, pools desfeitas, lanes, ligações com rótulos, setas e tracejado |
| Importação do Visio | Leitor de `.vsdx` com descompressão de zip própria; reconhecimento pelo nome do stencil ou pela geometria (losango, paralelogramo, elipse); ligações pelos conectores colados às formas |
| Regras de conversão | Rotação de 90° quando as lanes são verticais; deteção de início/fim pelo texto; adivinhação do tipo de lane pelo nome; formas sem equivalente passam a Passo e ficam selecionadas; relatório no fim; importação por arrastar e largar o ficheiro (acrescentada pela IA) |
| Textos do aviso | O conteúdo dos avisos de incompatibilidade e das soluções, em PT e EN, foi redigido pela IA (o pedido do aviso foi de David) |
| Análises | Explicação do que é o Mermaid; análise de viabilidade da importação do draw.io e do Lucidchart, com pesquisa na web (comunidade e ajuda da Lucid); resumo de estado; comparação entre o repositório e as cópias da IA |
| Testes | Testes automáticos num browser sem interface, com capturas de ecrã, e ficheiros de teste sintéticos (draw.io simples, comprimido e com lanes verticais; `.vsdx` construído à mão; ficheiro corrompido). A IA encontrou e corrigiu os seus próprios erros: janelas que não fechavam, Escape a apagar a seleção, uma variável que anulava a tradução, ordem do fluxo no texto para IA, sobreposição de setas, deteção de elipses e plurais nos relatórios |
| Publicação | Artefacto privado no claude.ai (versões 1 a 4); cópias do código e de notas técnicas guardadas no projeto Claude "Diagramico" |

### 0.3 Propostas da IA que David aprovou (decisão conjunta)

Nestes casos, **a ideia foi da IA e a decisão foi de David**. Em quase todos, a aprovação foi tácita: David continuou a pedir alterações sobre a versão entregue, sem contestar.

- **Formato de texto compacto em vez de JSON.** David delegou a escolha ("vê o melhor formato"); a IA desenhou-o; David manteve-o.
- **Exportação para Mermaid.** Acrescentada pela IA. David perguntou o que era e manteve-a.
- **Paralelogramo para "trapézio inclinado", a forma Ecrã e o tipo de lane "sistema".**
- **Lista simples de diagramas já no MVP.**
- **Licença MIT** em nome de David.
- **Terceiro estado de tema "automático"** e atalhos `Shift T` e `Shift L`.
- **Fundir os botões de exportação num só**, retirando "Exportar imagem".
- **Lucidchart através do Visio (.vsdx).** A IA explicou que o Lucidchart não tem formato aberto próprio e sugeriu a exportação para Visio. **David decidiu** criar o botão "Importar do Visio" em vez de um importador do Lucidchart, e um segundo botão para o draw.io.

Propostas que **não foram seguidas nesta conversa**:

- Importar texto para IA e Mermaid: foi feito mais tarde, na conversa de trabalho (`db8b4ff`).
- Enviar ficheiros reais do trabalho para testar a importação.
- Atualizar o artefacto e o projeto Claude com a versão do repositório.

### 0.4 Limites do que a IA da conversa de partida sabe

- **O que David fez fora da conversa não consta:** como testou cada versão, se editou ficheiros antes de os carregar, e quem escolheu o nome "Diagramico".
- **Ficheiros carregados no GitHub.**
  - O `index.html` de `a81fd79` é idêntico ao entregue (verificado).
  - Para `7f1dfc3` e `e357913`, a IA só confirmou que têm as funcionalidades das versões 2 e 3. Não comparou byte a byte, porque já não tinha essas versões guardadas.
  - O `.nojekyll` vinha nos zips, mas só aparece no Git em `d991f4c`.
- **A versão 1** (antes do tema) existe apenas no histórico do artefacto no claude.ai, não no Git.
- **Não consta nesta conversa:** posicionamento comercial, concorrentes, planos pagos, domínio, landing page, `docs/ARQUITETURA.md`. Tudo isso pertence à conversa de trabalho ou a outro sítio.
- As horas da cronologia antes dos commits são aproximadas, deduzidas das datas dos ficheiros gerados pela IA.

---

## 1. Decisões de produto, estratégia e design (conversa de trabalho; origem: David)

| Tema | A decisão ou ideia |
|---|---|
| Posicionamento | A ferramenta é para **desenhar com facilidade e depois enviar a uma IA para servir de documentação**; o BPMN é só inspiração, não convenção. Pediu para reforçar essa mensagem no site e **recusou** dizer "segue a norma BPMN 2.0". Contra concorrentes, o diferencial é o **fluxo de desenho e o aspeto visual** (apontou o "feeling PowerPoint" do Excalidraw, o fluxo fraco e o aspeto do draw.io) |
| Intenção comercial | Quer tornar o Diagramico um produto comercial; levantou o paralelo com o Miro |
| Setas | Setas da mesma origem juntam-se; origens diferentes da caixa criam setas distintas, sem as fundir. **Setas soltas**, sem ligação a formas. Ao ligar, o destino também mostra os pontos laterais (a origem e o destino escolhem o lado), com ligação em **U invertido** quando os dois lados são o de cima |
| Decisão | Losango **regular** (diagonais iguais), mais pequeno. Tipos de decisão BPMN (exclusiva, paralela…), escolhidos num **dropdown como os eventos de início e fim**, e não por botão direito |
| Layout | Reconheceu que o auto-layout em camadas não servia (puxava os eventos para a esquerda) e **mudou o requisito** para um simples alinhamento à grelha com **referências relativas às caixas**, sem layout complexo |
| Lanes coladas | Especificou **por inteiro** o comportamento: "+" em cima e em baixo nos cantos direitos de uma lane selecionada; lanes coladas mostram uma **corrente** nos cantos de ligação; duas lanes que colidem ficam coladas e **a que se move herda as propriedades da que já estava**; clicar na corrente afasta 10 px para cima ou para baixo consoante a relação |
| Partilha | Ideia de **guardar o diagrama no URL** (como o Mermaid Live), sem conta nem armazenamento; decidiu que **basta gerar a ligação em Exportar → Ligação** e não é preciso ser "viva" |
| Telemóvel | Avisar que a app **não funciona em telemóvel**, **excluindo os tablets** |
| Planos | **Free:** o que já existe. **Pago (Equipas):** gravar na conta Google ("como no Taskboards"), colaboração em tempo real ("como na bitnik-platform", um diagrama que é lobby e mesa, ligação de colaboração, cursor colorido com o nome), comentários, acessos de membro (ler e escrever) e revisor (só ler). **Premium:** o mesmo, mas gravação na infraestrutura do cliente e colaboração só na rede interna (fora de âmbito por agora) |
| Roadmap público | Pediu uma vista simplificada, em colunas **NOW / NEXT / LATER**, como um quadro Kanban |
| Licença e abertura | Levantou a questão de o Premium poder ficar **obsoleto** por o editor ser aberto; decidiu **seguir** as recomendações (servidor privado desde o início) e **omitir da FAQ** qualquer menção a licenças de Equipas e Premium |
| Exemplo no site | Pediu um caso com **dois diagramas simples, uma pergunta sobre a documentação e a resposta**, simulando um assistente de suporte |
| Demonstrações | Pediu um **GIF animado** do desenho, e que incluísse o **Exportar** ("é um highlight da ferramenta") e o **alinhamento à grelha** |
| Infraestrutura | Registou o domínio, criou os registos DNS no cPanel e o serviço no Railway |

## 2. Testes e correções dirigidas por David (conversa de trabalho)

Detetou e comunicou, com capturas de ecrã: o conflito entre o ponto de ligação e a ponta da seta, o losango deformado, o menu do botão direito que abria o do browser, os botões `?` e da visita desalinhados, o ícone de corrente a azul em vez de cinza claro, a pré-visualização do PNG partida, o Mermaid exportado com setas aparentemente invertidas (por reproduzir) e o aviso "not secure" no domínio. Cada um mudou o resultado final.

## 3. Trabalho da IA (conversa de trabalho)

| Área | O que a IA fez |
|---|---|
| Visita guiada, ajuda, README e documentação técnica | Redação e implementação; análise inicial do projeto |
| Exportação SVG | Gravador mínimo da API Canvas 2D que reutiliza o código de desenho do ecrã |
| Importação de texto IA e Mermaid | Os dois analisadores e a construção do diagrama |
| Modelo de setas | Extremidades soltas, lados forçados, tronco partilhado, forma em U |
| Gateways BPMN | A escolha dos quatro tipos (exclusivo, paralelo, inclusivo, complexo), os símbolos e o texto por baixo da forma |
| Alinhamento à grelha | Algoritmo (linhas por lane, colunas globais, tolerância de 24 px, arredondamento a 10 px) e o layout em camadas, hoje usado só na importação |
| Lanes coladas | Implementação da especificação de David |
| Ligação `#d=` | Formato (JSON sem valores por defeito, deflate, base64url), validação e abertura |
| Landing page | Estrutura, textos PT/EN, planos, roadmap público, FAQ, modo embebido da demo, exemplo do assistente de suporte (**a resposta do assistente foi escrita pela IA**, como o site diz) |
| GIFs | Guião de gravação, composição, codificação e ligação ao site |
| Análise e conselho | Comparações (Miro, Excalidraw, draw.io), riscos, opções de licença, estimativas, roadmap interno e a primeira versão deste documento |
| Segurança | **Pedida por David** (perguntou se há falhas que ponham em risco utilizadores e dados). A IA fez a revisão, encontrou e corrigiu falhas de validação e a pré-visualização partida sob a política do Railway, e escreveu `docs/SEGURANCA.md` |
| Verificação | Testes no browser, geração de 60 diagramas aleatórios para o Mermaid, medições e correção dos bugs que David reportou |

## 4. Propostas da IA que David aprovou (conversa de trabalho; decisão conjunta)

A IA propôs, e David aceitou ou deixou seguir:

- a ordem do plano (landing antes de base de produto);
- o atalho `Shift A`;
- a tolerância do alinhamento;
- os cinco passos da visita guiada;
- a estrutura do roadmap por fases;
- o princípio de que o Free fica sem conta e as funcionalidades pagas só acrescentam;
- a recomendação de manter o servidor num repositório privado (que ele adotou, alterando o texto da FAQ);
- a escolha de reaproveitar o `bitnik-platform` e o `taskboards` nas fases 1 e 2.

Nestes casos, **a ideia foi da IA e a decisão foi de David**; o valor de David está na escolha, não na ideia.

## 5. Como o Git regista isto

Os commits do ponto de partida (`7f1dfc3`, `e357913`, `a81fd79`, `d991f4c`) têm como autor "David Marques" e **não contêm** indicação de coautoria da IA. Os três primeiros foram feitos com "Add files via upload", a partir dos zips entregues na conversa de partida. Os 23 commits entre `5796afb` e `c47fb02` têm como autor "David Marques" e, na mensagem, `Co-Authored-By: Claude Sonnet 5.5`; ou seja, o próprio histórico declara a participação da IA a partir daí. Datas: 9 a 13 de outubro de 2026.

| Commit | O que entrou |
|---|---|
| `7f1dfc3` | Ponto de partida: 1.ª versão no Git (editor, tema claro/escuro, botões "Exportar imagem" e "Texto para IA"), `README.md`, `LICENSE` MIT. Feito na conversa de partida |
| `e357913` | Ponto de partida: interface PT/EN e botão único "Exportar". Feito na conversa de partida |
| `a81fd79` | Ponto de partida: importação do draw.io e do Visio, avisos e relatório. `index.html` idêntico ao entregue na conversa de partida |
| `d991f4c` | `docs/ARQUITETURA.md` e `.nojekyll`. Origem do `ARQUITETURA.md` não consta em nenhuma das conversas |
| `5796afb` | Visita guiada, layout automático, várias setas por forma, setas soltas |
| `c947e64` | Exportação SVG, aviso para telemóvel |
| `db8b4ff` | Importar texto IA e Mermaid |
| `ce8ac07` | Landing page, app movida para `/app`, modo embebido |
| `2e50a67` | Lado de destino ao ligar, setas em U |
| `5e9e934`, `6fe7991` | Losango regular e tipos de decisão BPMN (menu, depois dropdown) |
| `62a6d4b`, `24f1dab` | Posicionamento BPMN e "desenha o fluxo, a IA escreve a documentação" |
| `f3156ea` | Exemplo do assistente de suporte |
| `a4ea746`, `f97a639` | Lanes coladas e cor das correntes |
| `360edac`, `a5fb208` | Botões alinhados, correção da pré-visualização |
| `d0d6f9d` | Alinhar à grelha |
| `655ee84` | Partilha por ligação |
| `89099f4`, `0ff3846`, `2e7df36` | GIFs |
| `f697385`, `2d052ad`, `67cd75f` | Roadmap, planos e FAQ |
| `c47fb02` | Revisão de segurança: validação dos dados importados, limite à descompressão, Mermaid escapado, CSP, pré-visualização corrigida; `docs/SEGURANCA.md` |
| (este commit) | `docs/AUTORIA.md`, `docs/BOAS-PRATICAS-AUTORIA.md`, `docs/PROMPT-SEGMENTACAO-AUTORIA.md` |

## 6. O que fazer com isto

1. **Guardar as duas conversas completas** fora do repositório. São a prova mais forte de quem decidiu o quê.
2. **Guardar o histórico do artefacto no claude.ai** (versões 1 a 4). A versão 1 só existe aí.
3. **Esclarecer a origem de `docs/ARQUITETURA.md`** (commit `d991f4c`).
4. **Seguir o guia** [`BOAS-PRATICAS-AUTORIA.md`](BOAS-PRATICAS-AUTORIA.md) nas próximas iterações: registar as decisões com data, pedir alternativas e escolher, manter uma única fonte de verdade.
5. **Levar a um advogado** com este documento, o `LICENSE`, o histórico do Git e as conversas. Perguntas úteis: a proteção das partes escritas por IA na tua jurisdição, o registo da marca "Diagramico" e o texto da licença para o servidor privado.
6. **Publicação.** David decidiu, a 2026-10-13, publicar este documento em `docs/` no repositório público, em vez de o manter na pasta `private/`.

## 7. Papéis: como descrever a contribuição de David

Análise feita pela IA na conversa de partida, a 2026-10-13, a pedido de David, que concordou com a conclusão ("ok cool").

### 7.1 O teste do pedido genérico

A pergunta foi: o que faria a IA se alguém pedisse apenas "faz uma ferramenta HTML de diagramas"?

| Com o pedido genérico | Só existe por causa dos inputs de David |
|---|---|
| Quadro com zoom e deslocamento, seleção, desfazer | **O propósito**: o resultado é para uma IA ler como documentação, com poucos tokens. Obrigou a guardar **significado** (tipo de passo, lane, ramo da decisão) em vez de só geometria. Daí o formato de texto para IA, os IDs com prefixo de lane e o fluxo encadeado. É o input com mais efeito: mudou a arquitetura, não só a aparência |
| Retângulos, círculos, losangos e setas | **O âmbito**: fluxos lógicos e user flows, um BPMN simplificado ao mínimo. Um vocabulário fechado de formas, por opção |
| Exportar PNG, guardar em JSON | **A caixa que cresce com o texto**, maior só com letra maior, ao contrário do comportamento habitual |
| Provavelmente modo escuro | **Eventos de pausa e de mudança de lane**, que vêm do conhecimento de processos reais |
| | **Swimlanes** para pessoas, equipas e departamentos |
| | **IBM Plex Sans, com Plex Mono só para as notas** |
| | **Local, sem conta, com backup; equipas depois do MVP** |
| | **Importar do draw.io e do Visio com aviso das incompatibilidades**, uma decisão de estratégia face aos concorrentes |
| | Na conversa de trabalho: o posicionamento, as lanes coladas, as regras das setas, os planos e o roadmap (capítulo 1) |

Ressalva: vários inputs seguem convenções conhecidas (círculos para eventos, swimlanes, BPMN). O valor não está em cada peça ser inédita, mas na **combinação e no corte**: o que entra, o que fica de fora e para quê.

### 7.2 A segmentação

| Papel | O que inclui | Peso neste projeto |
|---|---|---|
| **Design de produto e de interação** | Propósito, âmbito, vocabulário de formas, regras de comportamento, estratégia de importação, posicionamento, planos | **O maior.** É design, embora David não tenha desenhado os pixels |
| **Direção de arte** | Tipografia (IBM Plex), Mono nas notas, o aspeto visual como diferencial face ao draw.io e ao Excalidraw | **Menor.** A execução visual (paleta, ícones, disposição) foi da IA, aprovada por David |
| **Supervisão de design** | Testar, detetar erros, corrigir a direção, aprovar ou rejeitar | **Pouca na conversa de partida** (nenhuma correção) e **muita na conversa de trabalho** (capítulo 2) |

**Designação proposta: direção de produto e de design.** É o papel de quem dá o briefing a um estúdio, decide o que se faz e aprova ou rejeita o resultado. Aqui, o estúdio que executa e propõe é a IA. O peso humano cresce com cada escolha entre alternativas e com cada rejeição, e dilui-se quando as propostas da IA são aceites sem discussão.

## 8. Questões em aberto à data de fecho

Ficaram sem resposta a 2026-10-13:

1. Quem escolheu o nome "Diagramico" (o projeto Claude já tinha esse nome antes da primeira mensagem).
2. Se algum ficheiro foi editado antes de ser carregado nos commits `7f1dfc3` e `e357913`.
3. A origem de `docs/ARQUITETURA.md` (commit `d991f4c`).
4. Que testes David fez entre os pedidos da conversa de partida.
