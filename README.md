# Flexibooth Templates

Sistema de templates HTML/CSS para convites digitais.

## Como começar

1. Corre `make install` para instalar o Sass.
2. Corre `make watch` para iniciar o ambiente de desenvolvimento. Qualquer alteração num ficheiro `.scss` dentro da pasta `sass/` de um template será automaticamente compilada para a respetiva pasta `css/`.
3. Para compilar tudo para produção (minificado), corre `make build`.

## Criar um novo template

Duplica a pasta `templates/00-template-base`, dá-lhe um novo nome (ex: `01-casamento-joao`) e altera as variáveis no ficheiro `sass/_variables.scss`.
