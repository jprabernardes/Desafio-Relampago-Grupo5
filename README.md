# 💪 FitManager - Sistema de Gerenciamento de Academia

Bem-vindo ao **FitManager**, um sistema completo para gerenciamento de academias. Este projeto fornece uma solução robusta para administração de alunos, instrutores, treinos, aulas coletivas e check-ins.

## 🚀 Funcionalidades Principais

O sistema é dividido em painéis específicos para cada tipo de usuário:

### 👑 Administrador

- **Gerenciamento de Usuários:** Criar, listar e excluir usuários (Administradores, Recepcionistas, Instrutores, Alunos).
- **Visão Geral:** Métricas do sistema em tempo real.

### 📋 Recepcionista

- **Cadastro:** Registrar novos alunos e instrutores.
- **Check-ins:** Visualizar métricas de frequência diária.
- **Listagem:** Consultar base de alunos e instrutores.

### 💪 Instrutor

- **Treinos:** Criar templates de exercícios e atribuir treinos personalizados (A, B, C) aos alunos.
- **Aulas Coletivas:** Agendar, editar e cancelar aulas coletivas.
- **Minhas Aulas:** Gerenciar aulas criadas por ele.

### 🏃 Aluno

- **Meus Treinos:** Visualizar fichas de treino atribuídas.
- **Check-in:** Registrar presença imprimindo o treino do dia.
- **Aulas Coletivas:** Inscrever-se e cancelar inscrição em aulas disponíveis.
- **Histórico:** Acompanhar suas atividades.

## 🛠️ Tecnologias Utilizadas

- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** SQLite (leve e sem necessidade de configuração complexa)
- **Autenticação:** JWT (JSON Web Tokens)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Testes:** Mocha, Chai

## 📦 Instalação e Execução

Siga os passos abaixo para rodar o projeto localmente:

### Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM (gerenciador de pacotes do Node)

### Passo a Passo

1.  **Clone o repositório:**

    ```bash
    git clone <url-do-repositorio>
    cd FitManager
    ```

2.  **Instale as dependências:**

    ```bash
    npm install
    ```

3.  **Configure o ambiente (opcional):**
    O arquivo `.env` já vem pré-configurado por padrão (se usar o `.env.example` como base), mas você pode criar um arquivo `.env` na raiz se desejar customizar:

    ```env
    PORT=3000
    JWT_SECRET=sua_chave_secreta_aqui
    DB_PATH=./academia.db
    NODE_ENV=development
    ```

4.  **Execute a aplicação:**

    Para desenvolvimento (com hot-reload):

    ```bash
    npm run dev
    ```

    Para produção:

    ```bash
    npm run build
    npm start
    ```

    O servidor iniciará na porta 3000 (ou a definida no `.env`). O banco de dados será criado automaticamente na primeira execução com um usuário administrador padrão.

5.  **Acesse a aplicação:**
    Abra seu navegador e vá para: `http://localhost:3000`

## 🔑 Usuários de Demonstração (Login)

Ao iniciar o sistema, os seguintes usuários são criados automaticamente (ou podem ser recriados ao deletar o arquivo `academia.db`):

| Perfil            | Email                 | Senha                  |
| :---------------- | :-------------------- | :--------------------- |
| **Administrador** | `admin@academia.com`  | `admin123`             |
| **Recepcionista** | `maria@academia.com`  | `senha123` (se criado) |
| **Instrutor**     | `carlos@academia.com` | `senha123` (se criado) |
| **Aluno**         | `joao@academia.com`   | `senha123` (se criado) |

> **Dica:** Na tela de login, há atalhos rápidos para preencher esses dados.

## 🏗️ Estrutura do Projeto

A arquitetura segue o padrão de camadas (Layered Architecture):

```
src/
├── config/         # Configurações globais (env, database)
├── controllers/    # Lógica de controle HTTP
├── database/       # Scripts de setup e conexão com SQLite
├── middlewares/    # Interceptadores (Auth, Error Handling)
├── models/         # Definição de tipos e interfaces
├── repositories/   # Acesso direto ao banco de dados (SQL)
├── routes/         # Definição das rotas da API
├── services/       # Regras de negócio
└── server.ts       # Ponto de entrada da aplicação
public/             # Arquivos do Frontend (HTML, CSS, JS)
test/               # Testes automatizados
```

## 📚 Documentação da API

A API segue padrões RESTful. Alguns dos principais endpoints:

- `POST /api/auth/login` - Autenticação
- `GET /api/users` - Listar usuários (Admin)
- `POST /api/training` - Criar treino (Instrutor)
- `GET /api/classes` - Listar aulas
- `POST /api/student/checkin` - Registrar check-in

(Consulte o código em `src/routes` para a lista completa).

## ✅ Testes

Para executar os testes automatizados e garantir a integridade do sistema:

```bash
npm test
```

## 🤝 Contribuição

1.  Faça um Fork do projeto
2.  Crie uma Branch para sua Feature (`git checkout -b feature/NovaFeature`)
3.  Faça o Commit (`git commit -m 'Add some NovaFeature'`)
4.  Push para a Branch (`git push origin feature/NovaFeature`)
5.  Abra um Pull Request
