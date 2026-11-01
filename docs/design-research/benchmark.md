# Benchmark de referências

Pesquisa feita em 2026-11-01 com Chrome DevTools MCP (navegador real), em 1440×900 e 390×844.

Legenda de evidência: **[obs]** visto ou medido no navegador. **[parcial]** só parte da experiência foi vista. **[hip]** hipótese, não verificada.

Peso e tempos abaixo são `performance` da página no momento da visita, com banners de cookies abertos. Servem para comparar ordem de grandeza, não como auditoria.

## Limites desta pesquisa

- Shake Shack: a captura durante o scroll deu timeout; o scroll foi visto só por script, e a página tem 1205 px de altura após o hero. **[parcial]**
- Burger King: o hero desktop não carregou antes da captura (faixa vazia). Mobile foi visto com o cookie banner cobrindo 40% da tela. **[parcial]**
- Madero e BK: nenhum funil de franquia foi encontrado na home (Madero tem "Investidores"). **[obs]**
- Awwwards: só a listagem Food & Drink, usada para descobrir exemplos. SiteInspire: a URL de categoria retornou "Page not found"; só a home foi auditada. Não há análise de marca de restaurante nesses dois. **[obs]**
- Impasto: a captura ficou no loader de entrada; scroll não foi capturado. Stack e movimento vêm da auditoria do DOM. **[parcial]**

## Comparativo

| Critério | Bom Beef atual | Madero | Shake Shack | Burger King BR | Griddlemere | Smashburger (franquia) | Impasto | Proteinbolaget |
|---|---|---|---|---|---|---|---|---|
| Identidade visual | Laranja/preto forte, mas diluída em Elementor com Roboto | Preto e dourado, serifa de luxo | Verde e branco, burger recortado sobre cor | Creme, vermelho, marrom, fonte Flame própria | Noite, néon, slab Alfa Slab One | Preto e vermelho, condensada | Marrom e off-white, serifa artesanal | Laranja e cinza, Geist |
| Hero | Banner vermelho com Netão recortado; CLS alto | Carrossel promocional de cartão-presente | Carrossel de ofertas | Campanha com celebridade | Fachada noturna em sequência de imagens | Sem hero: título e formulário | Loader com desenho e vídeo | Carrossel de campanhas |
| Navegação | Hambúrguer mesmo no desktop | 8 links + barra fixa de localização | Header utilitário de pedido | Menu de app | 4 âncoras com progresso | Header de pedido | Fixa + cursor próprio | E-commerce com busca |
| Fotografia de produto | Excelente, mas subaproveitada | Forte, foco em chef P&B | Recortes limpos | Campanha | Fotos do processo | Pouca | Ritmo editorial | Produto em estúdio |
| Complexidade de animação | Baixa (Rev Slider) | Baixa | Lottie e sliders | Baixa | Alta: 4 canvas, 246 imagens | Nenhuma relevante | Alta: GSAP 3.12 + Lenis | Média: stickies e 7 vídeos |
| Scroll | Nenhuma interação | Nenhuma | Nenhuma | Nenhuma | Stage sticky + tipografia em marquee | Nenhuma | ScrollTrigger | Stickies |
| Mobile | Título centralizado, texto justificado | Hero longo, cookie cobre conteúdo | Não capturado | Cookie cobre 40% | Mantém sticky; pesado | Não capturado | Não capturado | Não capturado |
| Storytelling | Dispersa entre páginas | Chef Durski em P&B: excelente | Marca de oferta | Campanha | Rua → chapa → montagem → balcão | Nenhuma | Pão e origem | Nenhuma |
| Credibilidade de franquia | Dados fortes em LP escondida (`/hamburguer-perfeito`) | Não se aplica | Não se aplica | Não se aplica | Fictício | Marca, formulário direto | Não se aplica | Não se aplica |
| CTA | Repetido, botão arredondado genérico | Dourado discreto | "Order now" claro | "Ver mais" | "Find us" | "Submit Inquiry" | "View Products" | "Handla nu" |
| Captura de lead | RD Station, 5 campos, sem consentimento visível | Não há | Não há | Não há | Não há | Formulário de 7+ campos logo no topo | Não há | Não há |
| Medido | 88 reqs, CLS lab 0,74, CrUX LCP 2,1 s / CLS 0,55 | 74 reqs, 696 KB JS | 202 reqs, 2,4 MB JS | 49 reqs | 250 reqs | 79 reqs, 376 KB JS | 35 reqs, 440 KB JS | 196 reqs, 2,8 MB |

## Análise por site

### Bom Beef atual
1. **Funciona:** o slogan "− Gourmet + Qualidade", o Netão recortado, a foto de produto e a LP `/hamburguer-perfeito`, que tem os dados reais da franquia.
2. **Personalidade:** a voz ("bons pra K7", "bem treta", "de comer rezando") e o rosto do dono.
3. **Princípio útil:** a marca já tem sistema próprio; falta palco.
4. **Não repetir:** menu hambúrguer no desktop, ausência de `h1` e `main`, CLS, texto justificado, dados de franquia fora da página principal.
5. **Interpretação:** o sinal de − e + vira o sistema gráfico do site inteiro.

### Madero
1. **Funciona:** o chef em P&B em página cheia, com sobriedade e autoridade.
2. **Personalidade:** luxo discreto em preto e dourado.
3. **Princípio útil:** um fundador em tela cheia vende mais do que um parágrafo.
4. **Não repetir:** dourado, serifa de luxo, carrossel promocional. Bom Beef se posiciona contra o "gourmet".
5. **Interpretação:** Netão colorido, gritando, em laranja: o oposto da pose.

### Shake Shack
1. **Funciona:** burger recortado grande sobre cor chapada, com sombra de campanha.
2. **Personalidade:** simplicidade de utilidade: pedir é o foco.
3. **Princípio útil:** recorte de produto grande não precisa de cenário.
4. **Não repetir:** a sobrecarga de script (2,4 MB) e o layout de carrossel de ofertas.
5. **Interpretação:** recorte no preto, com luz que reage ao gesto.

### Burger King BR
1. **Funciona:** sistema de marca coeso, com fonte própria e paleta quente.
2. **Personalidade:** irreverência de campanha.
3. **Princípio útil:** tipografia própria dá reconhecimento imediato.
4. **Não repetir:** herói com celebridade, identidade protegida e cookie cobrindo o conteúdo.
5. **Interpretação:** a slab da própria Bom Beef faz esse papel.

### Griddlemere (Lime Duo)
1. **Funciona:** sequência de imagens em canvas com stage sticky; a história de rua → chapa → montagem → balcão.
2. **Personalidade:** cinema noturno, marquee de slab sobre vermelho.
3. **Princípio útil:** `position: sticky` com scrub mantém o scroll nativo; um objeto só conduz a história.
4. **Não repetir:** 250 requisições (246 imagens), layout, marquee, néon. Coincide com a mesma fonte, então o layout precisa ser outro.
5. **Interpretação:** WebGL com uma foto e um mapa de profundidade: efeito de volume sem centenas de quadros.

### Smashburger (franquia)
1. **Funciona:** nenhuma distração até o formulário.
2. **Personalidade:** direta, sem cerimônia.
3. **Princípio útil:** o formulário precisa ser óbvio.
4. **Não repetir:** pedir dados antes de explicar qualquer coisa; layout de formulário puro.
5. **Interpretação:** informação primeiro (formatos, números, FAQ), CTA em todo ponto de decisão, formulário curto no fim.

### Impasto (Awwwards Nominee)
1. **Funciona:** ritmo editorial e transições longas. **[parcial]**
2. **Personalidade:** artesanal, lenta.
3. **Princípio útil:** contraste de ritmo entre seções.
4. **Não repetir:** loader bloqueante, cursor customizado, Lenis (troca o scroll nativo) e overflow horizontal observado na abertura.
5. **Interpretação:** CTA e nav usáveis desde o primeiro quadro.

### Proteinbolaget (Awwwards Nominee)
1. **Funciona:** bloco laranja no header como assinatura; sticky de mídia para destaque.
2. **Personalidade:** varejo enérgico.
3. **Princípio útil:** uma cor saturada vira identidade sem efeito.
4. **Não repetir:** 7 vídeos e 2,8 MB na home.
5. **Interpretação:** laranja como superfície inteira em momentos escolhidos.

### Awwwards e SiteInspire
Usados como régua e fonte de descoberta. O padrão recorrente em Food & Drink: GSAP + ScrollTrigger, Lenis, um elemento memorável e pouca preocupação com franquia. **[hip, amostra pequena]**

## Conclusões aplicadas

- Nenhum concorrente direto tem interação de scroll. O campo está aberto para o burger como assinatura.
- Nenhum concorrente direto comunica franquia na home. Bom Beef ganha ao tratar isso como seção própria, em outro registro visual.
- Nada de código, asset ou layout de referência foi reutilizado. Fotos e textos vêm só da Bom Beef.
