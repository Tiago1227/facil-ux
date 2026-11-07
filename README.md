# Loja Fácil

Protótipo clicável de e-commerce para teste de usabilidade com pessoas de 45 a 60 anos. A loja é fictícia: não cobra, não envia dados e não tem relação com a Amazon.

O visual e o fluxo seguem o que esse público já encontra em uma loja grande (cabeçalho escuro, busca, “Olá, faça seu login”, carrinho, página do produto, login em dois passos e fechamento da compra). Por cima disso entram as melhorias do TCC: letra maior, contraste forte, menos informação ao mesmo tempo, rótulos em linguagem simples, botões grandes, etapas visíveis, busca que aceita erro de digitação, desfazer ao remover e ajuda sempre à vista.

## Como abrir

Não há build. Na pasta do projeto:

```bash
python3 serve.py
```

Abra [http://127.0.0.1:41731/](http://127.0.0.1:41731/).

Também dá para abrir o arquivo `index.html` direto no navegador. O registro do teste entre a loja e a página da pesquisa funciona melhor com o servidor, porque as duas páginas ficam na mesma origem.

Atalhos:

- Loja: [http://127.0.0.1:41731/](http://127.0.0.1:41731/)
- Registro do teste: [http://127.0.0.1:41731/admin](http://127.0.0.1:41731/admin)
- Faixa discreta de teste na loja: [http://127.0.0.1:41731/?teste=1](http://127.0.0.1:41731/?teste=1)

## Roteiro das cinco tarefas

Use um e-mail inventado, como `maria@teste.com`, e uma senha inventada com 6 ou mais caracteres. Não use senha nem cartão reais.

1. **Login.** Clique em “Olá, faça seu login”. E-mail primeiro, senha depois. “Mostrar senha” deixa a senha visível.
2. **Buscar.** Digite na barra do topo. `foni` encontra o fone; a lista e o “você quis dizer” cobrem erro de digitação.
3. **Adicionar.** No produto, use “Adicionar ao carrinho” ou “Comprar agora”.
4. **Remover.** No carrinho, “Remover” e, se foi sem querer, “Desfazer”.
5. **Finalizar.** “Finalizar compra”, endereço, pagamento e revisão. No teste, o cartão é `4242 4242 4242 4242`, validade `12/28`, código `123`. Pix e boleto também são simulados.

A confirmação mostra um número de pedido. Nenhum valor é cobrado.

## O que não é gravado

Senha, endereço e pagamento ficam só na memória da aba enquanto a compra não termina, e são apagados na confirmação ou ao sair da página. Eles não vão para `localStorage`, `sessionStorage` nem para a rede.

O carrinho e o nome usado no “Olá” permanecem na aba (`sessionStorage`) para o teste não se perder num recarregamento. O registro de tempos fica só neste navegador (`localStorage`), sem senha, endereço ou cartão.

## Registro para a pesquisa

Abra `/admin` (ou `admin.html`) em outra aba do mesmo navegador.

1. Digite um código (P01, P02…) e clique em **Começar nova sessão** antes de cada pessoa.
2. A pessoa faz as tarefas na loja.
3. A tabela mostra tempo e erros de login, buscar, adicionar, remover e finalizar.
4. **Exportar CSV** gera um arquivo com ponto e vírgula e acentos, para o Excel em português.

“Reiniciar” zera uma tarefa sem apagar as outras. “Apagar registros” pede um segundo clique.

O relógio de cada tarefa começa na tela correspondente e para quando a pessoa conclui. Erro de validação, busca sem resultado e desfazer uma remoção entram na contagem.

## Melhorias em relação à loja de referência

| Dificuldade no questionário | O que o protótipo faz |
| --- | --- |
| Login | Dois passos com rótulo, exemplo de e-mail, “Mostrar senha” e erro que diz o que falta |
| Finalizar a compra | Indicador Endereço → Pagamento → Revisão, campos nomeados e confirmação antes de concluir |
| Busca | Sugestões enquanto digita e tolerância a erro de digitação |
| Remover do carrinho | Botão “Remover” com texto e “Desfazer” sem limite de tempo |
| Leitura e clique | Texto base em torno de 19 px, botões de 52 px, contraste alto e menos blocos na página |
| Ajuda | Link “Ajuda” no cabeçalho, com os cinco passos em linguagem simples |
| Teclado | Pular para o conteúdo, foco visível, Tab, Enter e Esc |

Heurísticas de Nielsen usadas na interface: visibilidade do estado, linguagem simples, saída e desfazer, consistência, prevenção de erro, reconhecimento, mensagem de erro clara e ajuda. Diretrizes WCAG 2.1 consideradas: contraste, rótulos, foco visível, alvo de toque grande, erro identificado em texto e uso sem depender só da cor.
