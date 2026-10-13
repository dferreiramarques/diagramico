# Boas práticas: direção humana em projetos feitos com IA

Guia para trabalhar com uma IA (Claude, Claude Code, outras) de forma a que o produto fique melhor e a contribuição humana fique **clara e demonstrável**. Nasceu da documentação de autoria do Diagramico ([`AUTORIA.md`](AUTORIA.md)).

**Não é aconselhamento jurídico.** A proteção do que é escrito por IA depende da jurisdição e deve ser confirmada com um advogado.

## A ideia central

Quando a IA escreve o código e os textos, o trabalho humano de maior valor é a **direção de produto e de design**:

| Papel | O que é | Como se vê |
|---|---|---|
| **Design de produto e de interação** | Definir o propósito, o público, o âmbito, as regras de comportamento, o que fica de fora | Especificações, requisitos, decisões entre alternativas |
| **Direção de arte** | Definir a identidade: tipografia, tom, aspeto, referências | Escolhas de estilo, recusas de estilo |
| **Supervisão de design** | Testar, encontrar o que está mal, corrigir a direção, aprovar ou rejeitar | Relatos de erros, capturas de ecrã, requisitos alterados |

O peso humano **cresce com cada escolha e cada rejeição**, e **dilui-se** quando as propostas da IA são aceites sem discussão.

## Antes de começar

1. **Escreve o propósito numa frase.** "Para quem é, o que resolve, o que o torna diferente." No Diagramico foi: "desenhar fluxos para uma IA ler como documentação, com poucos tokens". Foi o input que mais mudou o produto.
2. **Define o âmbito pela negativa.** O que fica de fora do MVP é uma decisão tão forte como o que entra.
3. **Escolhe uma única fonte de verdade.** Um repositório Git desde o primeiro dia. Artefactos, zips e cópias noutros sítios são saídas desse repositório, nunca versões paralelas.
4. **Cria o registo de decisões** (`docs/DECISOES.md`) antes do primeiro pedido à IA.

## Durante o trabalho

### Pedir

- **Dá a intenção, não só a tarefa.** "A caixa cresce com o texto porque quero diagramas consistentes" produz melhor resultado e prova melhor a autoria do que "faz caixas automáticas".
- **Pede alternativas quando a escolha importa.** "Dá-me três formas de resolver isto, com os contras de cada uma." Depois escolhe e diz porquê.
- **Quando delegas, di-lo.** "Escolhe tu o formato" é legítimo, mas fica registado como decisão da IA.

### Avaliar

- **Testa tu, com casos reais**, e não só a demonstração da IA.
- **Rejeita e corrige por escrito**, com capturas de ecrã quando for visual. Cada "não, assim" é design teu.
- **Desconfia do "está ótimo" automático.** Antes de aprovar, pergunta: "o que é que a IA escolheu aqui sem eu pedir?" Revê essas escolhas uma a uma.
- **Pede à IA que liste as decisões que tomou sozinha** no fim de cada entrega.

### Registar

- **Uma entrada por decisão**, no momento:

  ```markdown
  ## 2026-10-12 · Lanes coladas
  **Problema:** as lanes sobrepõem-se e é difícil alinhá-las.
  **Decisão:** lanes que colidem ficam coladas; a que se move herda as propriedades da outra; um ícone de corrente separa-as.
  **Origem:** minha. A IA implementou.
  **Alternativas rejeitadas:** encaixe automático sem herança (proposta da IA).
  ```

- **Commits pequenos, com a origem na mensagem** e a coautoria da IA declarada:

  ```
  Lanes coladas com herança de propriedades

  Especificação: David. Implementação: Claude.
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

- **Não faças "Add files via upload".** Descreve o que entrou.

## Antes de fechar uma fase

1. **Exporta as conversas** com a IA e guarda-as fora do repositório, com a data.
2. **Atualiza o documento de autoria** com o prompt reutilizável ([`PROMPT-SEGMENTACAO-AUTORIA.md`](PROMPT-SEGMENTACAO-AUTORIA.md)).
3. **Confirma que as cópias coincidem** com o repositório (artefactos publicados, zips, cópias em projetos de IA).
4. **Responde às questões em aberto** que o documento de autoria levantar.

## Erros a evitar

| Erro | Porque é um problema | Em vez disso |
|---|---|---|
| Aceitar tudo o que a IA entrega | A decisão passa a ser dela; o teu papel fica invisível | Rever as escolhas que a IA fez sozinha |
| Decisões só no chat | Perdem-se e são difíceis de provar | Registo de decisões com data |
| Várias cópias do projeto | Versões divergem sem ninguém notar (aconteceu no Diagramico) | Uma fonte de verdade e cópias geradas a partir dela |
| Commits sem descrição | O histórico não mostra quem decidiu o quê | Mensagens com a origem e a coautoria |
| Exagerar o próprio papel | Perde credibilidade perante terceiros | Dizer com clareza quando a ideia foi da IA e a decisão foi tua |
| Percentagens de autoria | Não há medida honesta | Factos concretos: datas, decisões, correções |

## Lista rápida

- [ ] Propósito numa frase, escrito antes do primeiro pedido
- [ ] Âmbito pela negativa
- [ ] Repositório como única fonte de verdade
- [ ] Registo de decisões atualizado
- [ ] Alternativas pedidas nas escolhas importantes
- [ ] Escolhas da IA revistas, não só aprovadas
- [ ] Testes com casos reais, erros relatados por escrito
- [ ] Commits descritivos com coautoria declarada
- [ ] Conversas exportadas e guardadas
- [ ] Documento de autoria atualizado no fim de cada fase
