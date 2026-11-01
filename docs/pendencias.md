# Pendências antes de publicar

## Bloqueiam a virada de domínio

1. **Pesquisa de satisfação (`/burgers/<unidade>/`).** 12 páginas com Ninja Forms não foram migradas e voltam 404 aqui. Podem estar em QR Codes de loja. Decidir: manter o WordPress em subdomínio com redirecionamento, ou recriar o formulário.
2. **Trabalhe conosco.** O formulário com upload de currículo era Ninja Forms. Foi trocado por envio via `netaobombeef@gmail.com`, sem confirmação de que esse é o canal de RH. Confirmar ou indicar outro.
3. **`RD_PUBLIC_TOKEN`.** Configurar no Cloudflare e enviar um lead de teste. Sem ele, o formulário mostra erro de propósito.
4. **Tags.** O site atual tem `GTM-ND3JCW98` e `GTM-TCT9P9D`. Só uma entra em `PUBLIC_GTM_ID`. Confirmar qual e se Meta Pixel e RD Tracker saem por ela. Tags novas podem exigir ajuste na CSP de `public/_headers`.
5. **Revisão jurídica.**
   - Investimento, faturamento, margem e payback foram copiados de `/hamburguer-perfeito`. A página acrescenta aviso de "sem garantia de resultado" e cita a Circular de Oferta de Franquia: validar o texto.
   - A política de privacidade é de 2022 e fala de cookies genéricos. Não cita RD Station nem o tratamento de leads.

## Dados que o site atual contradiz

| Tema | Conflito | Escolha atual |
|---|---|---|
| Endereço da empresa | Rodapé: Al. Madeira, 162, Barueri. LP: Av. dos Autonomistas, 896, Osasco. Mesmo CNPJ | Osasco, da LP mais recente |
| Lojas | "+ de 30 lojas" e "+40 unidades abertas ou em implementação" | +40 |
| Faixa de investimento | Formulário começa em R$ 500 mil; o menor investimento é R$ 695 mil | Opções mantidas, para não quebrar a segmentação do RD. Recomendo rever |
| Praia Grande | Lista: (13) 99765-7770. Página: (12) 99615-0776 | Lista |
| Horários | Páginas de Ribeirão, São José dos Campos e Praia Grande repetem o mesmo horário; a lista diverge | Lista |
| Jardins e Metrô Boulevard | "Domingo a Segunda" | Mantido; conferir |
| Goiânia | Dois cartões: Passeio das Águas (aberto) e Goiânia (em breve) | Os dois |
| Piracicaba | CEP "1316-320", incompleto | Mantido; corrigir na origem |

## Unidades a confirmar

`/unidades/barra-da-tijuca/`, `/unidades/sao-jose-dos-campos/` e `/unidades/ribeirao-preto/` existem no WordPress, mas a lista atual não as apresenta como abertas. Aqui redirecionam para `/unidades/` com 302. Ribeirão Preto aparece como "em breve".

São 45 cartões: 39 com endereço aberto e 6 "em breve" (Alphaville, São Vicente, Goiânia, Itaim Bibi, Perdizes, Ribeirão Preto).

## Assets que elevariam o resultado

- **Sequência 360° ou GLB do Big Neto**: ver `animation-architecture.md`.
- **Foto do burger em mais resolução.** O recorte tem 800 px e foi ampliado a 1200 px. Em tela 2x grande, fica levemente suave.
- **Assinatura "Netão!" em vetor** e **logo em SVG**: hoje só PNG de 200 px.
- **Vídeo de bastidor** próprio para a franquia.

## Conteúdo não migrado

`/horarios-de-final-de-ano/` (sazonal), `/aguarde/`, `/teste/`, `/footer/`. `/contato/` redireciona para a franquia, pois só continha links.

## Fora de escopo, para decidir

- Antispam: há honeypot e tempo mínimo. Se houver abuso, adicionar Cloudflare Turnstile.
- Campo de comentários no formulário: fora, pois o RD exige um campo personalizado que não existe hoje.
- Conteúdo é um snapshot (`npm run import:content`). Não sincroniza sozinho: unidade nova exige rodar o script e publicar.
- Vídeos: a fonte RSS traz só os 15 últimos. Não há categorias além de "Episódios" e "Curtos", porque 15 títulos não sustentam mais que isso.
