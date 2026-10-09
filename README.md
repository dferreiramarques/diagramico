# Diagramico

Quadro infinito para desenhar diagramas lógicos e user flows, com saída em imagem ou num texto compacto pensado para ser lido por IA (documentação e explicação de lógica com poucos tokens).

Aplicação de ficheiro único (`index.html`): HTML, CSS e JavaScript sem dependências nem build. Usa IBM Plex Sans e IBM Plex Mono (Google Fonts).

## Publicar no GitHub Pages

1. Cria um repositório e envia estes ficheiros para a branch `main`.
2. Em **Settings → Pages**, escolhe *Deploy from a branch*, `main` / `/ (root)`.
3. A app fica em `https://<utilizador>.github.io/<repositório>/`.

Para usar localmente basta abrir `index.html` no browser.

## Funcionalidades (MVP)

- **Formas**: Passo / processo, Ação do utilizador (trapézio inclinado), Decisão, Ecrã, Documento, Dados.
- **Eventos**: Início, Fim, Pausa / espera, Mudança de lane.
- **Swimlanes** para pessoas, equipas, departamentos ou sistemas. Mover uma lane leva as formas que estão dentro.
- **Notas** em IBM Plex Mono.
- **Texto** que ajusta o tamanho da caixa; o tamanho de letra controla o tamanho da forma. Regular, **negrito** e *itálico* por forma ou inline (`**negrito**`, `*itálico*`).
- **Conectores** ligados às formas: cotovelo (com escolha de percurso), reta ou curva; seta no fim, nos dois lados ou nenhuma; tracejado; rótulos.
- **Quadro infinito** com zoom, pinça, alinhamento automático, seleção por área, copiar/colar, desfazer/refazer.
- **Tema** automático, claro ou escuro (botão na barra superior ou `Shift T`).
- **Gravação automática** no `localStorage` do browser, lista de diagramas, cópia de segurança e importação em JSON.

## Exportação

| Formato | Uso |
|---|---|
| Texto para IA | Formato compacto (ver abaixo), várias vezes menos tokens do que JSON |
| Mermaid | Renderiza no GitHub, Notion, Obsidian; lanes passam a `subgraph` |
| JSON completo | Todos os dados, para reimportar |
| PNG | 1×, 2× ou 3×, com fundo branco ou transparente, diagrama inteiro ou seleção |

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

- Tipos: `start`, `end`, `wait`, `handoff`, `step`, `user_action`, `decision`, `screen`, `document`, `data`.
- O ID de cada forma é o prefixo da lane onde está o seu centro mais a ordem da esquerda para a direita (`N` = fora de lanes).
- `>` fluxo, `<>` dois sentidos, `-` ligação sem direção, `~>` / `~` tracejado (indireto, acesso a dados), `[x]` rótulo.
- Sequências lineares são encadeadas numa só linha; o fluxo segue a ordem a partir dos eventos de início.

## Atalhos

| Tecla | Ação |
|---|---|
| `R` `U` `D` `E` `F` `B` | Passo, Ação do utilizador, Decisão, Ecrã, Documento, Dados |
| `1` `2` `3` `4` | Início, Fim, Pausa, Mudança de lane |
| `N` `L` `C` | Nota, Swimlane, Conector |
| `V` / `H` | Selecionar / mover quadro |
| Duplo clique | No vazio cria um passo; numa forma edita o texto |
| `Tab` | Cria o passo seguinte ligado |
| `[` `]` | Diminuir / aumentar texto |
| `Ctrl B` / `Ctrl I` | Negrito / itálico |
| `Ctrl Z` / `Ctrl Shift Z` | Desfazer / refazer |
| `Ctrl C` `V` `D` | Copiar, colar, duplicar |
| `Shift 1` / `Shift 0` | Ver tudo / 100% |
| `Shift T` | Alternar tema |
| `Espaço` + arrastar | Mover o quadro |

## Dados

Os diagramas ficam guardados apenas no browser onde foram criados (`localStorage`, chave `diagramico.v1`). Para mudar de máquina ou proteger o trabalho, usa **Diagramas → Guardar cópia de segurança** e depois **Importar…**.

## Próximos passos

- Portfólio multi-utilizador e partilha em equipa
- Exportação SVG
- Importar texto IA / Mermaid para gerar o diagrama
- Conectores que contornam formas

## Licença

MIT. Ver [LICENSE](LICENSE).
