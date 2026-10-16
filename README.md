# 🚗 DRIVO — Garagem inteligente com leitura de CRLV por IA

Desafio técnico **Desenvolvedor Fullstack Junior 1 — EPTA Softwares**.

O Drivo é um web app para montar e gerenciar sua garagem. Ao cadastrar um veículo, o usuário pode
importar o **CRLV** (PDF ou imagem) e o formulário é preenchido automaticamente com a **API do Google Gemini**.

## Links

| | |
| :--- | :--- |
| **Briefing** | [EPTA-Softwares/fullstack-junior-1](https://github.com/EPTA-Softwares/fullstack-junior-1) |
| **Figma** | [Protótipo no Figma](https://www.figma.com/design/kMDaB78808CbApQRhg8kVF/Untitled?node-id=1-833&t=HL0fcN1gkWiim6VF-1) |
| **Aplicação no ar** | [drivo.adapp.dev.br](https://drivo.adapp.dev.br) |

## Credenciais de teste

| E-mail | Senha |
| :--- | :--- |
| `mariana.costa@email.com` | `Drivo@2026` |

Usuário com 5 veículos de exemplo (o Corolla vem com CRLV).

## CRLVs de exemplo

A pasta [`exemplos/crlv`](exemplos/crlv) tem 3 documentos **fictícios** (PDF, PNG e uma "foto de celular") para testar a
importação sem usar dados reais.

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Stack](#stack)
3. [Como instalar](#1-como-instalar-o-projeto)
4. [Como executar](#2-como-executar-o-projeto)
5. [Como executar os testes](#3-como-executar-os-testes)
6. [Decisões técnicas](#4-decisões-técnicas)
7. [Limitações](#5-limitações-conhecidas)
8. [O que eu faria com mais tempo](#6-o-que-eu-faria-com-mais-tempo)
9. [API](#api)

---

## Funcionalidades

| Requisito do briefing | Onde |
| :--- | :--- |
| Login, cadastro e logout | `/login`, `/register`, "Sair da conta" em `/profile` |
| Visualizar e pesquisar veículos | `/` (busca por placa, modelo ou marca com debounce) |
| Criar veículo | `/vehicles/new` |
| Importar CRLV e preencher com Gemini | Painel "Importar CRLV" em `/vehicles/new` e "Atualizar com novo CRLV" na edição |
| Editar e excluir veículo | `/vehicles/[id]` (exclusão com modal de confirmação) |
| Alterar dados cadastrais e senha | `/profile` |
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

--- | :--- | :--- |
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

Aqui explico, de forma direta, o que escolhi e por quê.

**Tecnologias**

- **NestJS + Prisma + PostgreSQL**: o Nest organiza o código em módulos, controllers e services, o que ajuda a manter o
  projeto arrumado. Escolhi o Prisma pela tipagem e pelas migrations versionadas, que deixam o banco fácil de recriar.
- **Next.js + Tailwind**: o App Router facilita separar as páginas e o Tailwind agilizou a montagem das telas do Figma.
- **React Hook Form + Zod**: validação dos formulários com as mesmas regras do backend, para o usuário ver o erro antes
  de enviar.
- **Testes**: Jest e Supertest no backend; Vitest e Testing Library no frontend.

**Backend e dados**

- **Validação nos DTOs**: uso `class-validator` com `whitelist` e `forbidNonWhitelisted`, então campos que não existem
  no DTO são recusados.
- **Cada usuário só vê os próprios veículos**: toda consulta filtra por `userId`. Se o veículo for de outra pessoa,
  a API responde 404, para não revelar que ele existe.
- **Placa única por usuário**: criei um índice único (`userId` + `plate`) no banco. Se a placa já existir, a API
  responde 409.
- **Respostas por DTO**: só os campos marcados com `@Expose()` saem na resposta. Assim o hash da senha e os dados
  internos do CRLV nunca chegam ao cliente.
- **Variáveis de ambiente validadas**: se faltar algo obrigatório (como o `JWT_SECRET`), a API não sobe e mostra o erro.
- **Fotos dos veículos no banco**: guardei as imagens numa tabela e sirvo por uma rota autenticada. É simples para o
  escopo do desafio; em produção o ideal seria um storage de objetos (está em "o que eu faria com mais tempo").

**Leitura do CRLV com o Gemini**

- **Resposta em JSON com schema**: peço ao Gemini um JSON no formato esperado e uso `temperature` 0 para a resposta
  variar menos.
- **Sem inventar dados**: o que o modelo não identifica volta como `null`, e o backend descarta uma placa fora do padrão.
- **Erros claros**: sem chave da API retorna 503, falha do Gemini retorna 502 e documento ilegível retorna 422. Em
  caso de instabilidade, a API tenta modelos de reserva antes de falhar.
- **Ler e salvar são passos separados**: `POST /crlv/scan` só lê o documento e preenche o formulário. O arquivo só é
  salvo em `POST /crlv/attach/:id`, depois que o veículo existe.

**Segurança**

- Senha com hash `bcrypt`, autenticação por JWT e `helmet` para os cabeçalhos de segurança.
- Rate limit (`@nestjs/throttler`) para reduzir tentativas repetidas de login e abuso das rotas.
- CORS configurável por variável de ambiente.

**Frontend**

- Código organizado por módulos (`auth`, `vehicles`, `profile`) e uma pasta `shared/` com o que se repete, incluindo
  um design system com os componentes do Figma.
- O interceptor do Axios só desloga o usuário quando a sessão expira, e não quando ele erra a senha.

---

## 5. Limitações conhecidas

O que ainda não está resolvido, para ficar claro o que o projeto faz e o que não faz:

- **Privacidade no CRLV**: ao importar, o arquivo inteiro (com nome e CPF/CNPJ do proprietário) é enviado ao Google
  Gemini. Eu não guardo a resposta bruta da IA, mas o conteúdo passa por um serviço de terceiros.
- **Upload de até 10 MB**: a API responde 413 e a tela avisa. Arquivos maiores precisam ser reduzidos.
- **Tipo do arquivo**: confio no `Content-Type` enviado pelo cliente, sem olhar o conteúdo do arquivo.
- **Dados sensíveis sem criptografia**: placa, RENAVAM, chassi e dados do proprietário ficam em texto no banco (só a
  senha tem hash `bcrypt`).
- **Logout só no cliente**: o token JWT continua válido até expirar (7 dias), porque não há refresh token nem revogação.
- **Arquivos do CRLV em disco local** (volume do Docker), sem storage de objetos nem antivírus.
- **Sem foto no cadastro**: o briefing e o Figma não têm esse campo, então só os veículos do seed têm foto e os novos
  mostram o logo do Drivo. A tabela de imagens e a rota `GET /vehicles/:id/image` já estão prontas para o upload.
- **Listagem sem paginação nem filtros**: a garagem carrega todos os veículos do usuário e só tem busca por texto.
- **Sem exclusão de conta**: o backend não tem esse endpoint.

## 6. O que eu faria com mais tempo

1. **Configurações no banco**: hoje o prompt do Gemini, os modelos de reserva e os limites ficam no código ou em
   variáveis de ambiente. Uma tabela de configurações permitiria ajustá-los sem novo deploy.
2. **Fila para o scan do CRLV** (BullMQ + Redis): o processamento rodaria em segundo plano, com nova tentativa em caso
   de falha do Gemini, e a tela acompanharia o status. Também guardaria um cache pelo hash do arquivo.
3. **Paginação e filtros na listagem**: paginação no servidor, ordenação e filtros por marca, combustível, ano e cor,
   com os parâmetros na URL.
4. **Criptografia dos dados sensíveis**: RENAVAM, chassi, placa e dados do proprietário gravados criptografados
   (AES-256-GCM), com a chave fora do banco. A busca por placa continuaria possível com um hash.
5. **Testes E2E no navegador** com Playwright (login, cadastro, CRUD e importação de CRLV) e testes dos formulários de
   veículo e perfil.
6. **Sessão mais robusta**: refresh token com rotação e revogação no logout.
7. **Upload de foto pela tela** e storage de objetos (S3 compatível) para fotos e documentos do CRLV.
8. **Tratamento de imagens no upload**: o backend ainda não processa imagens. Com o upload de foto pela tela, ele
   validaria o tipo e o tamanho, redimensionaria e recomprimiria o arquivo (por exemplo com `sharp`) e geraria
   miniaturas para os cartões da garagem, reduzindo o tamanho no banco e o tráfego.
9. **Exclusão de conta** e exportação dos dados (LGPD).
10. **Contrato de erros da API**: hoje o campo `message` às vezes é texto e às vezes é uma lista (na validação), e o
    frontend trata cada caso separado. Eu definiria um formato único, como `{ statusCode, code, message, details?,
    requestId }`, com um `code` estável (`VEHICLE_PLATE_TAKEN`, `VALIDATION_FAILED`), documentado no Swagger. O filtro
    também trataria erros inesperados (Prisma, Gemini) sem expor detalhes internos, e o frontend usaria o `code` em
    vez de comparar textos.

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
