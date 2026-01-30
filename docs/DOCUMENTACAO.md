# Documentação Técnica do Sistema de Gerenciamento de Academia (FitManager)

## 1. Resumo Executivo

O **FitManager** é um sistema web de gerenciamento para academias, projetado para atender quatro perfis distintos de usuários: Administradores, Recepcionistas, Instrutores e Alunos. O sistema permite o controle de usuários, gestão de treinos, agendamento de aulas e acompanhamento de frequências.

A arquitetura baseia-se em uma aplicação **Single Page Application (SPA)** construída com **JavaScript Vanilla** no frontend, comunicando-se com uma API RESTful desenvolvida em **Node.js** com **Express**. O banco de dados utilizado é o **SQLite**, oferecendo portabilidade e simplicidade para o escopo do projeto.

---

## 2. Visão Geral da Arquitetura

### 2.1 Diagrama de Contexto

O sistema opera como uma aplicação monolítica modularizada.

- **Frontend**: Arquivos estáticos (HTML, CSS, JS) servidos pelo Express.
- **Backend**: API REST que processa regras de negócio e acesso a dados.
- **Database**: SQLite (`database.sqlite`) para persistência.

### 2.2 Tecnologias Principais

- **Runtime**: Node.js
- **Framework Web**: Express
- **Linguagem**: TypeScript (Backend) / JavaScript (Frontend)
- **Banco de Dados**: SQLite3
- **Autenticação**: JSON Web Tokens (JWT) & BCrypt
- **Testes**: Mocha, Chai, Supertest

---

## 3. Componentes Principais

### 3.1 Autenticação e Segurança (`AuthService`)

O sistema utiliza autenticação baseada em tokens JWT.

- **Login**: Valida credenciais (email/senha) e emite um token JWT com validade de 24h.
- **Proteção**: Senhas são hasheadas utilizando `bcrypt` antes da persistência.
- **Middleware**: `authMiddleware` intercepta requisições protegidas, validando o token no header `Authorization` ou Cookies.

### 3.2 Gestão de Usuários (`UserRepository`)

Centraliza as operações de CRUD para todos os tipos de usuários, diferenciados pelo campo `role`:

- `administrador`: Acesso total.
- `recepcionista`: Gestão de alunos e instrutores.
- `instrutor`: Criação e gestão de treinos.
- `aluno`: Visualização de treinos e aulas.

Modelagem de dados inclui nome, email, senha, cpf (document), telefone e perfil.

### 3.3 Dashboards (Frontend)

A interface é dividida em dashboards específicos para cada perfil, implementados como SPAs isoladas:

- `dashboard-admin.html`: Gestão administrativa completa.
- `dashboard-receptionist.html`: Foco em matrículas e check-ins.
- `dashboard-instructor.html`: Criação de fichas de treino.
- `dashboard-student.html`: Visualização de perfil e treinos.

**Nota Técnica**: A lógica de frontend utiliza JavaScript puro (`Vanilla JS`) com manipulação direta do DOM (`document.getElementById`, `fetch` API) e CSS nativo, sem frameworks como React ou Vue.

---

## 4. Modelagem de Dados (Schema)

O banco de dados SQLite possui as seguintes tabelas principais:

- **users**: Tabela central de usuários (id, name, email, password, role, document, phone).
- **student_profile**: Extensão para alunos (plan_type, active).
- **training**: Treinos criados por instrutores.
- **exercise**: Catálogo de exercícios disponíveis.
- **exercise_training**: Tabela associativa (N:M) entre treinos e exercícios (com séries/repetições).
- **gym_class**: Aulas coletivas agendadas.
- **enrollments**: Inscrições de alunos em aulas.
- **checkins**: Registro de presença dos alunos.

---

## 5. Endpoints da API

### Autenticação

- `POST /api/auth/login`: Realiza login.
- `POST /api/auth/logout`: Realiza logout (limpa cookies).
- `GET /api/auth/me`: Retorna dados do usuário atual.

### Usuários

- `GET /api/users`: Lista usuários (com filtros).
- `POST /api/users`: Cria novo usuário.
- `PUT /api/users/:id`: Atualiza usuário.
- `DELETE /api/users/:id`: Remove usuário.

### Treinos

- `POST /api/trainings`: Cria novo treino.
- `GET /api/trainings/student`: Lista treinos do aluno logado.
- `PUT /api/trainings/:id`: Atualiza treino.

---

## 6. Configuração e Instalação

### Pré-requisitos

- Node.js (v18+)
- NPM

### Passos

1.  **Instalar dependências**:
    ```bash
    npm install
    ```
2.  **Configurar ambiente**:
    Criar arquivo `.env` com `JWT_SECRET` e `PORT`.
3.  **Iniciar servidor (dev)**:
    ```bash
    npm run dev
    ```
4.  **Testes**:
    ```bash
    npm test
    ```

---

## 7. Decisões de Design e Limitações

1.  **SQLite**: Escolhido pela facilidade de setup e ausência de necessidade de servidor de banco de dados dedicado. Não recomendado para alta concorrência em produção, mas ideal para este escopo.
2.  **Frontend Vanilla**: Decisão de não usar frameworks para manter o projeto leve e reduzir a complexidade de build tools no frontend, embora possa tornar a manutenção de estado mais trabalhosa conforme a UI cresce.
3.  **Inline Scripts/Styles**: Atualmente, partes significativas do código frontend (especialmente login) residem diretamente nos arquivos HTML. Recomenda-se futura refatoração para arquivos separados (`.js`, `.css`) para melhor organização.

---

## 8. Apêndice: Estrutura de Pastas

```
/
├── public/             # Arquivos estáticos (Frontend)
│   ├── css/            # Folhas de estilo globais e de dashboards
│   ├── js/             # Lógica dos dashboards
│   └── *.html          # Páginas principais
├── src/                # Código Fonte Backend (TypeScript)
│   ├── controllers/    # Lógica de controle de requisições
│   ├── database/       # Setup e conexão SQLite
│   ├── middlewares/    # Auth, validação, rate-limit
│   ├── models/         # Interfaces e Tipos
│   ├── repositories/   # Acesso direto ao banco de dados
│   ├── routes/         # Definição de rotas da API
│   ├── services/       # Regras de negócio
│   └── utils/          # Validadores e helpers
├── tests/              # Testes automatizados
└── package.json        # Dependências e scripts
```
