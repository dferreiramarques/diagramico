# Arquitetura do Diagramico

Documento para quem vai ler, manter ou estender o código. Para uso da aplicação, ver o [README](../README.md).

## Visão geral

- **Ficheiro único**: `app/index.html` (~2800 linhas) com HTML, CSS e um IIFE de JavaScript. Sem build, sem dependências, sem servidor.
- **Renderização**: um `<canvas>` a ecrã inteiro desenha tudo (grelha, lanes, formas, conectores, overlays de seleção). A interface (barra superior, rail de ferramentas, barra contextual, zoom, gaveta, modal) é DOM normal sobreposto ao canvas.
- **Persistência**: `localStorage`. Não há backend.
- **Externo**: nada. As fontes IBM Plex vêm de `assets/fonts/fonts.css` (local); sem essa pasta a app usa fontes de sistema. Se a landing passar a enviar a lista de espera para um endpoint externo, esse endereço tem de entrar em `connect-src` da CSP.

## Modelo de dados

Estado global em `store` (chave `diagramico.v1`):

```js
store = { current: "<docId>", docs: { "<docId>": doc, ... } }
doc   = { id, name, created, updated, view: {ox, oy, z}|null, nodes: [], edges: [], comments: [] }
```

**Node** (forma, evento, nota ou lane):

| Campo | Notas |
|---|---|
| `id`, `type` | `step action decision screen doc data start end pause handoff note lane` |
| `x`, `y` | Centro da forma (canto superior esquerdo nas lanes) |
| `text`, `fs`, `b`, `i` | Texto com markdown inline, tamanho de letra (escala `FS`), negrito/itálico globais |
| `color` | `none blue green yellow red violet grey` |
| `w`, `h`, `laneType` | Só lanes. `laneType`: `pessoa equipa departamento sistema` |

A largura/altura das formas **não é guardada**: deriva do texto e do `fs` (`layoutText` + `geom`).

**Edge** (conector): `{ id, from, to, label, style: elbow|straight|curve, arrow: end|both|none, dash, route?, lw?, sa?, sb?, lt?, bd?, bk? }`.

- `lt` (0–1): posição do rótulo ao longo da seta (omitido = 0,5); arrasto `edgelabel`, `labelPt`, `tOnPath`.
- `bd` (px): deslocamento manual do segmento do meio de uma seta em cotovelo, perpendicular a esse segmento. `route()` envolve `route0()` (o cálculo automático) e aplica `bd`: com 4 pontos (`bendAxis`) desloca o segmento do meio; com 3 pontos (L) converte em Z, e `bk = 1` indica que foi arrastado o primeiro segmento (senão o segundo). Arrasto `edgebend` (`onDown`/`onMove`); duplo clique (`dbl`) apaga `bd` e `bk`. Validado em `sanitizeEdges`.
- Tipo `img` (`src`, `w`, `h`): imagem escolhida no seletor de ficheiros, colada ou largada; redimensiona com proporção fixa (`georesize`), desenha-se com `drawImg` e exporta-se em SVG. As três entradas acabam em `addImageFile(f, i)` (reduz a 1600 px, converte em WebP `data:`, e `i` desloca e junta à seleção quando vêm várias); `IMG_MIME` é o filtro comum. Na barra de ferramentas, `img` é uma **ação e não um modo**: `pickImage()` (botão ou tecla `I`) abre o `<input id="fileImg" multiple>` e volta à ferramenta de seleção. Por isso `TYPES.img.key` fica vazio e a tecla vem de `TOOL_KEY`.
- A barra de ferramentas (`.tools`) passa a duas colunas quando a janela tem menos de 940 px de altura (media query junto à regra `.tools`), para todos os botões caberem em portáteis.
- `e.color` (setas) usa as mesmas chaves de `COLORS`; `n.tw` é a largura do texto definida pelas pegas laterais (`twHandles`, arrasto `twresize`; `hasTW` exclui decisões, eventos, lanes, `geo` e `img`). `layoutText` nunca parte palavras.
- Deslocamento automático da vista (`AUTOSCROLL`, `edgePush`, `autoScroll`) durante os arrastos `connect`, `endpoint` e `move`.

## Mapa do código

As secções de `app/index.html` estão marcadas com comentários `/* ---------- nome ---------- */`.

| Secção | Responsabilidade |
|---|---|
| icons / i18n | Ícones SVG inline; dicionários `I18N.pt` e `I18N.en` (função `T(chave, ...args)`, com fallback para PT) |
| model / store | Tipos (`TYPES`), paleta (`PAL`), `sampleDoc()`, carregar/gravar (`persistNow`, `scheduleSave` com debounce de 450 ms) |
| state / history | `S` (ferramenta, seleção, edição); undo/redo por snapshots JSON (`checkpoint`, máx. 150) |
| text layout | `parseRuns` (markdown inline), `layoutText` (quebra de linhas e medição), cache `LC` |
| geometry | `geom`, `bbox`, `anchor`, `route` (cotovelo/reta/curva), `midOf` |
| rendering | `drawNode`, `drawLane`, `drawEdge`, `renderScene`, `draw` (rAF) / `frame` / `drawOverlay` |
| view / hit testing | Pan/zoom (`view`, `toWorld`, `zoomAt`, `fit`); `hitTest`, handles de ligação |
| mutations / clipboard | `addNode`, `addEdge`, `deleteSel`, `quickAdd` (Tab), copiar/colar |
| text editing | `<textarea id="ta">` sobreposto, `startEdit` / `endEdit` |
| comments | Comentários de revisão: pontos DOM, ancoragem, caixa de edição (ver abaixo) |
| pointer / keyboard | `onDown/onMove/onUp` (seleção, arrasto, alinhamento `snapMove`, ligar), atalhos |
| tool rail / contextual bar | `buildTools`, `buildCtx` (barra que muda conforme a seleção) |
| auto layout | `autoLayout` / `runAutoLayout` (ver abaixo) |
| AI text export | `buildIds`, `exportAI`, `exportMermaid` |
| PNG / SVG export, files, modal | `renderPNG`, `renderSVG`, `saveFile`, modal de exportação por separadores |
| import | `importFile`; draw.io (`drawioModel`), Visio (`.vsdx` via ZIP + XML, `visioClassify`); relatório de incompatibilidades |
| drawer | Lista de diagramas, duplicar/apagar, cópia de segurança e importação JSON |
| theme / language | `applyTheme` (auto/claro/escuro), `applyLang` (reaplica `data-i18n*`) |
| guided tour | Visita guiada de primeira utilização (ver abaixo) |
| boot | Inicialização; expõe `window.__diagramico` para testes |

### Lanes coladas

- "Coladas" é derivado da geometria, não se guarda nada: `gluedPair(a, b)` = mesmo `x` e `w`, e `a` mesmo em cima de `b` (tolerância de 1 px). As lanes do exemplo, que se tocam, contam como coladas.
- `laneControls()` devolve os controlos desenhados em `drawOverlay` e testados em `onDown` (`laneControlAt`): o **+** (só nos lados sem lane colada, com uma lane selecionada) e as correntes nas duas lanes de cada junção. `runLaneControl` acrescenta a lane (herda tipo, cor, tamanho de texto, `x`, `w`, `h`) ou afasta 10 px com `shiftLanes` (a lane e as coladas para lá dela, com as formas que contêm).
- `glueLane` / `gluePass`: ao largar uma lane (ou criar uma com a ferramenta) a ≤ 8 px de outra com sobreposição horizontal, encosta-a por cima ou por baixo (conforme o centro) e, se não estavam coladas antes do arrasto, herda `w`, `laneType`, `color`, `fs` da outra. As formas movidas com a lane acompanham o encosto.
- Redimensionar (`onMove`, `kind: 'resize'`): a largura aplica-se a toda a cadeia; ao crescer para baixo/cima empurra as lanes coladas desse lado.
- Limitações: arrastar uma lane colada para o lado faz-na voltar a encostar (ímã); não há reordenação de lanes por arrasto que empurre as outras.

### Formas geométricas e espessuras

- Tipo `geo` (`kind`: `rect`, `ellipse`, `triangle`, `line`; `w`, `h`, `fill`, `dash`, `flip` para a diagonal da linha, `color`, `text` opcional como título no canto). Desenha-se com `drawGeo`, **depois das lanes e antes das setas e das formas** (`renderScene`), por isso um contentor preenchido nunca tapa o que contém.
- **Seleção:** `geoHit` testa o contorno (e o interior, se tiver preenchimento) e corre **depois** das formas e das setas, para o que está dentro continuar clicável. Redimensiona-se com 8 pontos de pega (`geoHandles`, `georesize`); criar é arrastar com a ferramenta `geo` (`geodraw`; um clique solto cria 200×120).
- **Contentor:** `containerChildren` devolve as formas cujo centro está dentro (e os contentores mais pequenos e as linhas); é o que o arrasto e a cópia levam consigo. As lanes usam o mesmo mecanismo.
- Não entram no fluxo: ficam de fora do texto IA, do Mermaid, do alinhamento à grelha e do layout, e não se ligam com setas.
- **Espessuras:** `n.lw` (formas e formas geométricas) e `e.lw` (setas) valem 1, 2 ou 3 (2 por defeito). Nas formas multiplica a largura base (`LW_MUL`), nas formas geométricas é fixa (`GEO_W`) e nas setas define também o tamanho da cabeça (`EDGE_W`, `HEAD_S`). Validado em `sanitizeNodes` e `sanitizeEdges`.

### Grupos

Só ajudam a desenhar: formas com o mesmo `n.grp` (um id) selecionam-se e movem-se juntas (`groupMates`, `expandGroups`, aplicadas ao clicar, ao selecionar com a moldura e ao reduzir uma seleção múltipla). `Ctrl G` agrupa (`groupSel`; achata grupos anteriores) e `Ctrl Shift G` desagrupa (`ungroupSel`); a barra de contexto mostra os botões. Copiar e colar cria um grupo novo (`gmap` em `paste`). As lanes nunca se agrupam, e `grp` é validado em `sanitizeNodes`. O texto IA, o Mermaid e o alinhamento à grelha não olham para os grupos.

### Texto livre

Tipo `text`: só texto, sem contorno nem fundo (`geom` mede-o com `layoutText`, largura de quebra de 24×o corpo; `drawNode` desenha-o alinhado à esquerda, com `n.color` a colorir o texto). Cria-se com a ferramenta `T` (um clique abre a edição); se ficar vazio ao fim da edição é apagado (`endEdit`), incluindo o ponto de histórico da criação. Não tem espessura, não entra no alinhamento à grelha nem no layout, e segue no texto IA como nota (secção `NOTES`); o Mermaid ignora-o.

### Comentários

- `doc.comments = [{id, x, y, text, on?, dx?, dy?, t?}]`, **fora de `doc.nodes`** (pode faltar em diagramas antigos: usar sempre `CM()`). Assim nunca entram na seleção, nos grupos, no alinhamento, no layout, no PNG/SVG nem no fluxo exportado.
- **Ancoragem:** `on` é o id de uma forma (com `dx`, `dy` a partir do `x`, `y` dela) ou de uma seta (com `t`, a fração do percurso, via `tOnPath` / `pointAt`). Sem `on`, o comentário está fixo em `x`, `y`. `cmPos` resolve a posição; `cmTarget(p)` decide a que se prende um ponto largado em `p` (`hitTest`, ou uma forma a ≤ 12 px); `cmAttach` grava. Se o alvo deixar de existir, `cmPos` apaga `on` e o comentário fica no último sítio (`placeComments` mantém `x`, `y` atualizados em cada frame).
- **Desenho:** botões DOM (`.cm`) dentro de `#cms`, posicionados por `placeComments()` em `frame()`; o pulse é uma animação CSS, por isso não custa repinturas do canvas. Classe `on` = preso (amarelo limão, `--cm-on`); sem ela = fixo (amarelo torrado, `--cm-free`). As cores são tokens por tema; tamanhos e animação são únicos.
- **Interação:** ferramenta `comment` (`M`) em `onDown`; `cmDot` trata do hover (`cmTip`), do clique (`cmOpen`) e do arrasto (`S.cmDrag`, que mostra a cor do destino enquanto se arrasta). A caixa (`.cmbox`, estado `S.cmEd`) grava com `cmCommit` (Enter, clicar fora), cancela com `cmCancel` (Esc) e apaga com `cmDelete` (caixote do lixo, `--danger`). Um comentário novo que fique vazio é removido juntamente com o seu ponto de histórico.
- **Histórico e entrada de dados:** `snap` / `restore` incluem `comments`. `packDoc` grava-os em `c`, a apontar para o índice da forma (`n`) ou da seta (`e`); `unpackDoc` e a importação de JSON passam por `sanitizeComments` (texto até 2000 caracteres, máx. 1000, `on` só para ids existentes).
- **Texto:** `commentRefs` dá `{ref, text}`; `exportAI(d, true)` acrescenta a secção `COMMENTS` no fim e `exportMermaid(d, true)` linhas `%% COMMENT`. Sem o segundo argumento não saem (é o caso de `insightPrompt`). `parseAIText` lê a secção para `r.comments` e `buildDocFromParsed` volta a prendê-los.
- No modo `?embed=1` os pontos só mostram o comentário ao passar o rato.

### Decisões e gateways BPMN

- O losango é sempre regular (`w = h`, o necessário para o texto caber: `L.w + L.h + padding`).
- `n.gate` (opcional) ∈ `GATES` (`exclusive`, `parallel`, `inclusive`, `complex`); sem `gate` é a decisão simples com o texto dentro. Com `gate`, a forma tem tamanho fixo (`4·fs`), desenha o símbolo no centro e o texto por baixo (`g.below`, `g.ly`, tratados em `bbox`, `insideNode`, `placeTA` e `drawNode` como nos eventos).
- A barra contextual de uma decisão tem uma segunda lista (`gateType`) com o tipo. Na exportação para IA o tipo vai no nome (`decision_parallel`…), no Mermaid como prefixo do texto (`GATE_SYM`); os dois importadores fazem o caminho inverso.

### Extremidades das setas

- Cada ponta é uma forma (`from`/`to` = id) ou um ponto solto (`from: null` + `fx`,`fy`; `to: null` + `tx`,`ty`). `endNode(e, 'from'|'to')` devolve a forma ou um pseudo-nó `{type:'point'}`, e `route()` trata-o como uma forma sem tamanho.
- `sa` / `sb` (opcionais) fixam o lado da forma de onde a seta sai / onde entra. Com `sa`/`sb`, o percurso em cotovelo é derivado dos lados (L se um é horizontal e o outro vertical, Z nos restantes).
- Ao arrastar uma seta (ou uma ponta), a forma sob o rato mostra os seus pontos laterais; largar sobre um ponto fixa `sb` (`dropTarget` / `handleAt`; a forma continua "viva" enquanto o rato passa pelos pontos, que ficam fora dela). Largar no corpo da forma deixa `sb` automático.
- Mesmo lado nas duas pontas (`s1 === s2`) desenha um U à volta das formas. Com só um lado fixo, `autoOther` escolhe o outro: a forma de destino fica virada para a origem se estiver à frente do lado escolhido, senão a seta contorna-a (U).
- `addEdge` só rejeita a ligação se já existir outra com os mesmos `from`, `to` e `sa`; lados diferentes criam setas diferentes.
- Setas do mesmo `from` e `sa` dobram a uma distância fixa da origem (máx. 36 px), o que as faz partilhar o tronco.
- Setas com uma ponta solta ignoram-se na exportação para IA/Mermaid, no auto-layout e na cópia (a menos que a outra ponta esteja selecionada).

## Fluxo de uma alteração

1. O input (rato/teclado) chama `checkpoint()` (guarda o estado para undo).
2. Altera-se `doc.nodes` / `doc.edges`.
3. `changed()` → `reindex()` (mapa `idx` id→node), atualiza `doc.updated`, `scheduleSave()` e `draw()`.
4. `draw()` agenda um frame; `frame()` repinta o canvas e atualiza a barra contextual (`updateCtx`, com chave de cache `ctxKey`).

## Alinhar à grelha (`alignGrid`, `Shift A`)

Não reorganiza nada: só usa posições relativas entre as próprias caixas. Um `checkpoint` para o undo.

1. Âmbito: as formas selecionadas (2 ou mais), senão todas as formas (sem lanes nem notas).
2. **Linhas**: dentro de cada lane (ou fora de lanes), ordenam-se por `y` e agrupam-se as que estão a ≤ 24 px da primeira do grupo; cada grupo fica com o `y` médio arredondado a 10 px (preso aos limites da lane).
3. **Colunas**: o mesmo por `x`, mas em todas as lanes juntas, para que um passo e o seguinte em lanes diferentes fiquem alinhados na vertical.
4. As notas acompanham o deslocamento da forma a que estão ligadas. Se nada se mexe, avisa e não grava no histórico.

Como só as diferenças pequenas são corrigidas, nunca puxa formas para um lado nem muda a ordem ou as lanes. O botão de `Shift A` e o tooltip estão em `bLayout`.

## Layout em camadas (`autoLayout`, só para importação de texto)

Já não está ligado ao `Shift A`; é usado por `importFromText`, onde não há posições. Layout em camadas, da esquerda para a direita:

1. **Ciclos**: DFS a partir dos eventos de início; as arestas que fecham um ciclo são ignoradas só para a camada.
2. **Camadas**: caminho mais longo (Kahn). Arestas tracejadas não contam; formas só com ligações tracejadas (ex.: Dados) ficam na coluna da forma a que se ligam.
3. **Ordem** dentro de cada coluna: 4 passagens de baricentro (descida e subida) para reduzir cruzamentos.
4. **Coordenadas**: x por largura da coluna + 90 px; sem lanes, cada coluna é centrada nos predecessores (cadeias lineares ficam retas); com lanes, cada forma mantém a lane onde estava (por `laneOf` antes de mover), as formas da mesma lane e coluna empilham-se e a altura da lane cresce (mín. 180). Formas fora de lanes vão para uma faixa extra por baixo.
5. **Notas** acompanham a forma a que estão ligadas (ou a lane); `e.route` das ligações é reposto em automático.

Limitações: só horizontal; não desenha arestas à volta de formas; a lane de cada forma é a atual, nunca é alterada.

## Servidor e ligações curtas (`server/server.js`)

Node sem dependências. Serve só uma lista fechada (`/index.html`, `/product-page.css`, `/robots.txt`, `/sitemap.xml`, `/app/`, `/assets/`, `/guides/`) com cabeçalhos de segurança e CSP, e a API das ligações curtas, desligada por defeito (`SHORTLINKS=on`):

- `GET /api/health` → `{ok, commit, shortLinks, ttlDays, idLen, stats}` (o editor usa `shortLinks` para mostrar ou não a opção *Curta*; `commit` são os 7 primeiros caracteres do `RAILWAY_GIT_COMMIT_SHA`, ou `null`, e serve para confirmar que versão está em produção).
- `POST /api/short` `{d}` → `201 {id}` (ou `200` se o mesmo diagrama já existir: deduplicação por sha256). `d` é o mesmo payload do `#d=`; só é aceite se descomprimir (limite 8 MB) para JSON com `nodes[]`.
- `GET /api/short/:id` → `{d}`; `GET /s/:id` → 302 para `/app/#s=ID`. O editor revalida tudo com `unpackDoc`, como em `#d=`.
- IDs de 6 caracteres de `23456789abcdefghjkmnpqrstuvwxyz` (sem caracteres ambíguos), gerados com `crypto.randomInt`.
- Armazenamento num `shorts.json` (escrita atómica, 0,4 s depois de cada alteração). Expira 90 dias depois da última abertura. Limites: 120 000 caracteres por payload, 50 000 ligações, 50 MB, 20 criações/hora e 240 leituras/min por IP. Em produção precisa de um volume persistente (`DATA_DIR`).

### Contagem anónima de utilização

Serve para medir o marco da Fase 0 do roadmap sem serviços de terceiros (a CSP continua `connect-src 'self'` no editor). Ligada por defeito; `STATS=off` desliga.

- `POST /api/event` `{e, r}` → `204`. `e` é um de `view` (landing), `guide` (página de guia), `app_open`, `first_diagram` (primeira forma criada neste browser, lembrado em `localStorage` `diagramico.ev.first_diagram`), `export_ai` (copiar ou guardar o texto IA ou um prompt de Resumir/Guia) e `waitlist`. `r` é o domínio de origem (`document.referrer`), só guardado em `view` e `app_open`. Só aceita `application/json` até 400 bytes, 60 eventos/min por IP; bots conhecidos recebem `204` mas não contam.
- No cliente é a função `track()` (uma na landing, outra no editor). Não envia nada no modo `EMBED`, em alojamento estático, nem com Do Not Track ou Global Privacy Control. O editor só envia se `/api/health` disser `stats: true`.
- Por dia (UTC) guarda-se `n` (ocorrências), `u` (visitantes diferentes) e `r` (origens, no máximo 200 por dia). Um visitante distingue-se só dentro do dia, por um hash de sal aleatório + IP + browser; o sal muda todos os dias e vive só em memória, e nem o hash nem o IP vão para o disco. Um reinício a meio do dia pode inflacionar um pouco o `u` desse dia.
- `DATA_DIR/stats.json` (escrita atómica, 1 s depois de cada alteração), 400 dias de histórico (`STATS_KEEP_DAYS`).
- `GET /api/stats?days=N` com `Authorization: Bearer <STATS_KEY>` → `{from, to, total:{n, uDaily, r}, days}`. Sem `STATS_KEY` (16+ caracteres) responde `404`. `uDaily` é a soma dos visitantes diários, não visitantes únicos do período.
- Ao acrescentar um evento: juntá-lo a `EVENTS` no servidor, chamar `track()` no cliente e rever a pergunta "O site segue-me?" da landing (`q7`/`a7`), que descreve o que se conta.

`robots.txt` e `sitemap.xml` estão na raiz e entram na lista fechada de ficheiros servidos. A imagem de partilha `assets/og.png` (1200×630) gera-se a partir de `tools/og-image.html` (instruções no próprio ficheiro).

## Guias (`guides/`, `tools/build-guides.js`)

Páginas estáticas por caso de uso, em PT e EN (`/guides/pt/<slug>/`, `/guides/en/<slug>/`, mais um índice por língua), para pesquisa e para os posts de lançamento. **São geradas**: os textos e os fluxos estão em `tools/build-guides.js`; depois de os mudar, correr `node tools/build-guides.js` e fazer commit do resultado (o servidor não tem passo de build). O mesmo script escreve o `sitemap.xml`.

- Cada guia é um fluxo no formato "Texto para IA". A página mostra-o ao vivo (o editor em `?embed=1&t=…`), explica-o, dá três pedidos prontos para uma IA (o botão copia o pedido mais o texto) e abre-o no editor com um clique.
- **`/app/?t=<texto>` fora do modo embebido** importa o texto como diagrama novo (não toca nos existentes), tira o parâmetro do endereço para um recarregamento não importar outra vez, e não abre a visita guiada por cima.
- Estilos em `guides/guides.css`, sobre o `product-page.css`. Os caminhos são absolutos (`/assets/…`), por isso os guias só funcionam com o site na raiz do domínio.
- Cada página envia o evento `guide` (ver *Contagem anónima de utilização*).
- Para um guia novo: acrescentar uma entrada a `GUIDES` com `pt` e `en` equivalentes, gerar, e confirmar no browser que o fluxo importa sem linhas ignoradas.

## Partilha por ligação (`#d=…`)

`packDoc` tira os valores por defeito (`fs` 14, `b`, `i`, `color`, `label`, `style`, `arrow`, `dash`) e troca os ids por índices em base 36; `deflateRaw` (CompressionStream) e `b64u` fazem o resto. `openFromHash` (no arranque e em `hashchange`) descomprime com `inflateRaw`, valida com `unpackDoc` (tipos conhecidos, números finitos, máx. 3000 formas, setas só para formas existentes), cria um diagrama novo "(partilhado)" e limpa o fragmento com `history.replaceState`. O separador **Ligação** do modal de exportação mostra o URL e avisa acima de 8000 caracteres. Não é uma ligação "viva": o URL não muda enquanto se desenha (seria um `replaceState` com compressão a cada edição) e só funciona em browsers com `CompressionStream` (Chrome 80+, Firefox 113+, Safari 16.4+).

## Importação de texto (`importFromText`)

`detectText` distingue Mermaid (`flowchart`/`graph`) do texto para IA (`DIAGRAM`/`NODES`/`FLOW`). `parseAIText` e `parseMermaid` produzem a mesma estrutura intermédia `{name, lanes, nodes, edges, notes, skipped}`; `buildDocFromParsed` cria o diagrama (cada forma é posta na lane certa, uma linha por lane), `importFromText` abre-o e corre `autoLayout`.

- Texto IA: o ID de cada forma pertence à lane cujo código é prefixo do ID (o código mais longo ganha). Cadeias `A > B > C` e etiquetas `[x]` no fim da linha.
- Mermaid: `mmRef` lê `ID` + forma opcional (`((` → início/fim/pausa/mudança de lane conforme o texto e as ligações), `mmLink` lê as setas (`-->`, `-.->`, `<-->`, rótulos `|x|` ou `-- x -->`). Nós `NOTE<n>` ou `:::note` tornam-se notas ligadas a tracejado.
- O exportador de Mermaid e o de IA são o formato de referência: se mudar um, mudar o outro parser.

## Exportação SVG (`renderSVG`)

`SvgCtx` é um gravador mínimo da API Canvas 2D: implementa `save/restore`, transformações, caminhos (`moveTo`, `lineTo`, `arc`, `ellipse`, `arcTo`, `roundRect`, `bezierCurveTo`…), `fill/stroke`, `fillRect/strokeRect` e `fillText`, e escreve elementos `<path>` e `<text>`. `paintScene(x, onlySel, transparent)` desenha o diagrama num contexto qualquer, por isso o ecrã, o PNG e o SVG partilham exatamente o mesmo código de desenho (`renderScene`). Cores `rgba()` passam a cor + opacidade; a sombra das notas é um filtro `feDropShadow`. Se uma função de desenho passar a usar um método do canvas que o `SvgCtx` não tem, o SVG falha ou omite esse elemento: implementar o método ali.

## Landing page e modo embebido

- `index.html` (raiz) é a landing, bilingue (PT/EN), sem dependências além das fontes. A app vive em `app/`.
- A demo do hero é a própria app num `<iframe src="app/?embed=1&lang=pt|en">`. Com `?embed=1` a app fica só de leitura: sem barras, sem visita nem aviso de telemóvel, sem atalhos nem edição (arrastar só move o quadro, a roda só faz zoom com Ctrl), e **nada é gravado** (um `localStorage` falso, em memória, tapa o real dentro do IIFE). `?lang=` escolhe o idioma sem o gravar.
- Os planos (`PLANS`) e o roadmap público NOW/NEXT/LATER (`ROAD`) são dados no `<script>` da landing, em PT e EN; a versão completa e interna é `docs/ROADMAP.md`. Ao mudar um, rever o outro.
- A lista de espera envia para o Formspree (`WAITLIST_URL`, `connect-src` aberto só para `https://formspree.io`), com um campo-armadilha `_gotcha` contra bots; o email chega à caixa do dono do formulário. Antes de a ligar estava desligada: `WAITLIST_URL` (no `<script>` da landing) está vazio e a secção "equipas" fica escondida. Para a ativar, pôr lá o URL de um endpoint que aceite POST JSON (por exemplo um formulário Formspree); o formulário envia `{email, uso, lang, page}`.
- O exemplo "do diagrama ao assistente de suporte" usa `?embed=1&t=<texto IA ou Mermaid>` para mostrar um diagrama gerado a partir de texto (`importFromText`); o texto dos dois diagramas e a conversa estão no objeto `CASE` do `<script>` da landing. A resposta do assistente é um exemplo ilustrativo escrito por uma IA, e a página di-lo.
- Não há analytics. Para medir visitas sem cookies, acrescentar um serviço como Plausible ou GoatCounter na landing.

## Dispositivos

`isPhone` (ponteiro `coarse` e `Math.min(screen.width, screen.height) < 600`) mostra um aviso (`mobileNotice`) e suprime a visita guiada. Tablets (≥ 600 px) e janelas estreitas de computador não são afetados.

## Exportação para IA (`exportAI`)

- IDs estáveis por `buildIds`: prefixo da lane que contém o centro da forma + ordem da esquerda para a direita (`N` = fora de lanes).
- Sequências lineares sem rótulo são encadeadas (`A > B > C`); arestas tracejadas e rotuladas ficam em linhas próprias.
- O formato está descrito no [README](../README.md#formato-texto-para-ia-v1). Alterar a gramática implica rever também `SYNTAX:` no cabeçalho gerado e `tokEst`.

## Internacionalização

Todos os textos visíveis vivem em `I18N.pt` / `I18N.en`. Em HTML estático usam-se `data-i18n`, `data-i18n-title`, `data-i18n-aria`, `data-i18n-html`. Os nomes dos tipos de forma no ficheiro (`TYPES[t].name`) são em PT e servem de chave interna; as etiquetas mostradas usam `t_<tipo>`. O idioma inicial segue `navigator.language` e fica em `diagramico.lang`.

## Visita guiada

- Passos em `I18N.<lang>.tourSteps` (`{t, d}`; `d` aceita `**negrito**` e `*itálico*`). O alvo de cada passo está em `TOUR_TARGETS` (mesma ordem; `null` = cartão ao centro). O alvo pode ser um só botão da barra, por exemplo `#tools [data-tool="img"]` no passo das imagens e comentários.
- `startTour()` cria um bloqueador de cliques, um destaque (`.tour-hl`, escurece o resto com `box-shadow`) e um cartão (`.tour-card`) posicionado ao lado do alvo.
- Arranca sozinha na primeira visita (chave `diagramico.tour` em `localStorage`) e pode ser repetida no botão da bússola junto ao `?`.
- Teclado: `→`/`←` navegam, `Esc` fecha. Um listener em fase de captura impede que os atalhos do quadro corram durante a visita.
- Para adicionar um passo: acrescentar o objeto nas duas línguas e um seletor (ou `null`) em `TOUR_TARGETS`.

## Armazenamento

| Chave | Conteúdo |
|---|---|
| `diagramico.v1` | Todos os diagramas e o atual |
| `diagramico.lang` | `pt` ou `en` |
| `diagramico.theme` | `auto`, `light` ou `dark` |
| `diagramico.tour` | `1` depois de a visita ser vista ou fechada |

Se o `localStorage` falhar (modo privado, quota), a app continua a funcionar e mostra "Não gravado".

## Limitações conhecidas

- Dados só no browser: sem sincronização nem colaboração.
- Conectores não contornam formas.
- `.vsd` (Visio antigo) não suportado.
- Sem testes automáticos; `window.__diagramico` existe para verificações manuais na consola (`exportAI()`, `exportMermaid()`, `doc()`).

## Convenções

- Um único ficheiro; novas secções com o mesmo cabeçalho de comentário.
- Cores e dimensões vêm de `PAL` e das variáveis CSS (`--accent`, `--panel`…), nunca fixas no código de desenho.
- Textos novos entram sempre nas duas línguas.
