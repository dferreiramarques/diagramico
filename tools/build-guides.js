'use strict';
/* Builds the guide pages (guides/<lang>/<slug>/index.html, guides/<lang>/index.html) and sitemap.xml.
   Run from the repository root after editing the texts below:   node tools/build-guides.js
   The output is committed: the site has no build step on the server. No dependencies.
   Each guide is one example flow in the "AI text" format. The page shows it live (the editor in embed mode), explains it, offers ready-made
   prompts, and opens it in the editor with one click (/app/?t=<text>). Keep the PT and EN flows equivalent. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SITE = 'https://diagramico.monco.io';

const UI = {
  pt: { html: 'pt-PT', og: 'pt_PT', other: 'en', otherLabel: 'EN', otherAria: 'Switch to English', home: 'Início', guides: 'Guias', open: 'Abrir o editor',
    indexTitle: 'Guias: fluxos prontos a adaptar', indexDesc: 'Exemplos de processos desenhados no Diagramico: onboarding, aprovação de despesas e tickets de suporte. Abre cada um no editor e adapta-o ao teu caso.',
    indexLead: 'Processos comuns, já desenhados. Abre um no editor, muda o que for diferente na tua empresa e exporta o texto para uma IA escrever a documentação.',
    eyebrow: 'Guia', live: 'O fluxo', liveHint: 'Diagrama interativo: arrasta para mover, roda do rato para aproximar. As alterações aqui não são guardadas.',
    openFlow: 'Abrir este fluxo no editor', openNote: 'Gratuito, sem registo. Abre como um diagrama novo no teu browser.',
    stepsH: 'Como ler o fluxo', textH: 'O texto por trás do diagrama', textP: 'É isto que o Diagramico exporta em Exportar → Texto para IA. Também funciona ao contrário: cola este texto em Diagramas → Importar texto e o diagrama é desenhado.',
    promptsH: 'Pede a uma IA', promptsP: 'Cada botão copia o pedido já com o texto do fluxo. Cola no assistente que usas.',
    adaptH: 'Adapta ao teu caso', moreH: 'Outros guias', copy: 'Copiar', copyText: 'Copiar texto', copied: 'Copiado', read: 'Ver o guia',
    ctaH: 'Desenha o teu próprio fluxo.', ctaP: 'Gratuito, sem registo: os diagramas ficam no teu browser.', gh: 'Código no GitHub', theme: 'Mudar tema claro / escuro',
    prompts: [
      { t: 'Documentação', p: 'Escreve a documentação deste processo para quem o vai executar: objetivo, quem intervém, passos numerados por responsável e o que acontece em cada decisão. Usa apenas o que está no fluxo e assinala o que não estiver definido.' },
      { t: 'Casos de teste', p: 'Lista os casos de teste deste processo em tabela: cenário, condição de partida, passos e resultado esperado. Cobre todos os ramos de cada decisão, incluindo os que voltam atrás.' },
      { t: 'Rever a lógica', p: 'Revê a lógica deste processo. Aponta decisões sem saída, ciclos que podem não terminar, passos sem responsável claro e casos que o fluxo não trata. Não reescrevas o processo: lista os problemas por ordem de gravidade.' }] },
  en: { html: 'en', og: 'en_GB', other: 'pt', otherLabel: 'PT', otherAria: 'Mudar para português', home: 'Home', guides: 'Guides', open: 'Open the editor',
    indexTitle: 'Guides: ready-made flows to adapt', indexDesc: 'Example processes drawn in Diagramico: employee onboarding, expense approval and support tickets. Open each one in the editor and adapt it to your case.',
    indexLead: 'Common processes, already drawn. Open one in the editor, change what is different in your company and export the text for an AI to write the documentation.',
    eyebrow: 'Guide', live: 'The flow', liveHint: 'Interactive diagram: drag to pan, scroll to zoom. Changes made here are not saved.',
    openFlow: 'Open this flow in the editor', openNote: 'Free, no sign-up. Opens as a new diagram in your browser.',
    stepsH: 'How to read the flow', textH: 'The text behind the diagram', textP: 'This is what Diagramico exports under Export → AI text. It also works the other way round: paste this text into Diagrams → Import text and the diagram is drawn.',
    promptsH: 'Ask an AI', promptsP: 'Each button copies the request together with the flow text. Paste it into the assistant you use.',
    adaptH: 'Adapt it to your case', moreH: 'Other guides', copy: 'Copy', copyText: 'Copy text', copied: 'Copied', read: 'Read the guide',
    ctaH: 'Draw your own flow.', ctaP: 'Free, no sign-up: diagrams stay in your browser.', gh: 'Code on GitHub', theme: 'Toggle light / dark theme',
    prompts: [
      { t: 'Documentation', p: 'Write the documentation of this process for the people who will run it: purpose, who takes part, numbered steps by owner and what happens at each decision. Use only what is in the flow and point out anything that is not defined.' },
      { t: 'Test cases', p: 'List the test cases for this process as a table: scenario, starting condition, steps and expected result. Cover every branch of every decision, including the ones that loop back.' },
      { t: 'Review the logic', p: 'Review the logic of this process. Point out decisions with no way out, loops that may never end, steps with no clear owner and cases the flow does not handle. Do not rewrite the process: list the problems by severity.' }] }
};

const GUIDES = [
{ key: 'onboarding',
  pt: { slug: 'fluxograma-onboarding-colaborador', title: 'Fluxograma de onboarding de um colaborador', short: 'Onboarding de colaborador',
    desc: 'Exemplo de fluxograma de onboarding com RH, gestor, TI e novo colaborador: documentos, contas, primeiro dia e revisão aos 30 dias. Abre no editor e adapta.',
    lead: 'Da proposta aceite à revisão dos 30 dias, com quatro intervenientes. Serve de ponto de partida para equipas de RH que querem um processo igual para toda a gente.',
    steps: ['Começa quando a proposta é aceite: os RH enviam o contrato e pedem os documentos.', 'A primeira decisão trava o processo até os documentos estarem completos antes do primeiro dia; se faltar algo, os RH insistem e voltam a verificar.', 'O gestor prepara o plano da primeira semana e atribui um colega de acompanhamento.', 'A TI cria as contas e prepara o portátil antes de a pessoa chegar.', 'No primeiro dia o novo colaborador levanta o portátil, entra nas contas e faz a formação obrigatória.', 'Aos 30 dias o gestor decide se está tudo no bom caminho. Se não estiver, combina um plano de apoio e volta a rever.'],
    adapt: ['Acrescenta uma lane para a pessoa de acompanhamento se ela tiver tarefas próprias.', 'Se o trabalho for remoto, troca o levantamento do portátil por um passo de envio e outro de confirmação de receção.', 'Usa uma nota na revisão dos 30 dias para escrever os critérios que o gestor avalia.'],
    text: `DIAGRAM: Onboarding de um colaborador

LANES:
RH = Recursos Humanos (department)
GE = Gestor (person)
TI = TI (team)
NC = Novo colaborador (person)

NODES:
RH1 start: Proposta aceite
RH2 step: Envia o contrato e pede os documentos
RH3 decision: Documentos completos antes do 1.º dia?
RH4 step: Insiste nos documentos em falta
GE1 step: Prepara o plano da primeira semana e atribui um colega
TI1 step: Cria as contas e prepara o portátil
NC1 user_action: Primeiro dia: levanta o portátil e entra nas contas
NC2 user_action: Faz a formação obrigatória
GE2 decision: Revisão aos 30 dias: no bom caminho?
GE3 step: Combina um plano de apoio
RH5 end: Onboarding concluído

FLOW:
RH1 > RH2 > RH3
RH3 > GE1 [sim]
RH3 > RH4 [não]
RH4 > RH3
GE1 > TI1 > NC1 > NC2 > GE2
GE2 > RH5 [sim]
GE2 > GE3 [não]
GE3 > GE2` },
  en: { slug: 'employee-onboarding-flowchart', title: 'Employee onboarding flowchart', short: 'Employee onboarding',
    desc: 'Example employee onboarding flowchart with HR, manager, IT and the new hire: documents, accounts, first day and the 30-day review. Open it in the editor and adapt it.',
    lead: 'From the accepted offer to the 30-day review, with four parties. A starting point for HR teams that want the same process for everyone.',
    steps: ['It starts when the offer is accepted: HR sends the contract and asks for the documents.', 'The first decision holds the process until the documents are complete before day one; if something is missing, HR chases it and checks again.', 'The manager prepares the first-week plan and assigns a buddy.', 'IT creates the accounts and prepares the laptop before the person arrives.', 'On day one the new hire collects the laptop, signs in and completes the mandatory training.', 'At 30 days the manager decides whether things are on track. If not, they agree a support plan and review again.'],
    adapt: ['Add a lane for the buddy if they have tasks of their own.', 'For remote work, replace collecting the laptop with a shipping step and a confirmation of receipt.', 'Use a note on the 30-day review to write down the criteria the manager checks.'],
    text: `DIAGRAM: Employee onboarding

LANES:
HR = Human Resources (department)
MG = Manager (person)
IT = IT (team)
NH = New hire (person)

NODES:
HR1 start: Offer accepted
HR2 step: Sends the contract and asks for the documents
HR3 decision: Documents complete before day one?
HR4 step: Chases the missing documents
MG1 step: Prepares the first-week plan and assigns a buddy
IT1 step: Creates the accounts and prepares the laptop
NH1 user_action: Day one: collects the laptop and signs in
NH2 user_action: Completes the mandatory training
MG2 decision: 30-day review: on track?
MG3 step: Agrees a support plan
HR5 end: Onboarding complete

FLOW:
HR1 > HR2 > HR3
HR3 > MG1 [yes]
HR3 > HR4 [no]
HR4 > HR3
MG1 > IT1 > NH1 > NH2 > MG2
MG2 > HR5 [yes]
MG2 > MG3 [no]
MG3 > MG2` } },

{ key: 'expenses',
  pt: { slug: 'fluxograma-aprovacao-despesas', title: 'Fluxograma de aprovação de despesas', short: 'Aprovação de despesas',
    desc: 'Exemplo de fluxograma de aprovação de despesas com colaborador, gestor e finanças: política, limite de 500 EUR, segunda aprovação e reembolso. Abre no editor e adapta.',
    lead: 'Do recibo ao reembolso, com duas decisões: se a despesa cumpre a política e se ultrapassa o limite que exige segunda aprovação.',
    steps: ['O colaborador paga a despesa e submete o pedido com o recibo.', 'O gestor verifica se está dentro da política e do orçamento.', 'Se não estiver, rejeita com o motivo; o colaborador corrige e volta a submeter.', 'As finanças verificam o valor: acima de 500 EUR é precisa uma segunda aprovação do responsável financeiro.', 'O reembolso é agendado no processamento salarial seguinte e o colaborador recebe o valor.'],
    adapt: ['Muda o limite de 500 EUR na decisão para o valor da tua política.', 'Se usas uma ferramenta de despesas, acrescenta uma lane de sistema e liga-a com setas tracejadas (acesso a dados).', 'Acrescenta um ramo para despesas sem recibo, que é o caso que mais gera dúvidas.'],
    text: `DIAGRAM: Aprovação de despesas

LANES:
CO = Colaborador (person)
GE = Gestor (person)
FI = Finanças (department)

NODES:
CO1 start: Paga uma despesa
CO2 user_action: Submete o pedido com o recibo
GE1 decision: Dentro da política e do orçamento?
GE2 step: Rejeita e indica o motivo
CO3 user_action: Corrige e volta a submeter
FI1 decision: Acima de 500 EUR?
FI2 step: Segunda aprovação do responsável financeiro
FI3 step: Agenda o reembolso no processamento seguinte
CO4 end: Recebe o reembolso

FLOW:
CO1 > CO2 > GE1
GE1 > FI1 [sim]
GE1 > GE2 [não]
GE2 > CO3 > GE1
FI1 > FI2 [sim]
FI1 > FI3 [não]
FI2 > FI3 > CO4` },
  en: { slug: 'expense-approval-flowchart', title: 'Expense approval flowchart', short: 'Expense approval',
    desc: 'Example expense approval flowchart with employee, manager and finance: policy check, a 500 EUR threshold, second approval and reimbursement. Open it in the editor and adapt it.',
    lead: 'From receipt to reimbursement, with two decisions: whether the expense follows the policy and whether it is over the threshold that needs a second approval.',
    steps: ['The employee pays the expense and submits the claim with the receipt.', 'The manager checks that it is within policy and budget.', 'If it is not, the manager rejects it with a reason; the employee corrects it and submits again.', 'Finance checks the amount: over 500 EUR needs a second approval from the finance lead.', 'The reimbursement is scheduled in the next payroll run and the employee receives the money.'],
    adapt: ['Change the 500 EUR threshold in the decision to the value in your policy.', 'If you use an expenses tool, add a system lane and connect it with dashed arrows (data access).', 'Add a branch for expenses without a receipt, which is the case that raises most questions.'],
    text: `DIAGRAM: Expense approval

LANES:
EM = Employee (person)
MG = Manager (person)
FI = Finance (department)

NODES:
EM1 start: Pays an expense
EM2 user_action: Submits the claim with the receipt
MG1 decision: Within policy and budget?
MG2 step: Rejects it and gives the reason
EM3 user_action: Corrects it and submits again
FI1 decision: Over 500 EUR?
FI2 step: Second approval by the finance lead
FI3 step: Schedules the reimbursement in the next payroll run
EM4 end: Receives the reimbursement

FLOW:
EM1 > EM2 > MG1
MG1 > FI1 [yes]
MG1 > MG2 [no]
MG2 > EM3 > MG1
FI1 > FI2 [yes]
FI1 > FI3 [no]
FI2 > FI3 > EM4` } },

{ key: 'support',
  pt: { slug: 'fluxograma-ticket-suporte', title: 'Fluxograma de um ticket de suporte', short: 'Ticket de suporte',
    desc: 'Exemplo de fluxograma de tickets de suporte com cliente, primeira e segunda linha: triagem, escalonamento, correção ou solução alternativa e reabertura. Abre no editor e adapta.',
    lead: 'Do pedido do cliente ao fecho do ticket, com escalonamento para a segunda linha e o caso em que o cliente diz que o problema continua.',
    steps: ['O cliente comunica o problema; a primeira linha regista o ticket e define a prioridade.', 'Se for um problema conhecido com solução documentada, a primeira linha aplica-a e responde.', 'Se não for, a segunda linha investiga a causa.', 'Quando é precisa uma alteração ao código, a correção sai na versão seguinte; quando não é, a segunda linha passa uma solução alternativa à primeira.', 'Em ambos os casos é a primeira linha que responde ao cliente.', 'O cliente confirma se ficou resolvido. Se não ficou, o ticket é reaberto e volta à triagem.'],
    adapt: ['Acrescenta um passo de espera com o prazo de resposta de cada prioridade (o teu SLA).', 'Se o cliente não responder, falta um ramo: fechar o ticket ao fim de quantos dias?', 'Usa comentários (tecla M) para marcar os pontos onde a equipa ainda não está de acordo.'],
    text: `DIAGRAM: Ticket de suporte

LANES:
CL = Cliente (person)
PL = Primeira linha (team)
SL = Segunda linha (team)

NODES:
CL1 start: Comunica um problema
PL1 step: Regista o ticket e define a prioridade
PL2 decision: Problema conhecido com solução documentada?
PL3 step: Aplica a solução e responde ao cliente
SL1 step: Investiga a causa
SL2 decision: Precisa de alteração ao código?
SL3 step: Publica a correção na versão seguinte
SL4 step: Passa uma solução alternativa à primeira linha
CL2 decision: Problema resolvido?
PL4 end: Ticket fechado

FLOW:
CL1 > PL1 > PL2
PL2 > PL3 [sim]
PL2 > SL1 [não]
SL1 > SL2
SL2 > SL3 [sim]
SL2 > SL4 [não]
SL3 > PL3
SL4 > PL3
PL3 > CL2
CL2 > PL4 [sim]
CL2 > PL1 [não, reaberto]` },
  en: { slug: 'support-ticket-flowchart', title: 'Support ticket flowchart', short: 'Support ticket',
    desc: 'Example support ticket flowchart with customer, first line and second line: triage, escalation, fix or workaround and reopening. Open it in the editor and adapt it.',
    lead: 'From the customer report to the closed ticket, with escalation to the second line and the case where the customer says the problem is still there.',
    steps: ['The customer reports a problem; the first line logs the ticket and sets the priority.', 'If it is a known issue with a documented fix, the first line applies it and replies.', 'If it is not, the second line investigates the cause.', 'When a code change is needed, the fix ships in the next release; when it is not, the second line gives the first line a workaround.', 'Either way, it is the first line that replies to the customer.', 'The customer confirms whether it is solved. If not, the ticket is reopened and goes back to triage.'],
    adapt: ['Add a wait step with the response time for each priority (your SLA).', 'If the customer never answers, a branch is missing: close the ticket after how many days?', 'Use comments (key M) to mark the points where the team does not agree yet.'],
    text: `DIAGRAM: Support ticket

LANES:
CU = Customer (person)
FL = First line (team)
SL = Second line (team)

NODES:
CU1 start: Reports a problem
FL1 step: Logs the ticket and sets the priority
FL2 decision: Known issue with a documented fix?
FL3 step: Applies the fix and replies to the customer
SL1 step: Investigates the cause
SL2 decision: Needs a code change?
SL3 step: Ships the fix in the next release
SL4 step: Gives the first line a workaround
CU2 decision: Problem solved?
FL4 end: Ticket closed

FLOW:
CU1 > FL1 > FL2
FL2 > FL3 [yes]
FL2 > SL1 [no]
SL1 > SL2
SL2 > SL3 [yes]
SL2 > SL4 [no]
SL3 > FL3
SL4 > FL3
FL3 > CU2
CU2 > FL4 [yes]
CU2 > FL1 [no, reopened]` } }
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (lang, slug) => `/guides/${lang}/${slug ? slug + '/' : ''}`;
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

function shell(lang, o){ // o: title, desc, path, altPath, body
  const u = UI[lang];
  return `<!doctype html>
<!-- Generated by tools/build-guides.js. Do not edit by hand: change the texts there and run it again. -->
<html lang="${u.html}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)} · Diagramico</title>
<meta name="description" content="${esc(o.desc)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Diagramico">
<meta property="og:url" content="${SITE}${o.path}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${u.og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og.png">
<link rel="canonical" href="${SITE}${o.path}">
<link rel="alternate" hreflang="${lang}" href="${SITE}${o.path}">
<link rel="alternate" hreflang="${u.other}" href="${SITE}${o.altPath}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%233347d4'/%3E%3Cpath d='M7 10h9l-2.5 6H7z M18 17l5 5-5 5-5-5z' fill='white'/%3E%3C/svg%3E">
<script>
(function () {
  var t = '';
  try { t = localStorage.getItem('diagramico-theme') || ''; } catch (e) {}
  if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
})();
</script>
<link rel="stylesheet" href="/assets/fonts/inter.css">
<link rel="stylesheet" href="/product-page.css">
<link rel="stylesheet" href="/guides/guides.css">
</head>
<body>
<header class="topbar">
  <div class="wrap topbar__in">
    <a class="brand" href="/?lang=${lang}">
      <span class="brand__mark" aria-hidden="true"><svg class="ico" viewBox="0 0 32 32" fill="currentColor"><path d="M7 10h9l-2.5 6H7z M18 17l5 5-5 5-5-5z"/></svg></span>
      Diagramico
    </a>
    <nav class="nav" aria-label="${esc(u.guides)}">
      <a href="${url(lang)}">${esc(u.guides)}</a>
    </nav>
    <span class="grow"></span>
    <a class="btn btn--outline btn--sm" href="${o.altPath}" hreflang="${u.other}" aria-label="${esc(u.otherAria)}">${u.otherLabel}</a>
    <button class="btn btn--text btn--icon" id="themeToggle" type="button" aria-label="${esc(u.theme)}" title="${esc(u.theme)}"></button>
    <a class="btn btn--primary" href="/app/?lang=${lang}">${esc(u.open)}</a>
  </div>
</header>
<main>
${o.body}
  <section class="lp-sec">
    <div class="wrap lp-center">
      <div class="lp-head lp-head--center">
        <h2>${esc(u.ctaH)}</h2>
        <p>${esc(u.ctaP)}</p>
      </div>
      <a class="btn btn--primary btn--lg" href="/app/?lang=${lang}">${esc(u.open)}</a>
    </div>
  </section>
</main>
<footer class="lp-foot">
  <div class="wrap">
    <span>© Diagramico</span>
    <span><a href="/?lang=${lang}">${esc(u.home)}</a> · <a href="${url(lang)}">${esc(u.guides)}</a> · <a href="https://github.com/dferreiramarques/diagramico">${esc(u.gh)}</a></span>
  </div>
</footer>
<script>
(function () {
  // theme toggle (same key as the landing page and the editor)
  var KEY = 'diagramico-theme', btn = document.getElementById('themeToggle');
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var MOON = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  function paint() { btn.innerHTML = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (document.documentElement.getAttribute('data-theme') === 'dark' ? SUN : MOON) + '</svg>'; }
  btn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    paint();
  });
  paint();
  // copy buttons: data-copy holds the id of the element whose text is copied; data-pre is a text put in front of it
  var flow = document.getElementById('flowText');
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      var text = (b.dataset.pre ? b.dataset.pre + '\\n\\n' : '') + document.getElementById(b.dataset.copy).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        b.textContent = ${JSON.stringify(u.copied)}; setTimeout(function () { b.textContent = label; }, 1600);
      }).catch(function () { var r = document.createRange(); r.selectNodeContents(flow); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    });
  });
  // anonymous count of guide visits (see server/server.js and the "Does the site track me?" answer on the landing page)
  if (/^https?:$/.test(location.protocol) && !/\\.github\\.io$/.test(location.hostname) && navigator.globalPrivacyControl !== true && navigator.doNotTrack !== '1') {
    var r = ''; try { r = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (r === location.hostname) r = '';
    fetch('/api/event', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e: 'guide', r: r }) }).catch(function () {});
  }
})();
</script>
</body>
</html>
`;
}

function guidePage(g, lang){
  const u = UI[lang], c = g[lang], t = encodeURIComponent(c.text);
  const others = GUIDES.filter(x => x !== g);
  const body = `  <section class="wrap g-hero">
    <div class="eyebrow">${esc(u.eyebrow)}</div>
    <h1>${esc(c.title)}</h1>
    <p>${esc(c.lead)}</p>
    <div class="g-cta">
      <a class="btn btn--primary btn--lg" href="/app/?lang=${lang}&amp;t=${t}">${esc(u.openFlow)}</a>
      <span class="g-note">${esc(u.openNote)}</span>
    </div>
  </section>

  <section class="wrap g-sec">
    <div class="demo">
      <div class="bar"><span class="dots"><i></i><i></i><i></i></span><span>${esc(u.live)}: ${esc(c.short)}</span></div>
      <iframe src="/app/?embed=1&amp;lang=${lang}&amp;t=${t}" title="${esc(c.title)}" loading="lazy"></iframe>
      <div class="hint">${esc(u.liveHint)}</div>
    </div>
  </section>

  <section class="wrap g-sec g-text">
    <h2>${esc(u.stepsH)}</h2>
    <ol>
${c.steps.map(s => `      <li>${esc(s)}</li>`).join('\n')}
    </ol>
  </section>

  <section class="wrap g-sec g-text">
    <h2>${esc(u.textH)}</h2>
    <p>${esc(u.textP)}</p>
    <div class="snippet"><pre id="flowText">${esc(c.text)}</pre></div>
    <p class="g-row"><button class="btn btn--outline btn--sm" type="button" data-copy="flowText">${esc(u.copyText)}</button></p>
  </section>

  <section class="wrap g-sec g-text">
    <h2>${esc(u.promptsH)}</h2>
    <p>${esc(u.promptsP)}</p>
    <div class="g-prompts">
${u.prompts.map(p => `      <div class="fcard"><h3>${esc(p.t)}</h3><p>${esc(p.p)}</p><button class="btn btn--outline btn--sm" type="button" data-copy="flowText" data-pre="${esc(p.p)}">${esc(u.copy)}</button></div>`).join('\n')}
    </div>
  </section>

  <section class="wrap g-sec g-text">
    <h2>${esc(u.adaptH)}</h2>
    <ul>
${c.adapt.map(s => `      <li>${esc(s)}</li>`).join('\n')}
    </ul>
  </section>

  <section class="wrap g-sec g-text">
    <h2>${esc(u.moreH)}</h2>
    <ul class="g-more">
${others.map(x => `      <li><a href="${url(lang, x[lang].slug)}">${esc(x[lang].title)}</a></li>`).join('\n')}
    </ul>
  </section>
`;
  return shell(lang, { title: c.title, desc: c.desc, path: url(lang, c.slug), altPath: url(u.other, g[u.other].slug), body });
}

function indexPage(lang){
  const u = UI[lang];
  const body = `  <section class="wrap g-hero">
    <div class="eyebrow">${esc(u.guides)}</div>
    <h1>${esc(u.indexTitle)}</h1>
    <p>${esc(u.indexLead)}</p>
  </section>

  <section class="wrap g-sec">
    <div class="g-prompts">
${GUIDES.map(g => `      <div class="fcard"><h3>${esc(g[lang].title)}</h3><p>${esc(g[lang].lead)}</p><a class="btn btn--outline btn--sm" href="${url(lang, g[lang].slug)}">${esc(u.read)}</a></div>`).join('\n')}
    </div>
  </section>
`;
  return shell(lang, { title: u.indexTitle, desc: u.indexDesc, path: url(lang), altPath: url(u.other), body });
}

function write(rel, text){ const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); console.log('wrote', rel); }

const pairs = [[url('pt'), url('en')], ...GUIDES.map(g => [url('pt', g.pt.slug), url('en', g.en.slug)])];
for (const lang of ['pt', 'en']){
  write(`guides/${lang}/index.html`, indexPage(lang));
  for (const g of GUIDES) write(`guides/${lang}/${g[lang].slug}/index.html`, guidePage(g, lang));
}

const alt = (pt, en, def) => `    <xhtml:link rel="alternate" hreflang="pt" href="${SITE}${pt}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${en}"/>` + (def ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${def}"/>` : '');
const entry = (loc, links) => `  <url>\n    <loc>${SITE}${loc}</loc>\n${links ? links + '\n' : ''}  </url>`;
const home = alt('/?lang=pt', '/?lang=en', '/');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by tools/build-guides.js -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[entry('/', home), entry('/?lang=pt', home), entry('/?lang=en', home), entry('/app/', ''),
   ...pairs.flatMap(([pt, en]) => [entry(pt, alt(pt, en)), entry(en, alt(pt, en))])].join('\n')}
</urlset>
`);
