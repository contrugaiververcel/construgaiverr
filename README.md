# Construgaiver

Bem-vindo ao repositório do **Construgaiver**, a sua plataforma e marketplace ideal para materiais de construção e serviços relacionados. 

Este projeto é uma aplicação web moderna construída para oferecer uma experiência de ponta tanto para os clientes que buscam ferramentas e materiais, quanto para os vendedores que gerenciam seus produtos, controle de vendas e pedidos.

## Tecnologias Utilizadas

O projeto foi desenvolvido com as seguintes tecnologias:

- **React** e **Vite** para interfaces rápidas, dinâmicas e servidor de desenvolvimento leve
- **TypeScript** para uma base de código mais segura, com tipagem estática e escalável
- **Tailwind CSS** para estilização utilitária e desenvolvimento responsivo rápido
- **shadcn/ui** para componentes de interface elegantes, consistentes e acessíveis
- **Supabase** como _Backend-as-a-Service_ (BaaS), gerenciando o banco de dados PostgreSQL, autenticação de usuários e _Edge Functions_

## Como executar o projeto localmente

Siga os passos abaixo para rodar o projeto diretamente em sua máquina para desenvolvimento e testes:

### 1. Pré-requisitos

Certifique-se de ter o **Node.js** (versão 18+ recomendada) e o **npm** instalados em sua máquina.

### 2. Clonando o repositório

Abra o seu terminal e execute:

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd construgaiver
```

### 3. Instalando dependências

Execute o comando abaixo para baixar e instalar todas as dependências do projeto listadas no `package.json`:

```bash
npm install
```

### 4. Configurando Variáveis de Ambiente

Para conectar a aplicação ao banco de dados e outros serviços, você precisará configurar as variáveis de ambiente.
Crie um arquivo `.env` na raiz do projeto e configure as chaves necessárias (URL do projeto Supabase e chave de API anônima).

### 5. Executando o servidor de desenvolvimento

Inicie o servidor local com o comando:

```bash
npm run dev
```

O Vite iniciará o servidor, e o projeto estará disponível no seu navegador, geralmente no endereço [http://localhost:8080](http://localhost:8080) ou na porta indicada no terminal.

## Estrutura Principal

Algumas das áreas principais do sistema incluem:
- **Painel do Vendedor**: Gerenciamento de itens e ferramentas à venda.
- **Pedidos e Checkout**: Fluxo completo de compra, carrinho e confirmação para os usuários finais.
- **Perfil do Usuário**: Atualização de dados e histórico de atividades.
- **Edge Functions**: Como o envio automatizado de e-mails de confirmação de pedido via Supabase.
