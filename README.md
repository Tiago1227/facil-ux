# Loja Fácil

Protótipo clicável de e-commerce para teste de usabilidade com pessoas de 45 a 60 anos. A loja é fictícia: não cobra, não envia dados e não tem relação com a Amazon.

O visual e o fluxo seguem o que esse público já encontra em uma loja grande (cabeçalho escuro, busca, “Olá, faça seu login”, carrinho, página do produto, login em dois passos e fechamento da compra). Por cima disso entram as melhorias do TCC: letra maior, contraste forte, menos informação ao mesmo tempo, rótulos em linguagem simples, botões grandes, etapas visíveis, busca que aceita erro de digitação, desfazer ao remover e ajuda sempre à vista.

## Como abrir

Não há build. Na pasta do projeto:

```bash
python3 serve.py
```

Abra [http://127.0.0.1:41731/](http://127.0.0.1:41731/).

Também dá para abrir o arquivo `index.html` direto no navegador.

A loja fica em [http://127.0.0.1:41731/](http://127.0.0.1:41731/).

## Artigo

O texto do trabalho fica em `artigo/`: `main.tex`, `referencias.bib` e as figuras. Para gerar o PDF, com TeX Live e o pacote `abntex2`:

```bash
cd artigo
latexmk -pdf main.tex
```

Sem o `latexmk`:

```bash
cd artigo
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

O que a compilação gera (`.aux`, `.log`, `.bbl`, PDF e similares) fica de fora do Git.

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

O carrinho e o nome usado no “Olá” permanecem na aba (`sessionStorage`) para a compra não se perder num recarregamento.

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
