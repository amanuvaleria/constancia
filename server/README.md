# Constância — Backend de Avisos de Missão (Web Push)

Pequeno backend serverless (Vercel Functions) que envia os avisos de missão
("⚔️ Missão de hoje — hora de treinar!") mesmo com o app fechado no iPhone,
via **Web Push** (compatível com Safari iOS 16.4+ em apps adicionados à Tela
de Início).

## Por que existe um backend?

Push "real" (app fechado) depende de um servidor que guarda a inscrição do
navegador e dispara o envio assinado com uma chave privada (VAPID) no
horário certo. Isso não roda num site estático (GitHub Pages) — por isso
este backend fica separado, na Vercel.

## Armazenamento

Como funções serverless não têm disco persistente, as inscrições ficam
salvas como JSON num **repositório GitHub privado** (`constancia-data`),
lido/escrito via GitHub Contents API a cada chamada.

## Variáveis de ambiente (configurar no painel da Vercel → Project → Settings → Environment Variables)

| Variável | Valor | Observação |
|---|---|---|
| `GITHUB_TOKEN` | um Personal Access Token (fine-grained) com acesso de **leitura e escrita somente ao repositório `constancia-data`** | Crie em github.com → Settings → Developer settings → Fine-grained tokens. Nunca compartilhe esse token fora do painel da Vercel. |
| `GITHUB_DATA_REPO` | `amanuvaleria/constancia-data` | repo privado usado como banco de dados |
| `GITHUB_DATA_BRANCH` | `main` | opcional, padrão já é `main` |
| `VAPID_PUBLIC_KEY` | fornecida pelo agente ao configurar | também precisa estar no `app.js` do site (é pública) |
| `VAPID_PRIVATE_KEY` | fornecida pelo agente ao configurar | **privada** — fica só aqui no servidor |
| `TICK_SECRET` | um texto aleatório à sua escolha | protege o endpoint `/api/tick` contra chamadas de terceiros |

Depois de configurar as variáveis, clique em **Redeploy** no painel da Vercel.

## Endpoints

- `POST /api/subscribe` — registra/atualiza a inscrição de avisos de um perfil neste aparelho.
- `POST /api/sync-status` — recebe do app o status do dia (treino feito? vida do chefe?) para decidir se deve pular o aviso.
- `POST /api/test-push` — dispara um aviso de teste imediato para um perfil já inscrito.
- `GET /api/tick?secret=TICK_SECRET` — roda a checagem de horário/dia/estado e envia os avisos pendentes. Deve ser chamado periodicamente por um agendador externo (ver abaixo).

## Agendador (GitHub Actions)

A Vercel grátis (Hobby) só permite Cron Jobs nativos uma vez por dia, o que
não é preciso o suficiente para horários por perfil. Por isso usamos um
**workflow do GitHub Actions**, no próprio repositório, rodando a cada 5
minutos e chamando `/api/tick`. Veja `.github/workflows/tick.yml` no
repositório `constancia-data` (ou `constancia`).

## Teste manual rápido

```bash
curl -s -X POST https://<seu-projeto>.vercel.app/api/test-push \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"...","profileId":"..."}'
```
