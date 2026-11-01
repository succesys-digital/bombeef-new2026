# Arquitetura e animação

## Stack

| Decisão | Por quê |
|---|---|
| **Astro 7, saída estática** | O repositório estava vazio. Site de conteúdo, SEO forte, zero JS por padrão, deploy direto no Cloudflare Pages |
| **GSAP + ScrollTrigger, só na home** | Scrub confiável da história. As outras páginas não carregam GSAP |
| **WebGL puro, sem Three.js** | Um quad e um shader: cerca de 200 linhas contra 150 KB+ de biblioteca |
| **CSS `animation-timeline`** | Parallax e transição para o papel, sem JS. Navegador sem suporte mostra o estado final |
| **`@view-transition`** | Transição entre páginas com uma linha, com voltar e avançar nativos |
| **Pages Function para o lead** | O RD Station fica no servidor e o token em variável de ambiente |

Um único motor de animação: nada de Motion ou React para o que CSS resolve.

## O burger: avaliação das opções

| Opção | Status |
|---|---|
| A. 3D real (GLB + Three.js) | **Sem asset.** Modelar um burger genérico seria um substituto enganoso: não é o produto real |
| B. Sequência de imagens 360° | **Sem fotos.** Exige sessão de estúdio em mesa giratória |
| C. Composição 2.5D sobre foto real | **Escolhida**, em versão reforçada |

### O que foi feito (`src/scripts/burger-gl.ts`)

- Foto real do cardápio + **mapa de profundidade** gerado com Depth Anything v2 e estendido além da silhueta.
- **Parallax por profundidade** no shader: cada pixel desloca conforme sua distância.
- **Reiluminação**: normais derivadas da profundidade fazem a luz deslizar sobre pão e queijo.
- **Abertura em 4 camadas** nos cortes reais da foto: pão, queijo + carne, queijo + carne, salada + pão.
- **Interação**: arrastar com inércia, toque (`touch-action: pan-y`, o scroll vertical continua nativo), mouse e teclado (setas).

### O limite, sem disfarce

**Isto não é uma rotação de 360°.** A faixa aparente é de cerca de ±20°, e o arrasto para nesse limite. Além disso, a foto não tem o lado de trás. Ao abrir, os cortes das camadas são visíveis se observados de perto, e a salada mostra pequenos artefatos com o burger girado.

### Para ter 360° de verdade

1. **Sequência de imagens (recomendado):** 36 a 72 quadros do mesmo burger em mesa giratória, fundo neutro, 2000 px, luz fixa. Permite trocar o quad por um canvas com seleção de quadro.
2. **GLB por fotogrametria:** 80 a 150 fotos, modelo otimizado abaixo de 3 MB. Exige Three.js, carregado sob demanda.

Em ambos, o resto do site não muda: basta manter a API `{ state, invalidate, input }` de `createBurger`.

## Fluxo da home

1. O `<img>` do burger é o LCP: pré-carregado e com `fetchpriority=high`.
2. Script inline adiciona `.motion` antes da primeira pintura, se não houver `prefers-reduced-motion`. Assim o layout não salta.
3. GSAP monta a timeline com a seção `sticky` (scroll nativo).
4. Em `requestIdleCallback` carrega WebGL e texturas. Quando prontos, canvas assume e o burger dá uma volta curta, mostrando que é manipulável.

## Fallbacks

| Situação | Comportamento |
|---|---|
| Sem JS | Página estática, passos em lista, formulário por POST nativo |
| `prefers-reduced-motion` | Sem sticky nem GSAP nem canvas: foto e passos em lista |
| Sem WebGL, contexto perdido | Foto real com perspectiva CSS leve |
| `saveData` ou até 2 GB de RAM | Não carrega o WebGL |

## Custo em runtime

Render sob demanda: sem interação ou scroll, a GPU fica parada. `IntersectionObserver` pausa fora da tela. DPR limitado a 2 (1,75 no mobile).

## Lead

`functions/api/lead.ts` valida em `src/lib/lead.ts`, com testes, e chama `POST https://api.rd.services/platform/conversions`. Sem `RD_PUBLIC_TOKEN` responde 503, e a interface mostra o erro: **nunca finge sucesso**.

Mantidos do formulário de produção: `conversion_identifier=form-p9-bb-burger` e `cf_digite_o_valor_disponivel_para_investir_0`, com os mesmos valores. Novos: estado, consentimento LGPD e UTMs.

**Não testado de ponta a ponta:** nenhum lead foi enviado ao RD real, para não sujar o CRM.
