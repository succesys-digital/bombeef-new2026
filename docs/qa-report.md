# QA e performance

Executado em 2026-11-01 com Chrome DevTools MCP sobre `wrangler pages dev` (build de produção e Pages Function reais).

## Performance: atual x novo

Mesmo perfil: 390×844, CPU 4x, Fast 4G. Medido com `PerformanceObserver`.

| Página | Site | LCP | CLS |
|---|---|---|---|
| Home | Atual | 6,7 s | 0,94 |
| Home | **Novo** | **0,6 s** | **0** |
| Franquia | Atual | 8,2 s | 0,085 |
| Franquia | **Novo** | **0,85 s** | **0** |

Referência de campo do site atual (CrUX, home): LCP 2,1 s, INP 62 ms, CLS 0,55.

**Atenção, a comparação favorece o novo.** Ele rodou em localhost, sem distância de rede e sem GTM. O site atual rodou em produção, com todas as tags. O ganho de CLS é real. O de LCP só será confirmado com medição no domínio publicado. Trace com throttling da home nova: LCP 1038 ms antes do cache, CLS 0.

Não houve INP de campo nem teste em aparelho físico.

JS: bundle da home com 119 KB sem compressão (GSAP, ScrollTrigger e cena). Demais páginas: 2,4 KB.

## Lighthouse

A ferramenta usada não inclui a categoria Performance; por isso o trace acima.

| Página | Dispositivo | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Home | Mobile (snapshot) | 100 | 100 | 100 |
| Home | Desktop | 100 | 100 | 100 |
| Franquia | Mobile | 100 | 100 | 100 |

Achado corrigido: link dentro do `tablist` (95 na primeira rodada). Lighthouse automatizado não substitui teste com leitor de tela, que não foi feito.

## Testes automatizados

| Comando | Resultado |
|---|---|
| `npm test` | 12 de 12 (validação de lead e payload do RD) |
| `npx astro check` | 0 erros, 0 avisos |
| `node tests/site.mjs <url>` | Links, assets, `h1`, `title`, `alt`, dimensões de imagem: ver última execução no PR |

## Matriz manual

| # | Verificação | Resultado |
|---|---|---|
| 1 | Rotas carregam | OK: 50 páginas HTML |
| 2 | Animação do burger | OK em 1440 e 390. Arrasto por evento sintético e teclado |
| 3 | Scroll sem saltos ou sobreposição | OK nos pontos testados; não houve teste contínuo em aparelho real |
| 4 | Navegação | OK |
| 5 | Menu mobile abre e fecha | OK |
| 6 | CTAs e destinos | OK pelo crawler |
| 7 | Validação do formulário | OK: 7 erros inline, foco no primeiro campo. Sem token: mostra erro, dados preservados |
| 8 | YouTube | OK: thumb e player só após o clique, em `youtube-nocookie.com` |
| 9 | Overflow em 375, 390, 768 e 1440 | OK em 12 rotas, após corrigir `/cardapio/` em 375 e 390 |
| 10 | Erros de console | Nenhum nas rotas visitadas |
| 11 | Acessibilidade crítica | Nenhuma falha automatizada |
| 12 | Reduced motion | OK em 768: sem sticky, sem canvas, passos em lista |
| 13 | Requisições quebradas | Nenhuma |
| 14 | Voltar e avançar | OK |
| 15 | Throttling mobile | OK: ver tabela acima |
| 16 | Filtro de unidades | OK: UF, texto sem acento, vazio, limpar |
| 17 | Sem WebGL (fallback) | **Não testado em ambiente sem WebGL**; caminho de código existe |
| 18 | Safari e Firefox | **Não testado.** Só Chromium |

## Bugs achados e corrigidos

- Burger sumia ao recarregar com a página já rolada: posição agora vem do layout, não do scroll.
- Medição errada durante a animação de entrada: corrigida pelo mesmo motivo.
- Bordas duplas no parallax: profundidade estendida além da silhueta.
- Fotos do cardápio com fundo branco sobre preto: fundo removido na importação.
- Texto do meta description sem respaldo ("mais de 30 cidades"): removido.
- URLs antigas de unidade quebrariam: redirecionadas.

## Capturas

`docs/qa/`: home em 1440 e 390, história em 1440, franquia em 390.
