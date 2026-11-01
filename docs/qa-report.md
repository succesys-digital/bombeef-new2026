# QA e performance

Executado em 2026-11-01 com Chrome DevTools MCP, sobre `wrangler pages dev` e depois sobre o deploy real no Cloudflare Pages. Lighthouse e a matriz manual rodaram no ambiente local.

## Performance: atual x novo

Mesmo perfil: 390×844, CPU 4x, Fast 4G. Medido com `PerformanceObserver` em `bombeef-new2026.pages.dev`, recarregando sem cache do navegador.

| Página | Site | LCP | CLS | Transferido |
|---|---|---|---|---|
| Home | Atual | 6,7 s | 0,94 | 1,7 MB |
| Home | **Novo** | **0,68 s** | **0** | 443 KB |
| Franquia | Atual | 8,2 s | 0,085 | 3,9 MB |
| Franquia | **Novo** | **2,32 s** | **0** | 181 KB |

Numa segunda visita, com cache, a franquia caiu para 0,40 s. A medição é de uma rodada por página, então serve de ordem de grandeza.

Referência de campo do site atual (CrUX, home): LCP 2,1 s, INP 62 ms, CLS 0,55.

**Limites da comparação.** O site novo ainda roda sem GTM e sem pixels, e o atual carrega todas as tags. Parte da vantagem pode diminuir quando o GTM entrar: medir de novo nesse momento.

Não há INP de campo nem teste em aparelho físico.

## Produção

Validado em `https://bombeef-new2026.pages.dev` após o merge:

- Crawl: 410 URLs, 50 páginas HTML, sem link ou asset quebrado.
- `_headers`: CSP, `X-Frame-Options` e `nosniff` presentes. `_redirects`: `/nossas-unidades/` responde 301 e `/unidades/ribeirao-preto/` responde 302. Página 404 responde 404.
- Function `/api/lead`: lead inválido responde 422. Lead válido não foi enviado em produção, para não chegar ao CRM.
- HTML com compressão Brotli. WebGL ativo no mobile, sem overflow.
- Console: sem erros. Chrome lista 1 aviso "Lazy-loaded images should have explicit dimensions (count: 2)", mas nenhuma imagem lazy da página está sem `width` e `height`. Causa não identificada.

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
| `node tests/site.mjs <url>` | Links, assets, `h1`, `title`, `alt` e dimensões de imagem: OK local e em produção. Lead válido só em localhost |

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
