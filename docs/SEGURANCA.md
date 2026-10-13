# Segurança do Diagramico

Revisão feita em 2026-10-13 ao editor (`app/index.html`) e à landing (`index.html`). Não substitui uma auditoria externa.

## O que está em jogo

Hoje o Diagramico é só cliente: não há contas, nem servidor, nem pedidos de rede com dados do utilizador. Os diagramas ficam no `localStorage` do browser e só saem dele se o utilizador os exportar ou partilhar a ligação `#d=…` (o fragmento, depois do `#`, nunca é enviado a um servidor). O risco realista é, por isso, **código malicioso a correr na página** (XSS) ou **dados externos que a app aceita sem validar** (ligações de partilha, ficheiros importados).

## Verificações e resultado

| Área | Resultado |
|---|---|
| **XSS por `innerHTML`** | Todos os usos de `innerHTML` recebem texto fixo da app (ícones, traduções, contagens). O texto do utilizador (nomes, formas, rótulos, ficheiros importados) entra só por `textContent`, `value` ou é desenhado no canvas. Sem `eval`, `new Function`, `document.write`, `postMessage` nem `window.open` |
| **Exportações** | O SVG escapa o texto (`svgEsc`) e não leva scripts. O Mermaid passa a codificar `<` e `>` (`#lt;`, `#gt;`) e as aspas, para que um rótulo não seja lido como HTML por um renderizador permissivo |
| **Ligação de partilha `#d=…`** | Dados não confiáveis. **Corrigido:** limite de tamanho descomprimido (8 MB) contra "bombas de compressão"; tamanho máximo do fragmento; validação campo a campo (`sanitizeNodes`, `sanitizeEdges`): só tipos de forma conhecidos, números finitos, textos limitados, enumerações válidas, setas só entre formas existentes, ids como `__proto__` descartados. Testado com uma bomba de 200 MB (rejeitada em segundos) e com um documento malicioso (sanitizado, sem poluição de protótipos) |
| **Importar JSON (cópias de segurança)** | **Corrigido:** passava os dados sem validar, o que permitia um ficheiro estragado "envenenar" o armazenamento local. Passa pela mesma validação |
| **Importar draw.io e Visio** | O XML é lido com `DOMParser`, que não resolve entidades externas. A descompressão tem agora um limite (64 MB) |
| **Terceiros** | Só o Google Fonts (folha de estilos e tipos de letra). Sem analytics, sem bibliotecas npm no editor. O GIF e a ferramenta de gravação usam bibliotecas externas só na máquina de quem grava |
| **Política de segurança (CSP)** | **Acrescentada** em `<meta>` na app e na landing: sem origens externas além das fontes, `connect-src 'self'` (mesmo que algo corresse, não conseguia enviar dados para fora), sem `object`, sem `base`, sem formulários |
| **Pré-visualização de PNG/SVG** | **Corrigido (não era uma falha de segurança):** usava endereços `blob:`, que a política do Railway bloqueia. Passa a usar `data:` |

## O que ainda fica por fazer

1. **Clickjacking:** a app pode ser incorporada por qualquer site (não há `frame-ancestors`; isso só se define com um cabeçalho HTTP, não com `<meta>`). Sem contas, o impacto é baixo; **tem de ser fechado antes de haver login** (cabeçalho `Content-Security-Policy: frame-ancestors 'self'` e `X-Frame-Options` no servidor). A landing e a demo usam `iframe` do próprio domínio, que continua a ser permitido.
2. **Tipos de letra do Google:** cada visitante envia o IP à Google (tem implicações de RGPD na UE). A correção é descarregar o IBM Plex para o repositório e servi-lo localmente, o que tira a única dependência externa e faz a app descarregada funcionar idêntica offline.
3. **`'unsafe-inline'` no script:** como o editor é um único ficheiro com o código inline, a política tem de o permitir. Um XSS futuro passaria, mas não conseguiria enviar dados para fora (`connect-src 'self'`). Dividir o código em ficheiros externos permitiria retirar o `'unsafe-inline'`.
4. **`window.__diagramico`:** ponteiro de teste exposto globalmente (exportar, importar, estado). Não é explorável hoje, mas convém tirá-lo da versão de produção.
5. **Dados em claro no browser:** o `localStorage` não está cifrado, como em qualquer app deste tipo. Quem tem acesso à máquina ou a uma extensão com permissões de leitura vê os diagramas.
6. **Domínio:** se o serviço do Railway for apagado e o CNAME `diagramico.monco.io` ficar a apontar para lá, alguém pode reclamar o endereço (*subdomain takeover*). Remover o registo DNS ao desativar o serviço.

## Para as Equipas (Fase 1 a 3 do roadmap)

Quando houver contas, salas e comentários passam a existir riscos novos: autorização por papel feita **no servidor**, ligações de colaboração com tokens longos e revogáveis, validação de cada operação recebida por WebSocket (reutilizar `sanitizeNodes`/`sanitizeEdges`), limite de tamanho e de ritmo por sala, cabeçalhos de segurança (`frame-ancestors`, HSTS), CORS restrito, verificação do token Google no servidor, e cópias de segurança. O texto dos comentários continua a ser mostrado só com `textContent`.

## Como comunicar uma falha

Abrir um *Security Advisory* privado no repositório do GitHub, ou contactar o autor diretamente, em vez de um *issue* público.
