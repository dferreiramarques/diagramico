# Prompt: segmentar contribuições humanas e de IA num projeto

Prompt reutilizável para pedir a uma IA que documente quem fez o quê num projeto feito em conjunto. Foi usado no Diagramico para produzir [`AUTORIA.md`](AUTORIA.md); as práticas que o tornam mais fácil estão em [`BOAS-PRATICAS-AUTORIA.md`](BOAS-PRATICAS-AUTORIA.md).

## Como usar

1. Cola o prompt **no fim da conversa** com a IA que fez o trabalho. Ela só consegue documentar o que está nessa conversa.
2. Se o projeto teve **várias conversas**, usa-o em cada uma. A partir da segunda, cola o documento anterior no sítio indicado para que a IA o complete em vez de começar do zero.
3. Se a IA tiver acesso ao repositório, pede-lhe também que leia o histórico do Git.
4. Substitui os campos entre `[ ]`.
5. Responde às perguntas que a IA deixar no fim e corre o prompt outra vez, se for preciso.

## O prompt

```markdown
# Documentar a autoria do projeto [NOME DO PROJETO]

Estou a documentar a autoria do **[NOME DO PROJETO]** ([descrição numa frase]). Esta conversa cobre [o ponto de partida / a fase X / todo o projeto], de [DATA DE INÍCIO] a [DATA DE FIM].
[Se existir: O documento produzido noutras conversas está colado no fim, entre as marcas === DOCUMENTO EXISTENTE ===.]

## O que te peço

1. **Lê esta conversa inteira** e, se tiveres acesso, o histórico do Git (autores, datas, mensagens, indicações de coautoria).
2. Escreve um capítulo com quatro partes:
   - **Decisões, ideias e design de produto da pessoa**, em tabela *Tema | A decisão ou ideia*: o que pedi, escolhi, corrigi ou recusei; o propósito, o público e o posicionamento; as funcionalidades que defini e como devem comportar-se; as correções que fiz. Usa as minhas palavras quando forem marcantes.
   - **Trabalho da IA**, em tabela *Área | O que a IA fez*: código, textos, análises, testes, alternativas propostas. Assinala o que a IA decidiu sozinha, sem eu pedir.
   - **Propostas da IA que aprovei**: a ideia foi tua, a decisão foi minha. Diz se a aprovação foi explícita ou tácita (continuei sem contestar). Lista também as propostas que não segui.
   - **Limites do que sabes**: o que não consta nesta conversa ou foi provavelmente feito noutros sítios.
3. Aplica o **teste do pedido genérico**: o que farias se alguém pedisse só "[pedido genérico equivalente, por exemplo: faz uma ferramenta de diagramas]"? Faz uma tabela com duas colunas: o que existiria de qualquer forma e o que só existe por causa dos meus inputs. Identifica o input com mais efeito no produto.
4. **Segmenta o meu papel** em três: design de produto e de interação, direção de arte, supervisão de design. Diz o peso de cada um *com factos*, sem percentagens, e sugere a designação mais exata para o conjunto.
5. Acrescenta uma **cronologia curta** com datas e horas (da conversa e dos commits) e uma **tabela de commits** com o que entrou em cada um.
6. [Se houver documento existente: junta tudo num **único documento coerente**, atualiza a secção de limites e mantém as tabelas.]
7. Entrega em **markdown, em [português de Portugal / outra língua]**, pronto a guardar como `AUTORIA.md`.

## Regras

- **Só afirmes o que está nesta conversa ou no Git.** Se algo não aparece, escreve "não consta nesta conversa".
- **Não inflaciones nenhum dos lados.** Diz claramente quando a ideia foi tua e eu só aprovei, e quando foi minha e tu só executaste. Se aceitei propostas sem discutir, di-lo.
- **Sem percentagens** nem pontuações de "quanto" cada um fez.
- **Cita factos concretos**: datas, funcionalidades, decisões, correções, commits.
- **Verifica o que puderes** (por exemplo, se um ficheiro no Git é igual ao que entregaste) e diz o que não conseguiste verificar.
- Isto **não é aconselhamento jurídico**: serve para organizar provas e levar a um advogado. Mantém essa nota no documento.
- Se tiveres dúvidas, faz-me as perguntas **no fim**, em lista.

=== DOCUMENTO EXISTENTE ===
[colar aqui, ou apagar esta secção]
=== FIM DO DOCUMENTO EXISTENTE ===
```

## O que esperar

Um documento com:

- os limites;
- uma cronologia;
- a divisão do trabalho;
- um capítulo por conversa (decisões da pessoa, trabalho da IA, propostas aprovadas, limites);
- o teste do pedido genérico e a segmentação de papéis;
- a tabela de commits, os próximos passos e as questões em aberto.

Revê-o antes de o guardar. A IA pode enganar-se nas datas ou atribuir uma ideia ao lado errado. Corrige o que estiver mal; essa correção também é registo teu.
