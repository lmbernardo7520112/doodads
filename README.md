![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-lightblue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-API-grey?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-darkgreen?style=for-the-badge&logo=mongodb)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue?style=for-the-badge&logo=tailwindcss)
![Shadcn](https://img.shields.io/badge/Shadcn-UI_Components-orange?style=for-the-badge&logo=shadcn)

---

## 📘 Descrição Geral

O **Doodads** evolui para um ecossistema **fullstack moderno**, combinando:

- **Backend**: Node.js + Express + MongoDB (API REST)
- **Frontend**: Next.js 15 + Tailwind + Shadcn (UI reativa)
- **Autenticação**: JWT + localStorage + middleware de roles
- **Escalabilidade**: arquitetura modular e SSR-ready

---

## 📘 Descrição Geral

O Doodads é uma plataforma de agendamento inteligente projetada para **otimizar o fluxo de trabalho em barbearias**, integrando **clientes, barbeiros e administradores** em um sistema unificado, moderno e escalável.

O foco inicial é na **configuração do banco de dados centralizado com MongoDB**, incluindo a conexão a uma instância existente, geração de schemas Mongoose e estrutura básica de pastas.

O projeto foi desenvolvido de forma incremental, priorizando **segurança de dados**, **consistência NoSQL** e **preparação para integrações futuras** como Stripe, OpenAI e UI responsiva.

---

## 🧩 Arquitetura Geral

```text
┌───────────────────────┐
│ Frontend │ → React + TypeScript + Next.js + Shadcn + Axios
│ (UI Dinâmica)         │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Backend │ → Node.js + Express + Mongoose
│ (APIs / Conexão DB)   │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Banco de Dados │ → MongoDB (localhost:27017/aparatu_db)
│ (Users / Reservas /..)│
└───────────────────────┘
```

---

## 🎓 Configuração Inicial do Banco de Dados

A configuração inicial conecta-se a uma instância MongoDB centralizada já em execução, criando schemas Mongoose para suportar os PRDs 001–007. Isso garante um banco lógico separado (`aparatu_db`) dentro de uma replica set compartilhada.

## ✳️ Funcionalidades Principais

- Conexão ao MongoDB existente sem criar novos containers.
- Geração de models Mongoose: Users, Barbearias, Servicos, Reservas, Pagamentos, Mensagens, VoiceLogs.
- Indexação otimizada para queries eficientes (ex.: `{ barbearia: 1, dataHora: 1 }` em Reservas).
- Criação de arquivos de configuração (.env, db.ts) para ambiente seguro.
- Estrutura de pastas pronta para expansão (config, models, utils).

## 🧠 Decisões Técnicas

- Uso de Mongoose para schemas tipados e relacionamentos (Ref, Embedding).
- Conexão assíncrona com fallback de erro para robustez.
- Variáveis de ambiente (.env) para segredos (JWT, Stripe, OpenAI).
- Tipagem TypeScript rigorosa em interfaces (ex.: IUser, IReserva).
- Preparação para autenticação JWT e integrações futuras.

---

## ⚙️ Estrutura Técnica Unificada

O setup inicial foca no backend, com conexão centralizada:

```javascript
const [connection] = useState({
  uri: process.env.MONGO_URI,
  db: 'aparatu_db',
});
```

Esse modelo garante:
- Reuso de conexão em múltiplos projetos.
- Sincronização com schemas compatíveis aos PRDs.
- Padronização de indexes para performance.
- Maior robustez em ambientes compartilhados.

---

## 📊 Visualização de Dados

Indexação chave para queries rápidas:
- Users: `{ email: 1 }` (unique).
- Reservas: `{ barbearia: 1, dataHora: 1 }`.
- Mensagens: `{ reserva: 1, criadoEm: 1 }`.
- VoiceLogs: `{ dataHora: -1 }`.

Compatibilidade com embedding (endereco em Barbearia) e Mixed types (VoiceLog).

---

## 🧭 Integração com PRDs 001–007

Os schemas suportam:
- Cadastro de users (clientes, barbeiros, admins).
- Gestão de barbearias e serviços.
- Agendamentos e pagamentos (Stripe).
- Chat e logs de voz (Agenda.ai).

---

## 🧪 Estado Atual

- ✅ **Conexão MongoDB:** Configurada para instância local existente.
- ✅ **Schemas Mongoose:** Gerados para todas as collections.
- ✅ **Estrutura de Pastas:** Pronta no server (config, models, utils).
- ✅ **.env:** Configurado com segredos placeholders.
- ✅ **Indexação:** Aplicada para eficiência.

---

## 🚀 Próximas Etapas

- ✅ **Implementação de APIs REST (CRUD para models).**
- ✅ **Integração Frontend com Shadcn UI.**
- ✅ **Autenticação JWT e roles.**
- ✅ **Pagamentos Stripe e IA OpenAI.**
- ✅ **Testes unitários e deploy Docker.**

---

## 🧩 Estrutura de Pastas (Inicial)
``
client/
└── app/
    ├── login/
    │   └── page.tsx
    ├── register/
    │   └── page.tsx
    ├── dashboard/
    │   ├── admin/
    │   ├── barbeiro/
    │   └── cliente/
    ├── layout.tsx
    ├── globals.css
    └── middleware.ts

├── server/
│   ├── config/
│   │   └── db.ts  # Conexão MongoDB
│   ├── models/
│   │   ├── User.ts
│   │   ├── Barbearia.ts
│   │   ├── Servico.ts
│   │   ├── Reserva.ts
│   │   ├── Pagamento.ts
│   │   ├── Mensagem.ts
│   │   └── VoiceLog.ts
│   ├── utils/
│   └── .env
``
---

## 🧠 Conclusão

Este setup inicial representa a base sólida para o Aparatu, convergindo gestão de agendamentos, pagamentos e IA em um ecossistema NoSQL eficiente.

Ele reflete um desenvolvimento iterativo, com decisões técnicas maduras e preparação para escalabilidade.

---

**Autor:** Leonardo Maximino Bernardo  
**Stack:** React • TypeScript • Express • MongoDB • Axios • Shadcn • Vite  
**Ano:** 2025  

---

## 🕒 Histórico de Desenvolvimento (Commit Log Humano)

### 🧩 Fase 1 — Inicialização do Projeto

**Período:** Outubro–Novembro 2025  
**Resumo:**  
- Criação da pasta raiz e init do backend com Node.js + Express.  
- Instalação de dependências (mongoose, dotenv).  
- Configuração inicial do frontend com Vite + React TS.  
- Integração de Tailwind CSS e Shadcn UI via CLI.  

**Commits representativos:**  
- `feat(init): create project structure with Vite and Express`  
- `chore(deps): install mongoose, dotenv, and Shadcn init`  

---

### 🎓 Fase 2 — Configuração da Conexão MongoDB

**Período:** Novembro 2025  
**Resumo:**  
- Criação do .env com MONGO_URI e segredos.  
- Implementação de db.ts para conexão assíncrona.  
- Teste de conexão com fallback de erro.  
- Estrutura de pastas no server (config, models, utils).  

**Commits representativos:**  
- `feat(db): add MongoDB connection with dotenv`  
- `fix(connection): handle errors and default URI`  

---

### 🗂️ Fase 3 — Geração de Schemas Mongoose

**Período:** Novembro 2025  
**Resumo:**  
- Criação de models para Users, Barbearias, etc.  
- Adição de relacionamentos (Ref, Embedding) e indexes.  
- Tipagem com interfaces TypeScript.  
- Commit de schemas compatíveis com PRDs 001–007.  

**Commits representativos:**  
- `feat(models): generate Mongoose schemas for PRDs`  
- `chore(indexes): add optimized indexes to Reserva and others`  

---

## 🧾 Resumo da Linha do Tempo

| Mês/Ano       | Fase | Foco Principal              | Marco Técnico                  |
|---------------|------|-----------------------------|--------------------------------|
| Out–Nov/2025 | 1    | Inicialização do Projeto    | Estrutura Vite + Express       |
| Nov/2025     | 2    | Conexão MongoDB             | db.ts e .env                   |
| Nov/2025     | 3    | Schemas Mongoose            | Models com indexes e tipagem   |

---

> 💬 *"Cada commit foi mais que código: foi uma decisão arquitetural que pavimentou um ecossistema de agendamento inteligente, eficiente e integrado."*  
> — **Leonardo Maximino Bernardo**, 2025
```
