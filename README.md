# Bom Beef Burgers

Site institucional e de captação de franqueados da Bom Beef Burgers. Astro estático com Pages Functions, hospedado no Cloudflare Pages.

## Rodar

```bash
npm install
npm run dev
```

Para testar com a Function de lead e os arquivos `_headers` e `_redirects`:

```bash
npm run build
npm run preview
```

Em pasta de caminho muito longo no Windows, o `wrangler` falha com `SQLITE_CANTOPEN`. Use `--persist-to` com um caminho curto.

## Verificar

```bash
npm test
npx astro check
node tests/site.mjs http://localhost:8788
```

## Publicar no Cloudflare Pages

1. **Workers & Pages → Create → Pages → Connect to Git**, repositório `succesys-digital/bombeef-new2026`.
2. Framework: **Astro**. Build: `npm run build`. Saída: `dist`. A versão do Node vem de `.node-version`.
3. Em **Settings → Variables and Secrets**:

| Variável | Onde | Valor |
|---|---|---|
| `RD_PUBLIC_TOKEN` | Runtime, como secret | Token público do RD Station. É o mesmo do formulário atual |
| `RD_CONVERSION_ID` | Runtime, opcional | Padrão: `form-p9-bb-burger` |
| `PUBLIC_GTM_ID` | **Build** | ID do GTM. Sem ele, nenhuma tag nem banner de cookies |

4. Branches ganham preview automático em `*.pages.dev`. O build de produção só passa quando a `main` tem o site; antes do merge ele falha com `ENOENT package.json`.
5. Antes de apontar o domínio, resolva `docs/pendencias.md`.

## Atualizar conteúdo

Unidades, cardápio, vídeos e política são um snapshot do site atual:

```bash
npm run import:content
```

Revise o diff antes de commitar. Dados de franquia ficam em `src/data/franchise.ts`, com a fonte indicada.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/pages/` | Rotas. Mantêm os caminhos antigos: `/quero-ser-franqueado/`, `/unidades/<slug>/` |
| `src/scripts/burger-gl.ts` | Cena WebGL do burger |
| `src/scripts/home-story.ts` | Timeline GSAP e entrada do usuário |
| `src/scripts/site.ts` | Menu, vídeos, filtro, formulário, consentimento |
| `src/lib/lead.ts`, `functions/api/lead.ts` | Validação e envio ao RD Station |
| `public/burger/` | Foto e mapa de profundidade do hero |

## Documentação

- [Benchmark de referências](docs/design-research/benchmark.md)
- [Direção de arte](docs/direcao-de-arte.md)
- [Arquitetura e animação](docs/animation-architecture.md)
- [QA e performance](docs/qa-report.md)
- [Pendências antes de publicar](docs/pendencias.md)
