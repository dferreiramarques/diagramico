# Diagramico

Quadro infinito para desenhar diagramas lógicos e user flows, com saída em imagem ou num texto compacto pensado para ser lido por IA (documentação e explicação de lógica com poucos tokens).

Aplicação de ficheiro único (`app/index.html`): HTML, CSS e JavaScript sem dependências nem build. Usa IBM Plex Sans e IBM Plex Mono, servidas localmente a partir de `assets/fonts/` (licença OFL em `assets/fonts/OFL.txt`); sem pedidos a terceiros. Sem essa pasta (por exemplo, se descarregares só o `app/index.html`), a app usa as fontes do sistema e funciona na mesma.

## Publicar no GitHub Pages

1. Cria um repositório e envia estes ficheiros para a branch `main`.
2. Em **Settings → Pages**, escolhe *Deploy from a branch*, `main` / `/ (root)`.
3. A landing fica em `https://<utilizador>.github.io/<repositório>/` e a app em `.../app/`.

Para usar localmente basta abrir `app/index.html` no browser.

**Dispositivos:** pensado para computador e tablet. Em telemóvel (ecrã tátil com o lado menor abaixo de 600 px) aparece um aviso a dizer que a aplicação não funciona bem, com a opção de continuar mesmo assim.

## Primeiros passos

Na primeira visita abre uma **visita guiada** de 10 passos sobre um diagrama de exemplo (ferramentas, criar e ligar formas, lanes, navegação, diagramas, exportação, tema e idioma). Pode saltá-la com `Esc` e repeti-la a qualquer momento no botão da bússola, junto ao `?`.

Arranque rápido:

1. Escolha uma forma na barra à esquerda (ou prima `R`) e clique no quadro; ou faça duplo clique no vazio.
2. Escreva o texto e prima `Esc`. Com a forma selecionada, `Tab` cria a seguinte já ligada.
3. Para ligar formas, arraste a partir dos pontos que aparecem nos lados.
4. Use **Exportar → Texto para IA** para copiar o diagrama em poucos tokens.

## Funcionalidades (MVP)

- **Formas**: Passo / processo, Ação do utilizador (trapézio inclinado), Decisão (losango regular), Ecrã, Documento, Dados.
- **Decisão compacta**: o losango é regular e o texto quebra na largura que dá o losango mais pequeno possível.
- **Tipos de decisão BPMN**: selecionar uma decisão e escolher na segunda lista da barra: exclusiva (XOR), paralela (AND, todos os caminhos), inclusiva (OR) ou complexa. Com um tipo escolhido, o símbolo fica dentro do losango e o texto por baixo, como nos eventos.
- **Eventos**: Início, Fim, Pausa / espera, Mudança de lane.
- **Swimlanes** para pessoas, equipas, departamentos ou sistemas. Mover uma lane leva as formas que estão dentro.
- **Lanes coladas**: com uma lane selecionada, o **+** nos cantos direitos (em cima e em baixo) junta uma lane colada à existente, com o mesmo tipo, cor e largura. Lanes coladas mostram uma **corrente** nos cantos de ligação; clicar nela afasta a lane 10 px (a de baixo para baixo, a de cima para cima, e as coladas para lá dela vão juntas). Ao largar uma lane a menos de 8 px de outra, cola-se e herda o x, a largura, o tipo, a cor e o tamanho do texto dessa lane (só se ainda não estivessem coladas). Redimensionar uma lane acompanha as coladas (a largura é comum, e a altura empurra as de baixo ou de cima).
- **Formas geométricas** (`G`): linha, retângulo, círculo/elipse e triângulo, desenhados por arrasto, com ou sem preenchimento, cor, tracejado e texto (título no canto). Servem de **contentores**: ficam por trás das formas e das setas, e ao mover um contentor leva consigo o que está lá dentro. Redimensionam-se pelos 8 pontos de pega.
- **Texto livre** (`T`): um campo de texto sem forma nem contorno, para títulos e anotações no quadro. Tamanho, negrito, itálico e cor como nas outras formas; sem texto, desaparece. Segue no texto para IA como nota.
- **Agrupar** (`Ctrl G`) e **desagrupar** (`Ctrl Shift G`): as formas agrupadas selecionam-se e movem-se em conjunto, e uma moldura tracejada mostra o grupo. Ajuda a desenhar; não aparece no texto para IA nem nas exportações. Copiar e colar mantém o grupo (como um grupo novo).
- **Espessuras:** 3 espessuras de linha para as formas e para as formas geométricas (fina, média, grossa), e 3 para as setas (a cabeça da seta acompanha).
- **Notas** em IBM Plex Mono.
- **Texto** que ajusta o tamanho da caixa; o tamanho de letra controla o tamanho da forma. Regular, **negrito** e *itálico* por forma ou inline (`**negrito**`, `*itálico*`).
- **Conectores** ligados às formas: cotovelo (com escolha de percurso), reta ou curva; seta no fim, nos dois lados ou nenhuma; tracejado; rótulos.
- **Quadro infinito** com zoom, pinça, alinhamento automático, seleção por área, copiar/colar, desfazer/refazer.
- **Alinhar à grelha** (`Shift A` ou botão no canto inferior direito): não reorganiza nada, só alinha. Formas a menos de 24 px entre si, na mesma lane, ficam na mesma linha; as que estão próximas em x ficam na mesma coluna; os valores arredondam-se a 10 px e as notas seguem a forma a que estão ligadas. Com 2 ou mais formas selecionadas, só essas. Desfazível com `Ctrl Z`.
- **Várias setas entre as mesmas formas**: cada ponto lateral cria a sua seta (duas formas podem ligar-se por cima, por baixo, etc.). Ao arrastar, a forma de destino mostra os seus pontos laterais: largar sobre um deles escolhe o lado (por exemplo cima com cima desenha um U invertido). Setas que saem do mesmo lado partilham o tronco; ligar duas vezes pelo mesmo lado não duplica.
- **Setas soltas**: com o conector (`C`), arraste de uma forma ou do vazio e largue onde quiser. Também se larga um ponto lateral no vazio com `Alt` premido. Arrastando uma ponta de uma seta selecionada, liga-se a uma forma ou desliga-se. Setas soltas não entram no texto para IA nem no Mermaid.
- **Tema** automático, claro ou escuro (botão na barra superior ou `Shift T`).
- **Idioma** português ou inglês (botão PT/EN ou `Shift L`). Na primeira visita segue a língua do browser.
- **Gravação automática** no `localStorage` do browser, lista de diagramas, cópia de segurança e importação em JSON.

## Partilhar por ligação

**Exportar → Ligação** gera um endereço que contém o próprio diagrama (JSON sem valores por defeito, comprimido e em base64url, no fragmento `#d=…`). Não precisa de conta nem de servidor: quem abrir recebe uma cópia nova no seu browser, com a visita guiada desligada, e o endereço é limpo para um refresh não a abrir outra vez. Os dados ficam depois do `#`, que o browser nunca envia a um servidor. O diagrama de exemplo dá cerca de 900 caracteres. Acima de ~8000 caracteres avisa que algumas aplicações podem cortar a ligação (usa então o ficheiro JSON ou o texto IA). A ligação não acompanha edições posteriores: gera outra.

**Ligação curta** (opcional, precisa do servidor com `SHORTLINKS=on`): no mesmo separador, escolhe *Curta* para obter algo como `diagramico.monco.io/s/k7m2xq`. O servidor guarda uma cópia do diagrama (90 dias desde a última abertura) e `/s/ID` abre-o no editor. A opção só aparece quando o servidor a tem ligada. Ver `docs/ARQUITETURA.md`.

## Servidor (`server/`)

`npm start` serve o site (landing, `/app/`, assets) e, se `SHORTLINKS=on`, as ligações curtas. Sem dependências, só Node 20+. Variáveis: `PORT`, `SHORTLINKS`, `DATA_DIR` (pasta do `shorts.json`; no Railway, um Volume montado em `/data`), `SHORT_TTL_DAYS`, `TRUST_PROXY_HOPS`. `npm test` corre os testes.

## Resumir e Guia (walkthrough)

Dois botões ao lado de **Exportar**:

- **Resumir**: resumo, decomposição por lane com o caminho principal, regras-chave (decisões e ramos, ciclos, passagens entre lanes, esperas, notas) e pontos-chave, incluindo lacunas do diagrama (ramos sem rótulo, passos sem saída, passos inalcançáveis).
- **Guia**: job aid para quem segue o processo pela primeira vez: objetivo, quem participa, antes de começar, passo a passo numerado (com "Se X → passo N" nas decisões e a passagem de lane) e lista de verificação.

Cada um tem dois modos:

- **Gerado aqui** (por defeito): lê o próprio grafo no browser e mostra o texto pronto, em Markdown (copiar ou guardar `.md`). Sem rede, sem custos, sempre o mesmo resultado; funciona também no GitHub Pages. Rótulos nas setas das decisões e notas ligadas às formas enriquecem o texto.
- **Prompt para a tua IA**: um prompt completo (instruções com as secções pedidas e o diagrama em texto para IA), para copiar e colar no ChatGPT, Claude, Gemini, Copilot ou outra. A app não chama nenhuma IA, nem precisa de chaves ou servidor.

## Importar texto (IA e Mermaid)

Em **Diagramas → Importar texto (IA / Mermaid)** cola-se o texto e cria-se um diagrama novo, organizado automaticamente (também se pode largar um `.txt`, `.md` ou `.mmd` no quadro). Fecha o ciclo com a exportação: exportar para texto e voltar a importar dá o mesmo diagrama (mesmas formas, lanes e setas; as posições são recalculadas).

- **Texto para IA** do Diagramico (`DIAGRAM`, `LANES`, `NODES`, `FLOW`, `NOTES`): é a forma de pedir a uma IA que desenhe um fluxo, ou de editar o diagrama por texto.
- **Mermaid** `flowchart`/`graph`: formas (`[ ]`, `{ }`, `(( ))`, `[/ /]`, `[[ ]]`, `[( )]`, `> ]`), ligações (`-->`, `---`, `-.->`, `<-->`, com rótulo `|x|` ou `-- x -->`), cadeias (`A --> B --> C`) e `subgraph` como lanes. Estilos (`classDef`, `style`, etc.) são ignorados. Não suporta `A & B --> C`, nem outros tipos de diagrama.
- As linhas que não são percebidas são ignoradas e contadas no aviso final.

## Importar de outras ferramentas

Em **Diagramas**, os botões **Importar do draw.io** e **Importar do Visio** mostram primeiro as incompatibilidades conhecidas e como resolvê-las. Também pode largar um ficheiro `.drawio`, `.xml`, `.vsdx` ou `.json` em cima do quadro.

- **draw.io** (`.drawio`, `.xml`, comprimido ou não): cada página passa a um diagrama. Mantém posições, textos (negrito, itálico, tamanho), ligações com rótulos, setas e tracejado, e swimlanes (as pools são desfeitas).
- **Visio** (`.vsdx`, incluindo exportações do Lucidchart): as formas são reconhecidas pelo nome do stencil (Fluxograma básico, Fluxograma interfuncional) ou pela geometria. Só contam os conectores colados às formas. O formato antigo `.vsd` não é suportado.
- **Lucidchart**: Ficheiro › Exportar › Visio (VSDX). Se faltarem formas, abra o `.vsdx` no draw.io, guarde como `.drawio` e importe esse.

No fim aparece um relatório: formas sem equivalente (passam a Passo e ficam selecionadas), textos soltos convertidos em notas, imagens e contentores ignorados, ligações soltas e, se as lanes forem verticais, a rotação de 90° aplicada ao diagrama.

## Exportação

Tudo sai pelo botão **Exportar**, com um separador por formato.

| Formato | Uso |
|---|---|
| Texto para IA | Formato compacto (ver abaixo), várias vezes menos tokens do que JSON |
| Mermaid | Linguagem de texto para diagramas; o GitHub, Notion, Obsidian e GitLab desenham-na automaticamente. Lanes passam a `subgraph` |
| JSON completo | Todos os dados, para reimportar |
| PNG | 1×, 2× ou 3×, com fundo branco ou transparente, diagrama inteiro ou seleção |
| SVG | Vetorial, nítido em qualquer tamanho e editável em Figma, Illustrator ou Inkscape. Usa o mesmo desenho do ecrã e do PNG; os textos referem IBM Plex, que é substituída se não estiver instalada |

### Formato "Texto para IA" (v1)

```
DIAGRAM: Compra na loja online
SYNTAX: node = "ID type: text"; ID prefix = lane. Flow: "A > B" directed, ...

LANES:
CL = Cliente (pessoa)
LO = Loja online (sistema)

NODES:
CL1 start: Abre a app
CL2 user_action: Pesquisa **produto**
LO1 step: Mostra resultados
LO2 decision: Há stock?

FLOW:
CL1 > CL2 > LO1 > LO2
LO2 > CL4 [sim]
LO1 ~ AR1 [consulta]

NOTES:
LO2: O stock é verificado em tempo real.
```

- Tipos: `start`, `end`, `wait`, `handoff`, `step`, `user_action`, `decision`, `screen`, `document`, `data`. Gateways BPMN: `decision_exclusive`, `decision_parallel`, `decision_inclusive`, `decision_complex` (no Mermaid vão como prefixo `✕`, `＋`, `○`, `✱` no texto).
- O ID de cada forma é o prefixo da lane onde está o seu centro mais a ordem da esquerda para a direita (`N` = fora de lanes).
- `>` fluxo, `<>` dois sentidos, `-` ligação sem direção, `~>` / `~` tracejado (indireto, acesso a dados), `[x]` rótulo.
- Sequências lineares são encadeadas numa só linha; o fluxo segue a ordem a partir dos eventos de início.

## Atalhos

| Tecla | Ação |
|---|---|
| `R` `U` `D` `E` `F` `B` | Passo, Ação do utilizador, Decisão, Ecrã, Documento, Dados |
| `1` `2` `3` `4` | Início, Fim, Pausa, Mudança de lane |
| `N` `L` `C` | Nota, Swimlane, Conector |
| `G` | Forma geométrica (arrastar no quadro) |
| `T` | Texto livre, sem forma |
| `Ctrl G` / `Ctrl Shift G` | Agrupar / desagrupar |
| `V` / `H` | Selecionar / mover quadro |
| Duplo clique | No vazio cria um passo; numa forma edita o texto |
| `Tab` | Cria o passo seguinte ligado |
| `[` `]` | Diminuir / aumentar texto |
| `Ctrl B` / `Ctrl I` | Negrito / itálico |
| `Ctrl Z` / `Ctrl Shift Z` | Desfazer / refazer |
| `Ctrl C` `V` `D` | Copiar, colar, duplicar |
| `Shift 1` / `Shift 0` | Ver tudo / 100% |
| `Shift A` | Alinhar as formas à grelha |
| `Shift T` | Alternar tema |
| `Shift L` | Mudar idioma (PT/EN) |
| `Espaço` + arrastar | Mover o quadro |

## Dados

Os diagramas ficam guardados apenas no browser onde foram criados (`localStorage`, chave `diagramico.v1`). Para mudar de máquina ou proteger o trabalho, usa **Diagramas → Guardar cópia de segurança** e depois **Importar…**.

## Próximos passos

- Portfólio multi-utilizador e partilha em equipa
- Importação direta de Lucidchart (CSV) e de PNG/SVG com diagrama draw.io embebido
- Conectores que contornam formas

## Documentação para programadores

[docs/SEGURANCA.md](docs/SEGURANCA.md): revisão de segurança, o que está corrigido e o que falta. [docs/ROADMAP.md](docs/ROADMAP.md): níveis Free, Equipas e Premium, e as fases para lá chegar. [docs/ARQUITETURA.md](docs/ARQUITETURA.md): modelo de dados, mapa do código, fluxo de alteração, exportação, i18n, visita guiada e limitações. [docs/AUTORIA.md](docs/AUTORIA.md): o que foi decidido por David e o que foi feito pela IA, com cronologia e commits; [docs/BOAS-PRATICAS-AUTORIA.md](docs/BOAS-PRATICAS-AUTORIA.md) e [docs/PROMPT-SEGMENTACAO-AUTORIA.md](docs/PROMPT-SEGMENTACAO-AUTORIA.md) para repetir o processo noutros projetos.

## Licença

MIT. Ver [LICENSE](LICENSE).
