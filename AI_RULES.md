# Diretrizes do Projeto Construgaiver

Este documento estabelece as regras e a stack tecnológica a ser utilizada no desenvolvimento e manutenção desta aplicação.

## 1. Stack Tecnológica

O projeto é construído com as seguintes tecnologias:

*   **Framework:** React (com Vite)
*   **Linguagem:** TypeScript
*   **Roteamento:** React Router (mantendo as rotas em `src/App.tsx`)
*   **Estilização:** Tailwind CSS (com foco em design responsivo)
*   **Componentes UI:** shadcn/ui (baseado em Radix UI)
*   **Backend/Database/Auth:** Supabase (`@supabase/supabase-js`)
*   **Gerenciamento de Estado/Cache:** React Query (`@tanstack/react-query`)
*   **Validação de Formulários:** Zod (`zod`) e React Hook Form (`react-hook-form`)
*   **Notificações:** Sonner (`sonner`) para feedback ao usuário.
*   **Ícones:** Lucide React (`lucide-react`)

## 2. Regras de Uso de Bibliotecas

Para garantir a consistência e manutenibilidade, siga estas regras ao implementar novas funcionalidades:

| Funcionalidade | Biblioteca/Tecnologia Preferida | Regras de Uso |
| :--- | :--- | :--- |
| **Interface do Usuário (UI)** | `shadcn/ui` | Utilize os componentes existentes em `src/components/ui/`. Evite criar componentes customizados para elementos já cobertos (ex: Botão, Card, Input). |
| **Estilização** | Tailwind CSS | Use classes do Tailwind para todo o layout, cores, espaçamento e responsividade. Classes customizadas devem ser evitadas. |
| **Roteamento** | `react-router-dom` | Use o componente `NavLink` customizado (`@/components/NavLink`) para links de navegação. Mantenha a estrutura de rotas em `src/App.tsx`. |
| **Acesso a Dados (CRUD)** | `supabase` client | Use o cliente Supabase importado de `@/integrations/supabase/client` para todas as operações de banco de dados e autenticação. |
| **Gerenciamento de Estado Assíncrono** | `react-query` | Utilize `useQuery` e `useMutation` para buscar, armazenar em cache e modificar dados do servidor. |
| **Validação de Dados** | `zod` | Defina schemas Zod para validar dados de entrada, especialmente em formulários e antes de inserções no Supabase. |
| **Formulários** | `react-hook-form` | Use `react-hook-form` em conjunto com `zod` (via `@hookform/resolvers`) para gerenciar o estado e a submissão de formulários. |
| **Notificações/Toasts** | `sonner` | Use a função `toast` do `sonner` para exibir mensagens de sucesso, erro ou informação ao usuário. |
| **Ícones** | `lucide-react` | Use ícones do pacote `lucide-react`. |

## 3. Estrutura de Arquivos

*   **Páginas:** Devem residir em `src/pages/`.
*   **Componentes:** Devem residir em `src/components/`.
*   **Componentes de Layout:** Devem residir em `src/components/layout/`.
*   **Novos Componentes:** Crie um novo arquivo para cada novo componente, mesmo que pequeno.