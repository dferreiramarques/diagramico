# Lançamento: rascunhos dos posts

Rascunhos para a semana 2 do plano de 30 dias (`docs/ROADMAP.md`). São para rever e publicar por ti, na tua voz: muda o que não soar a ti. Tudo o que aqui se afirma sobre o produto é verdade à data de 2026-11-12; se o produto mudar, revê os textos antes de publicar.

## Antes de publicar

- Publicar um canal de cada vez, com dois ou três dias de intervalo, para se perceber em `/api/stats` (campo `r`, origens) de onde vem cada pico.
- Estar disponível nas duas horas seguintes para responder a comentários. No Hacker News e no Reddit isso pesa mais do que o texto.
- Ligações a usar: página `https://diagramico.monco.io/`, editor `https://diagramico.monco.io/app/`, guias `https://diagramico.monco.io/guides/en/` e `/guides/pt/`, código `https://github.com/dferreiramarques/diagramico`.
- Imagens: `assets/flow-en.gif` e `assets/flow-pt.gif` (o fluxo a ser desenhado) e `assets/og.png`.
- Não prometer as Equipas: ainda não existem. Quem perguntar por colaboração vai para a lista de espera na página.

## Ordem sugerida

1. **LinkedIn PT** primeiro: rede própria, risco baixo, serve para apanhar erros.
2. **Show HN**: terça a quinta, de manhã na costa leste dos EUA (13h a 15h em Lisboa).
3. **Reddit**: depois de ler as regras de autopromoção de cada comunidade; algumas só aceitam isto num tópico semanal.
4. **Product Hunt** por último: é o que exige mais preparação (galeria, primeiro comentário) e só se lança uma vez.

---

## 1. Show HN (inglês)

**Título** (limite de 80 caracteres):

```
Show HN: Diagramico – draw a flowchart, export compact text an LLM can read
```

**Texto:**

```
I kept pasting screenshots of flowcharts into LLMs and getting vague answers, because a picture of a process is a poor input. So I built a small diagram editor whose main export is text: lanes, nodes with stable IDs, and the flow as "A > B [label]" lines. A 20-step process comes out at a few hundred tokens, and the model can refer to steps by ID.

What it does:
- Draws swimlane flows with the keyboard (BPMN-inspired symbols, not a BPMN modeller)
- Exports the compact text, plus Mermaid, SVG, PNG, JSON and a share link that carries the diagram in the URL fragment
- Imports the same text back, and Mermaid, draw.io and Visio files, so you can ask a model to write or edit a flow and then see it drawn
- Runs in the browser with no sign-up; diagrams stay in localStorage

The editor is a single HTML file with no dependencies, MIT licensed. The server is about 300 lines of Node with no dependencies either; it serves the files, optional short links, and anonymous daily counters (no cookies, nothing third-party).

Three worked examples, each opening in the editor with one click: https://diagramico.monco.io/guides/en/

Editor: https://diagramico.monco.io/app/
Code: https://github.com/dferreiramarques/diagramico

Things I would like feedback on: whether the text format is something you would actually paste into a model, and what breaks when you import your own Mermaid or draw.io files.
```

Notas: no HN o título não leva adjetivos nem pontos de exclamação. Não pedir votos a ninguém. Responder a críticas com factos e sem defensiva.

---

## 2. LinkedIn (português)

```
Passei as últimas semanas a construir uma ferramenta pequena para um problema que me irritava: explicar um processo a uma IA.

Uma imagem de um fluxograma é má matéria-prima para um assistente. Ele vê caixas e setas, mas baralha a ordem e inventa passos. O que funciona é texto.

O Diagramico é um editor de fluxos em que a exportação principal é exatamente isso: um texto curto com as lanes, os passos numerados e as ligações. Desenhas o processo, copias o texto, colas na IA que já usas e pedes a documentação, os casos de teste ou uma revisão da lógica.

O que tem hoje:
→ Swimlanes, decisões e símbolos inspirados em BPMN, pensados para desenhar com o teclado
→ Exporta texto para IA, Mermaid, SVG, PNG e uma ligação que leva o diagrama dentro
→ Importa draw.io, Visio e Mermaid
→ Sem registo: os diagramas ficam no teu browser
→ Gratuito e de código aberto

Pus três exemplos prontos a abrir e adaptar: onboarding de um colaborador, aprovação de despesas e tickets de suporte.
https://diagramico.monco.io/guides/pt/

Se trabalhas com processos, produto ou suporte, gostava de saber: o que desenhas com mais frequência, e o que te faz desistir das ferramentas que usas hoje?
```

Notas: publicar com o GIF `assets/flow-pt.gif` carregado diretamente (o LinkedIn mostra menos os posts só com ligação). Pôr a ligação também no primeiro comentário.

---

## 3. Reddit (inglês)

Ler primeiro as regras de cada comunidade. O post tem de ser útil mesmo para quem não clica. Duas versões, conforme o público.

### r/ProductManagement (ou comunidades de análise de negócio)

**Título:**

```
I stopped pasting flowchart screenshots into ChatGPT. Describing the flow as text works much better (format + free tool)
```

**Texto:**

```
A pattern that has saved me time: when I want an LLM to write docs or test cases for a process, I give it the flow as structured text instead of an image.

The format I settled on:

LANES:
EM = Employee (person)
MG = Manager (person)
FI = Finance (department)

NODES:
EM1 start: Pays an expense
EM2 user_action: Submits the claim with the receipt
MG1 decision: Within policy and budget?
...

FLOW:
EM1 > EM2 > MG1
MG1 > FI1 [yes]
MG1 > MG2 [no]

Why it works better than a screenshot: every step has an ID the model can cite, every decision branch is explicit, and it is a few hundred tokens. Prompts like "list test cases covering every branch" or "find decisions with no way out" get precise answers.

You can write this by hand. I got tired of that and built a free editor that draws the flow and exports this text (and imports it back, so the model can also edit the flow). No sign-up, open source, runs in the browser: https://diagramico.monco.io/guides/en/expense-approval-flowchart/

Curious whether others do something similar, and what format you use.
```

### r/sysadmin, r/selfhosted (ângulo técnico)

**Título:**

```
Open-source flowchart editor in a single HTML file, with a text export meant for LLMs
```

**Texto:**

```
Sharing a tool I built for documenting processes (escalation paths, onboarding, change approval).

- The editor is one HTML file, no dependencies, MIT. You can save it and open it from disk.
- Diagrams live in the browser (localStorage). A share link carries the whole diagram in the URL fragment, so nothing reaches a server.
- Exports compact text an LLM can read, plus Mermaid, SVG, PNG and JSON. Imports Mermaid, draw.io and Visio.
- Optional Node server (no dependencies) if you want short links; it is off by default.

Example, a support ticket flow with escalation: https://diagramico.monco.io/guides/en/support-ticket-flowchart/
Code: https://github.com/dferreiramarques/diagramico

Not a BPMN modeller and no real-time collaboration. Feedback on the import of real-world draw.io and Visio files is what I need most.
```

---

## 4. Product Hunt (inglês)

- **Nome:** Diagramico
- **Tagline** (limite de 60 caracteres): `Draw the flow, let AI write the documentation`
- **Tópicos:** Productivity, Design Tools, Artificial Intelligence, Open Source
- **Preço:** Free
- **Galeria:** `assets/og.png` como primeira imagem, depois o GIF `assets/flow-en.gif`, depois capturas do separador Exportar (texto para IA) e de um guia.

**Descrição** (limite de 260 caracteres):

```
A keyboard-first flowchart editor whose main export is compact text an LLM can read. Draw a process with swimlanes and decisions, paste the text into any AI and get docs, test cases or a logic review. Free, no sign-up, open source.
```

**Primeiro comentário (maker):**

```
Hi, I'm David. I built Diagramico because a screenshot of a flowchart is a poor way to explain a process to an AI: it guesses the order and invents steps.

So the editor's main export is text: lanes, steps with IDs and the flow as short lines. A 20-step process is a few hundred tokens, and the model can point at "MG1" instead of "the diamond on the left".

What is there today:
• Swimlanes, decisions and BPMN-inspired symbols, built for the keyboard
• Export: AI text, Mermaid, SVG, PNG, JSON and a link that carries the diagram
• Import: draw.io, Visio, Mermaid, and the same AI text (so a model can draw or edit a flow)
• No account. Diagrams stay in your browser. No cookies, no third-party scripts
• The editor is a single HTML file, MIT licensed

What is not there: real-time collaboration and saving to an account. If you need those, there is a waitlist on the page, and I only build them if there is demand.

Start from a worked example: https://diagramico.monco.io/guides/en/

I would love to know what you draw and where the editor gets in your way.
```

---

## Depois de publicar

- Ler `/api/stats?days=7` no dia seguinte: `view` e `guide` por origem (`r`), e quantos chegaram a `app_open`, `first_diagram` e `export_ai`.
- Anotar em `docs/ROADMAP.md` (plano de 30 dias, semana 2) o que cada canal trouxe.
- As perguntas repetidas nos comentários são candidatas a entrar no FAQ da landing ou a novo guia.
