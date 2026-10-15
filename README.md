# 🚗 DRIVO — Garagem inteligente com leitura de CRLV por IA

Desafio técnico **Desenvolvedor Fullstack Junior 1 — EPTA Softwares**.
Briefing: [EPTA-Softwares/fullstack-junior-1](https://github.com/EPTA-Softwares/fullstack-junior-1)

O Drivo é um web app para montar e gerenciar sua garagem. Ao cadastrar um veículo, o usuário pode
importar o **CRLV** (PDF ou imagem) e o formulário é preenchido automaticamente com a **API do Google Gemini**.

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Stack](#stack)
3. [Como instalar](#1-como-instalar-o-projeto)
4. [Como executar](#2-como-executar-o-projeto)
5. [Como executar os testes](#3-como-executar-os-testes)
6. [Decisões técnicas](#4-decisões-técnicas)
7. [Limitações](#5-limitações-conhecidas)
8. [O que seria feito com mais tempo](#6-o-que-seria-feito-com-mais-tempo)
9. [API](#api)

---

## Funcionalidades

| Requisito do briefing | Onde |
| :--- | :--- |
| Login, cadastro e logout | `/login`, `/register`, "Sair da conta" em `/perfil` |
| Visualizar e pesquisar veículos | `/` (busca por placa, modelo ou marca com debounce) |
| Criar veículo | `/veiculos/novo` |
| Importar CRLV e preencher com Gemini | Painel "Importar CRLV" em `/veiculos/novo` e "Atualizar com novo CRLV" na edição |
| Editar e excluir veículo | `/veiculos/[id]` (exclusão com modal de confirmação) |
| Alterar dados cadastrais e senha | `/perfil` |
| Estados de loading, erro e vazio | Garagem (skeleton, erro com retry, vazia, busca sem resultado) e edição |
| Documentação OpenAPI | Swagger em `http://localhost:3001/api/docs` |

## Stack

**Backend** — NestJS 12, Prisma 7 (driver adapter `pg`) + PostgreSQL 16, JWT (Passport), `class-validator`, `@nestjs/throttler`,
Swagger, `@google/generative-ai`, Jest.

**Frontend** — Next.js 16 (App Router), React 19, Tailwind CSS 4, React Hook Form + Zod, Axios, Lucide.

**Infra** — Docker + Docker Compose (Postgres, API e Web).

---

## 1. Como instalar o projeto

### Opção 1 — Com Docker (recomendada)

**Pré-requisitos:** Docker e Docker Compose. Não é preciso instalar Node.js nem PostgreSQL: as dependências
e o banco ficam nas imagens.

```bash
git clone <url-do-repositorio>
cd epta
cp .env.example .env      # ajuste JWT_SECRET e, se tiver, GEMINI_API_KEY
```

Pronto: a instalação (dependências, build e migrações) acontece no primeiro `docker compose up --build`,
descrito em [Como executar](#2-como-executar-o-projeto).

### Opção 2 — Sem Docker

**Pré-requisitos:** Node.js 22+ e PostgreSQL 16 rodando em `localhost:5432`.

```bash
git clone <url-do-repositorio>
cd epta

# Backend
cd backend
npm install
cp .env.example .env            # ajuste DATABASE_URL, JWT_SECRET e GEMINI_API_KEY
npx prisma generate             # gera o client em src/generated (não é versionado)
npx prisma migrate deploy       # cria as tabelas
npm run prisma:seed             # usuário e veículos de demonstração

# Frontend
cd ../frontend
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Variáveis de ambiente

| Variável | Para que serve | Padrão |
| :--- | :--- | :--- |
| `JWT_SECRET` | Segredo de assinatura do JWT. **Obrigatório** (a API não sobe sem ele). Gere um com `openssl rand -hex 32`. | valor de desenvolvimento no `.env.example` |
| `JWT_EXPIRES_IN` | Validade do token | `7d` |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL da API vista pelo navegador. É gravada no build do frontend: ao mudar, rode `docker compose up -d --build web` | `http://localhost:3001` |
| `GEMINI_API_KEY` | Chave gratuita do Google AI Studio ([criar](https://aistudio.google.com/apikey)) | vazio |
| `GEMINI_MODEL` | Modelo usado na leitura do CRLV | `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODELS` | Modelos de reserva, separados por vírgula, usados quando o principal responde 503/429 (alta demanda) | `gemini-3.1-flash-lite,gemini-3.5-flash` |
| `GEMINI_MOCK` | `true` devolve um CRLV de exemplo sem chamar o Gemini (modo demonstração, sinalizado na tela) | `false` |
| `SEED_DEMO` | `false` impede a criação do usuário e dos veículos de demonstração na subida da API (recomendado em produção) | `true` |

> Sem `GEMINI_API_KEY` e com `GEMINI_MOCK=false`, a importação de CRLV responde **503** com uma mensagem
> explicando o motivo. A aplicação **não** devolve dados simulados escondidos.

## 2. Como executar o projeto

### Opção 1 — Com Docker (um único comando)

```bash
docker compose up --build
```

| Serviço | URL |
| :--- | :--- |
| Web (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| PostgreSQL | `localhost:5432` (`drivo_db`) |

As migrações rodam automaticamente na subida da API. O seed é **não destrutivo**: cria o usuário de
demonstração e os 5 veículos do protótipo apenas se ainda não existirem, e nunca apaga dados.

Para parar: `docker compose down` (os dados ficam no volume; use `down -v` para apagá-los).

### Opção 2 — Sem Docker

Depois dos passos de [instalação](#opção-2--sem-docker), em dois terminais:

```bash
# Terminal 1 — API (http://localhost:3001)
cd backend
npm run start:dev

# Terminal 2 — Web (http://localhost:3000)
cd frontend
npm run dev
```

### CRLVs de exemplo

A pasta [`exemplos/crlv`](exemplos/crlv) tem 3 documentos **fictícios** (PDF, PNG e uma "foto de celular") para testar a
importação sem usar dados reais.

### Usuário de demonstração

| E-mail | Senha | Veículos |
| :--- | :--- | :--- |
| `mariana.costa@email.com` | `Drivo@2026` | 5 veículos do Figma (o Corolla vem com CRLV) |

---

## 3. Como executar os testes

```bash
cd backend

npm test            # 104 testes unitários (não precisam de banco)

# E2E: precisam do Postgres no ar (por exemplo, o do docker compose).
# Informe a URL do banco se a do seu .env for diferente:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drivo_db?schema=public" npm run test:e2e   # 63 testes
```

Os testes E2E criam usuários com prefixos próprios (`e2e_`, `users_pwd_`, `u1_`…) e removem apenas esses registros.

**Cobertura combinada** (unitários + E2E, com limiares mínimos; falha se algum não for atingido):

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/drivo_db?schema=public" npm run test:cov:all
```

Resultado atual: **100% das linhas**, 99,9% dos statements, 100% das funções e **84,1% dos ramos**
(mínimos exigidos: 90 / 90 / 85 / 75). Controllers, guards e o filtro de erros só são exercitados pelos
E2E, por isso a medida que vale é a soma das duas suítes.

```bash
cd frontend

npm test            # 85 testes (Vitest + Testing Library, rodam em jsdom, sem backend)
npm run lint
npx tsc --noEmit
```

| Camada | Cobertura |
| :--- | :--- |
| Unitários (`*.spec.ts`) | Regras de auth, usuários, veículos (foto e conflito de placa), CRLV (extração com Gemini mockado, armazenamento em disco e casos de uso), validação de ambiente, DTOs, saúde e seed das fotos |
| E2E (`test/*.e2e-spec.ts`) | Fluxos HTTP completos, isolamento entre usuários, troca de senha, token de usuário excluído, placa única sob concorrência, formato das respostas (DTOs), cabeçalhos de segurança e Swagger, rate limit, CRLV e saúde |
| Frontend (`*.test.ts(x)`) | Schemas Zod (veículo, cadastro, perfil/senha), utilitários (formatação, arquivo CRLV, erros da API), componentes do design system (`Button`, `Field`, `ConfirmModal`), `VehicleCard`, formulários de login e cadastro, hook `useVehicles` e as ações de salvar veículo + anexar CRLV |
| Estático | `tsc --noEmit` e ESLint no frontend e no backend |

---

## 4. Decisões técnicas

**Tecnologias escolhidas**

- **Prisma como ORM** (versão 7): modelo tipado, migrations versionadas e driver adapter `pg`. A URL de conexão não fica
  no `schema.prisma` (formato aceito pelo Prisma 7 e pela extensão do VS Code): o CLI lê `prisma.config.ts` e a
  aplicação conecta por `@prisma/adapter-pg`. O client é gerado em `backend/src/generated` (fora do git:
  `npx prisma generate`) e o seed roda com `tsx`.
- **`class-validator` + `class-transformer`** para validar e transformar DTOs na borda da API (`whitelist` e
  `forbidNonWhitelisted`).
- **`helmet`** para os cabeçalhos de segurança e **`@nestjs/throttler`** para o rate limit (por usuário nas rotas
  autenticadas e por IP nas públicas).
- **React Hook Form + Zod** nos formulários, com as mesmas regras de validação do backend.
- **Axios** com interceptors (token e tratamento de 401) e **Lucide** para os ícones.
- **Vitest + Testing Library** no frontend e **Jest + Supertest** no backend.

**Dados e API**

- **Placa única por usuário no banco**: `@@unique([userId, plate])`. O service traduz o erro `P2002` em 409, então
  requisições simultâneas com a mesma placa resultam em 1 criação e 409 nas demais (coberto por teste E2E).
- **Isolamento por usuário**: toda consulta de veículo filtra por `userId`; o recurso de outro usuário responde 404,
  para não revelar que ele existe.
- **Respostas serializadas por DTO**: cada rota declara `@SerializeAs(Dto)` e só os campos com `@Expose()` saem na
  resposta (lista branca). O hash da senha, o caminho do arquivo do CRLV no servidor (`fileUrl`) e o JSON bruto da IA
  (`rawAiExtraction`) nunca chegam ao cliente, e uma coluna nova no banco não vaza sem um DTO que a exponha.
- **Pipe, filtro e interceptor globais no `AppModule`** (`APP_PIPE`/`APP_FILTER`/`APP_INTERCEPTOR`) e não em
  `main.ts`, para que os testes E2E exercitem exatamente o mesmo comportamento da aplicação.
- **Configuração tipada e validada**: `ConfigModule` valida as variáveis na subida (`EnvironmentVariables`),
  centraliza os valores padrão e a API falha rápido, com mensagem clara, se algo obrigatório faltar.
- **Fotos dos veículos no banco** (tabela `vehicle_images`, bytes), enviadas pelo seed e servidas por
  `GET /vehicles/:id/image` **autenticada**. Como `<img>` não envia headers, o frontend busca a imagem com o token
  (blob) e a exibe, com cache por URL versionada (`?v=`). As consultas de veículo nunca trazem os bytes.
- **Seed idempotente e não destrutivo**: roda a cada start do container sem apagar dados.
- **Apelido do veículo**: o Figma tem "Apelido (opcional)", então o modelo `Vehicle` ganhou `nickname`.
- **Nome e sobrenome**: o Figma tem dois campos e o backend guarda um `name`; o primeiro termo é o nome e o restante,
  o sobrenome.

**Leitura do CRLV com o Gemini**

- **Saída estruturada**: o prompt usa `responseSchema` (JSON estrito) e o backend sanitiza o resultado (placa,
  separação marca/modelo, remoção de prefixos como `I/`).
- **Extração conservadora**: todos os campos são `nullable` e a `temperature` é 0; o que o modelo não identifica fica
  `null`, nunca é inventado. O backend ainda descarta placa fora do padrão e data de emissão inválida.
- **Falhas explícitas**: sem chave → 503; erro/timeout do Gemini → 502; documento ilegível → 422. Picos de demanda
  (503/429) passam pelos modelos de reserva (`GEMINI_FALLBACK_MODELS`) e por uma segunda rodada antes de falhar; erros
  permanentes não são repetidos. O modo demonstração só existe com `GEMINI_MOCK=true` e é sinalizado na tela.
- **Scan separado do cadastro**: `POST /crlv/scan` lê em memória e não grava nada; o arquivo só vai para o disco em
  `POST /crlv/attach/:id`, depois que o veículo existe.
- **CRLV em três responsabilidades**: `GeminiExtractionService` (IA, reserva, sanitização), `CrlvStorageService`
  (arquivos em disco) e `CrlvService` (casos de uso e persistência).

**Segurança**

- **Segredos por ambiente**: `JWT_SECRET` obrigatório (sem valor embutido no código) e CORS configurável.
- **Cabeçalhos de segurança (helmet)**: CSP restritiva na API (`default-src 'none'`, sem iframes) e uma CSP própria
  para o Swagger UI em `/api/docs` (scripts e estilos só da própria origem). Sem `upgrade-insecure-requests`, para não
  quebrar o uso em `http` local, e com `Cross-Origin-Resource-Policy: cross-origin`, pois o frontend consome a API de
  outra origem (o CORS decide quem lê).
- **Tratamento de 401 no frontend**: o interceptor distingue sessão expirada de erro de credencial (login e troca de
  senha) para não deslogar o usuário por engano.

**Frontend**

- **Organização por módulos** (`modules/auth`, `vehicles`, `profile`) com `shared/` para o que é transversal, e um
  **design system** próprio (`shared/design-system`) com os tokens e componentes do frame "Design System" do Figma.

---

## 5. Limitações conhecidas

- **Privacidade**: ao importar um CRLV, o arquivo inteiro (incluindo nome e CPF/CNPJ do proprietário) é enviado
  à API do Google Gemini. O Drivo não guarda a resposta bruta da IA, mas o conteúdo passa por um serviço de terceiros.
- **Limite de upload de 10 MB**, aplicado na API (resposta 413) e na tela. Arquivos maiores precisam ser reduzidos.
- **Validação do tipo do arquivo** pelo `Content-Type` enviado pelo cliente, sem inspeção do conteúdo.
- **Dados sem criptografia em repouso**: placa, RENAVAM, chassi e os dados do proprietário no CRLV ficam em texto no banco
  (a senha do usuário é guardada com hash `bcrypt`). A criptografia está listada em "o que seria feito com mais tempo".
- **Logout não revoga o JWT**: o token continua válido até expirar (7 dias). Não há refresh token nem lista de revogação.
- **Arquivos do CRLV em disco local** (volume Docker), sem storage de objetos nem antivírus.
- **Não é possível adicionar foto ao cadastrar um veículo**: o briefing e o Figma não preveem esse campo (as telas de
  Novo e Editar veículo não têm foto), então só os veículos do seed têm foto e os novos mostram o logo do Drivo como
  placeholder. A tabela `vehicle_images` e a rota `GET /vehicles/:id/image` já estão prontas para receber o upload.
- **Listagem sem paginação nem filtros**: a garagem carrega todos os veículos do usuário e só tem busca textual.
- **Sem exclusão de conta** (o backend não tem esse endpoint).
- **Sem testes de ponta a ponta no navegador**: o frontend tem testes de unidade e de componentes, mas os fluxos completos (login → CRUD → CRLV) ainda são verificados manualmente.

## 6. O que seria feito com mais tempo

1. **Tabela de configurações do sistema** (`nome`, `descrição`, `valor`): hoje o prompt enviado ao Gemini, os modelos
   de reserva, os limites (tamanho do arquivo, tentativas, tempo limite) e outros parâmetros ficam no código ou em
   variáveis de ambiente. Com a tabela, eles seriam lidos do banco (com cache e fallback para o padrão) e poderiam ser
   ajustados sem novo deploy, por exemplo para refinar o prompt do CRLV.
2. **Sistema de filas** para o scan do CRLV (BullMQ + Redis): a requisição devolveria um identificador, o
   processamento rodaria em segundo plano com reprocessamento automático em falhas e picos do Gemini, e a tela
   acompanharia o status. Inclui cache por hash do arquivo para não reler o mesmo documento.
3. **Paginação e filtros na listagem de veículos**: paginação no servidor (cursor ou página/limite), ordenação e filtros
   por marca, combustível, ano e cor, além da busca por placa, modelo, RENAVAM e chassi, com os parâmetros refletidos
   na URL.
4. **Criptografia dos dados sensíveis do veículo no banco**: RENAVAM, chassi e placa (e os dados pessoais do CRLV,
   como nome e CPF/CNPJ do proprietário) seriam gravados criptografados em repouso (AES-256-GCM no nível da aplicação,
   com a chave fora do banco, em variável de ambiente ou gerenciador de segredos, e rotação de chaves). A busca por
   placa passaria a usar um índice cego (hash determinístico) para continuar possível sem expor o valor.
5. **Testes E2E no navegador**: Playwright cobrindo login, cadastro, CRUD e importação de CRLV, e testes dos
   formulários de veículo e perfil (hoje cobertos só pelos schemas e pelas ações).
6. **Sessão mais robusta**: refresh token com rotação e revogação no logout.
7. **Foto no cadastro e na edição do veículo** (upload pela tela) e storage de objetos (S3 compatível) para as fotos e os
   documentos do CRLV.
8. **Compressão e redimensionamento de imagens**: as fotos dos veículos hoje são otimizadas manualmente antes do
   seed (1000 px de largura, JPEG q82). Com upload pela tela, o backend faria isso automaticamente (por exemplo com
   `sharp`): limitar as dimensões, recomprimir, converter para WebP/AVIF, gerar miniaturas para os cartões da garagem e
   rejeitar arquivos acima do limite, reduzindo o tamanho no banco e o tráfego de rede.
9. **CI** (lint, tipos, testes e build das imagens) e logs estruturados com correlação por requisição.
10. **Exclusão de conta** e exportação dos dados (LGPD).

---

## API

Documentação interativa em `http://localhost:3001/api/docs`. Rotas autenticadas usam `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/health` | Saúde da API e do banco (público) |
| `POST` | `/auth/register` | Cadastro |
| `POST` | `/auth/login` | Login (retorna JWT) |
| `POST` | `/auth/logout` | Encerra a sessão no cliente |
| `GET` | `/users/me` | Perfil |
| `PATCH` | `/users/me` | Nome e e-mail |
| `PATCH` | `/users/me/password` | Troca de senha (valida a atual) |
| `GET` | `/vehicles?search=` | Lista veículos do usuário |
| `POST` | `/vehicles` | Cria veículo |
| `GET` | `/vehicles/:id` | Detalhe |
| `GET` | `/vehicles/:id/image` | Foto do veículo (bytes; exige token) |
| `PATCH` | `/vehicles/:id` | Atualiza |
| `DELETE` | `/vehicles/:id` | Exclui (e o CRLV associado) |
| `POST` | `/crlv/scan` | Lê o CRLV com Gemini (PDF/imagem até 10 MB) |
| `POST` | `/crlv/attach/:vehicleId` | Anexa o documento ao veículo |
| `GET` | `/crlv/:vehicleId` | Metadados do CRLV |
| `GET` | `/crlv/:vehicleId/download` | Download autenticado do arquivo |
| `DELETE` | `/crlv/:vehicleId` | Remove o CRLV |
