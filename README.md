# 💰 Financial Control (Controle Financeiro)

Aplicação web colaborativa para controle financeiro pessoal e compartilhado. Permite o acompanhamento detalhado de gastos pendentes e quitados, faturas de múltiplos cartões de crédito (com cálculo de parcelas sem dízimas), despesas recorrentes, boletos, PIX e débito, além de alternância instantânea entre contas pessoais e conjuntas (*workspaces*).

---

## 🚀 Tecnologias

- **Backend:** [NestJS](https://nestjs.com/) (TypeScript), [Prisma ORM](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/)
- **Segurança & Autenticação:** Hash de senhas com **Argon2id** (padrão ouro OWASP), JWT com Access & Refresh Tokens em cookies `HttpOnly`, Google OAuth 2.0 (OpenID Connect), proteção de rotas com `AccountContextGuard` e `RolesGuard`
- **Frontend:** [Next.js 14+](https://nextjs.org/) (App Router, Server Components), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Monorepo:** Configurado com npm workspaces (`backend` e `frontend`)

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- **[Node.js](https://nodejs.org/)** (v20+ LTS recomendado)
- **[npm](https://www.npmjs.com/)** (incluso com o Node)
- **[Docker & Docker Compose](https://www.docker.com/)** (para subir o banco de dados PostgreSQL facilmente) ou uma instância local do PostgreSQL 15+

---

## 🛠️ Passo a Passo para Execução Local

### 1. Clonar o Repositório e Instalar Dependências

### 🐳 Opção 1: Execução Total via Docker (Recomendado para Deploy/Teste Rápido)

Para construir as imagens e iniciar toda a stack (PostgreSQL, Backend NestJS e Frontend Next.js) com um único comando:

```bash
# Construir as imagens e iniciar todos os containers em background:
docker compose up --build -d
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001/api/v1](http://localhost:3001/api/v1)
- **PostgreSQL:** `localhost:5432`

> **Como funciona:** O container do backend aguarda o banco estar saudável (*healthy*), executa as migrações do Prisma automaticamente (`prisma migrate deploy`) e inicia a API. O container do frontend roda em modo otimizado *standalone*.

Para visualizar os logs ou parar os containers:
```bash
# Ver logs de todos os serviços:
docker compose logs -f

# Parar os serviços:
docker compose down
```

---

### 💻 Opção 2: Desenvolvimento Local (Com Hot-Reload)

Caso queira desenvolver e testar com *Hot-Reload* em tempo real:

#### 1. Instalar Dependências na Raiz
```bash
npm install
```

#### 2. Subir apenas o Banco de Dados via Docker
```bash
# Sobe exclusivamente o PostgreSQL:
docker compose up -d postgres
```

#### 3. Configurar as Variáveis de Ambiente

##### A. Backend (`backend/.env`)
Copie o arquivo de exemplo:
```bash
cp backend/.env.example backend/.env
```

Conteúdo padrão do `backend/.env`:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Conexão com o PostgreSQL (compatível com o docker-compose.yml)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/financial_db?schema=public

# Chaves de assinatura dos tokens JWT
JWT_ACCESS_SECRET=super_secret_access_jwt_key_change_in_production_123456
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_change_in_production_abcdef

# Credenciais do Google OAuth 2.0 (Opcional para login social)
GOOGLE_CLIENT_ID=seu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
```

#### B. Frontend (`frontend/.env.local`)

Copie o arquivo de exemplo do frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Conteúdo padrão do `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

### 4. Executar as Migrações do Prisma

Com o PostgreSQL em execução, gere o cliente do Prisma e aplique a migração inicial no banco:

```bash
# Acessar a pasta do backend:
cd backend

# Gerar o cliente Prisma tipado:
npx prisma generate

# Aplicar a migração do banco de dados:
npx prisma migrate dev

# Retornar à raiz do projeto:
cd ..
```

---

### 5. Iniciar os Servidores em Desenvolvimento

Você pode iniciar os servidores diretamente da raiz ou em terminais separados:

#### Opção A: Executar a partir da raiz (Recomendado)

Abra dois terminais na raiz do projeto:

**Terminal 1 (Backend - NestJS):**
```bash
npm run dev:backend
```
> O backend estará acessível em: `http://localhost:3001` (com rotas em `/api/v1`)

**Terminal 2 (Frontend - Next.js):**
```bash
npm run dev:frontend
```
> O frontend estará acessível em: `http://localhost:3000`

---

## 🧪 Executando os Testes

Para rodar a suíte de testes unitários do backend (incluindo validações do hash Argon2id e do guard de multi-tenancy):

```bash
# Executar testes do backend:
npm run test:backend
```

Ou diretamente na pasta `backend/`:
```bash
cd backend
npm test
```

---

## 🏗️ Estrutura do Projeto

```text
financial/
├── docker-compose.yml          # Container PostgreSQL local para desenvolvimento
├── package.json                # Gerenciador de workspaces (backend + frontend)
├── docs/                       # Documentação e especificações de produto
│   ├── requirements/
│   │   └── PRD-financial.md    # Product Requirements Document (PRD completo)
│   └── F01-.../
│       ├── spec.md             # Especificação técnica da F01
│       └── plan.md             # Plano de implementação da F01
├── skills/                     # Guias e habilidades do assistente (Next.js, NestJS, etc.)
├── backend/                    # API Restful em NestJS
│   ├── prisma/
│   │   ├── schema.prisma       # Modelagem dos dados (Users, Accounts, Memberships)
│   │   └── migrations/         # Histórico de migrações SQL versionadas
│   ├── src/
│   │   ├── common/             # Guards (JWT, Tenant, RBAC), Decorators e Filters
│   │   ├── modules/
│   │   │   ├── auth/           # Módulo de Autenticação (Email/Senha, Google OAuth, Argon2id)
│   │   │   ├── accounts/       # Módulo de Workspaces, Convites e Membros
│   │   │   └── prisma/         # Conexão e ciclo de vida do Prisma Client
│   │   ├── app.module.ts
│   │   └── main.ts             # Bootstrap com Helmet, CORS, Cookies e ValidationPipe
│   └── test/                   # Testes unitários e de integração
└── frontend/                   # Interface Web em Next.js 14+ (App Router)
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/         # Telas de Login e Cadastro
    │   │   ├── (dashboard)/    # Painel principal e tela de membros
    │   │   └── layout.tsx      # Layout raiz com AuthProvider
    │   ├── components/layout/  # AppHeader e AccountSwitcher
    │   ├── lib/                # Cliente HTTP (api-client) e Contexto de Autenticação
    │   └── middleware.ts       # Proteção de rotas no Edge
    └── postcss.config.mjs      # Configuração do Tailwind CSS v4
```

---

## 📌 Funcionalidades Entregues (F01 - Foundation)

- [x] **Autenticação Híbrida:** Login e Cadastro com E-mail e Senha (com regras de complexidade e Argon2id) + Login Social via Google OAuth 2.0.
- [x] **Sessões Seguras:** Access Token (15 min) e Refresh Token (7 dias com rotação) em cookies `HttpOnly`, `SameSite=Lax`.
- [x] **Multi-Tenancy (*Workspaces*):** Provisão automática da conta pessoal como Administrador no momento do cadastro.
- [x] **Seletor de Contas (*Account Switcher*):** Alternância instantânea no cabeçalho entre contas pessoais e conjuntas sem deslogar.
- [x] **Gestão de Membros & Convites:** Administradores podem convidar membros por e-mail com papéis de `Administrador` ou `Membro`, além de poder alterar papéis e revogar acessos.
- [x] **Proteção de Orfandade:** Bloqueio automático contra a remoção ou rebaixamento do único administrador de uma conta.

---

## 🗺️ Próximas Funcionalidades (Roadmap)

- **F02:** Gestão de Categorias e Tags Personalizadas
- **F03:** Gestão de Cartões de Crédito e Faturas Mensais
- **F04:** Motor de Despesas, Recorrência e Parcelamentos (fórmula anti-dízima)
- **F05:** Registro de Receitas e Entradas
- **F06:** Liquidação e Baixa de Despesas / Pagamento de Faturas
- **F07:** Dashboard Consolidado Mensal por Bandeira de Cartão e Demais Métodos
