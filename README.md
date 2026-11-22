# ⚔️ Constância

App web (PWA) para manter a frequência na academia e os hábitos diários,
com uma história de anime esportivo: você enfrenta **Guardiões da Arena**
treinando de verdade. Roda no Safari do iPhone e é publicado no GitHub
Pages.

**App ao vivo:** https://amanuvaleria.github.io/constancia/

## O que o app faz

### Hoje
- **Missão principal**: "Treinar na academia" contra o chefe do capítulo
  atual da Saga. Cada treino registrado é um golpe; a vida do chefe =
  meta semanal − treinos já feitos nesta semana. Botão grande "Concluí
  meu treino", com sequência de golpe estilo mangá (traço de impacto +
  "Treino registrado · N golpe(s)").
- **Água (3.000 mL)**: botões +250 mL / +500 mL, "Outra qtd." para valor
  livre, "Desfazer" para o último registro do dia, barra de progresso.
- **Fibras** e **Dieta**: botões liga/desliga simples.
- Contagem "X/4 hábitos hoje" e resumo semanal de exercício.

### Saga (história)
- 3 capítulos escritos: **A Torre do Impulso** (Guardião da Inércia),
  **O Eco da Rotina** (Eco Silencioso) e **O Desafio da Aurora**
  (Guardiã da Aurora), com a treinadora Aya guiando os aprendizes.
- Capas em estilo capa de mangá, com progresso, cenas de abertura e
  vitória revisáveis a qualquer momento.
- Vencer o capítulo (bater a meta semanal de treinos) desbloqueia a
  cena de vitória, um emblema e um acessório do guarda-roupa; o próximo
  capítulo só começa na semana seguinte. Se a semana terminar antes da
  vitória, o mesmo capítulo pode ser tentado de novo, sem perder níveis
  ou itens já conquistados.

### Histórico
- Semana de segunda a domingo, com navegação entre semanas.
- Cada dia pode ser expandido e **corrigido** (água, exercício, fibras,
  dieta) — a vida do chefe e o resumo semanal recalculam na hora.

### Perfis
- Vários perfis no mesmo aparelho (ex.: cada pessoa da casa), com
  históricos separados, salvos automaticamente no navegador.
- Por perfil: meta semanal de treinos, dias de treino planejados,
  horário do aviso de missão, e os botões "Ativar avisos de missão",
  "Enviar aviso de teste" e "Pausar avisos".
- Aviso de que os dados ficam só naquele navegador/aparelho.

### Personagem (gamificação)
- Roster de **personagens prontos** para escolher rápido: Kiro, Sora e
  Nane (ilustrações vetoriais originais, cores diferentes) e **Yara**
  (foto de referência enviada, estilo anime). Depois de escolher, dá
  pra personalizar tom de pele, cor de cabelo e cor de roupa (quando não
  estiver no modo foto) e dar um nome ao personagem.
- Cartão compacto na aba Hoje (nível + barra de XP) sem atrapalhar o
  checklist; cartão grande na aba **Personagem** com o guarda-roupa.
- Reações curtas e que somem sozinhas: levanta a garrafinha ao registrar
  água, pose de vitória ao marcar exercício, gesto de comemoração ao
  marcar fibras/dieta. Respeita a preferência do sistema por movimento
  reduzido (`prefers-reduced-motion`).
- **XP**: 25 por hábito concluído no dia (água só ao bater 3 L); os 4
  juntos somam 100. Sempre recalculado a partir dos registros salvos —
  nunca um contador manual — então marcar/desmarcar/marcar de novo dá o
  mesmo total, e corrigir um dia ajusta o XP na hora.
- A cada 100 XP sobe 1 nível, mostrando quanto falta e qual item
  desbloqueia a seguir. Alguns itens do guarda-roupa (faixa elétrica,
  jaqueta da academia, garrafinha do Guardião) desbloqueiam vencendo
  capítulos específicos da Saga; outros (tênis, fones) por nível.

## Marca e ícone

- Símbolo (anel + chama/check) em `brand/icon-*.png`, fundo sólido,
  cantos quadrados (o iPhone aplica o próprio recorte), sem texto —
  180×180 (apple-touch-icon), 192×192 e 512×512 (manifest).
- Lockup horizontal (símbolo + "Constância") em `brand/lockup-constancia.png`,
  para uso em README/redes/cabeçalhos externos.

## Publicar no GitHub Pages

1. Settings → Pages → Source: branch `main`, pasta `/ (root)`.
2. A URL fica `https://<usuario>.github.io/<repositorio>/`.
3. Todos os caminhos do app são relativos (`./arquivo`), então funciona
   mesmo com o nome do repositório no caminho da URL.

## Adicionar à Tela de Início do iPhone

1. Abra a URL do app no **Safari** do iPhone.
2. Toque em **Compartilhar** (ícone de quadrado com seta para cima).
3. Toque em **"Adicionar à Tela de Início"**.
4. Abra pelo ícone criado — o app roda em tela cheia, como instalado.
5. Na aba **Perfis**, toque em **"Ativar avisos de missão"** para
   autorizar as notificações (Safari 16.4+ necessário).

## Avisos de missão com app fechado (Web Push)

Push "de verdade" (app fechado) depende de um pequeno backend —
veja `server/README.md` para a arquitetura completa e as variáveis de
ambiente. Resumo do que já está pronto:

- Código do backend (Vercel Functions) em `server/`, usando o
  repositório privado `constancia-data` como armazenamento.
- Chave pública VAPID já embutida no `app.js`.
- Chave privada VAPID e `TICK_SECRET` gerados (ver histórico da conversa
  / peça novamente se precisar).
- Workflow de agendamento (`.github/workflows/tick.yml`) preparado no
  repositório `constancia-data`, com os secrets `TICK_SECRET` e
  `VERCEL_TICK_URL` já criados.

**O que falta para ativar de verdade:** ver a seção "Status" na última
mensagem do agente — resume exatamente os 2 passos manuais pendentes
(permissão da Vercel e scope `workflow` do GitHub).

## Tecnologia

- HTML + CSS + JavaScript puro, `localStorage`, sem dependências.
- `manifest.json` + `sw.js` para instalação como PWA e cache offline.
- Sem build step — funciona como projeto 100% estático.
