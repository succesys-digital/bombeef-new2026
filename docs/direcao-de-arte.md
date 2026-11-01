# Direção de arte

## Conceito: menos gourmet, mais qualidade, literalmente

O slogan da marca já é um sistema gráfico. O sinal de **−** e o de **+** conduzem o site: na abertura, "− Gourmet" encolhe e "+ Qualidade" cresce até sair da tela. O mesmo `+` marca CTAs, lista de benefícios, FAQ e separa as cidades. O vocabulário vem do açougue: papel de embrulho, etiqueta de preço, peso em gramas.

## Cor

| Token | Hex | Uso |
|---|---|---|
| `--carvao` | `#000000` | Fundo de consumo. O preto puro já é da marca e faz o burger recortado saltar |
| `--brasa` | `#ea6323` | Amostrado do logo oficial. Texto sobre ela sempre preto (7:1) |
| `--papel` | `#f2c8a4` | Papel de açougue pêssego: o registro de franquia, mais sério |
| `--osso` | `#f7efe3` | Texto sobre preto e campos de formulário |
| `--pimenta` | `#a81c08` | Hover de CTA e marcador sobre papel |
| `--cinza`, `--marrom` | `#b9aea2`, `#4a2a14` | Texto secundário, sobre preto e sobre papel |

## Tipografia

- **Alfa Slab One**: display. Já é usada na LP atual e é coerente com o wood-type do logo.
- **Barlow Condensed 600**: rótulos, navegação, dados curtos.
- **Barlow 400/500**: texto corrido.

Fontes self-hosted (`@fontsource`): nenhum pedido ao Google Fonts, melhor para LGPD e LCP. Slab só em caixa alta de títulos; sem eyebrows em caixa alta espaçada.

## Layout

Alinhado à esquerda, com a tipografia ocupando a largura. O burger se sobrepõe ao título no hero (a slab fica atrás). Sem grade de cards: formatos de franquia são uma tabela de especificações real, cidades são uma linha corrida de tipo, gramaturas são uma lista grande.

```
Hero                         História (sticky)            Fim
− GOURMET                    [pão]          PÃO           ESTE É O     [burger]
+ QUALIDADE (largura toda)   [queijo+carne] texto         BIG NETO     em laranja
texto      [burger]          [queijo+carne]               CTA cardápio
CTA                          [salada+pão]
```

## Fotografia

Só material real: recortes do cardápio digital e fotos do site atual. Recorte sobre cor chapada, sem cenário falso. A foto do hero é o Big Neto, porque leva o apelido do fundador e tem camadas bem distintas.

## Movimento

| Tipo | Duração | Curva | Onde |
|---|---|---|---|
| Resposta | 160 ms | `cubic-bezier(.2,.8,.2,1)` | Botões, links, `+` que gira |
| Conteúdo | 420 ms | mesma | Menu, troca de gramatura |
| Abertura | 0,7 a 1,5 s | `power3.out` | Só o hero |
| História | Atrelada ao scroll | `none`, `power2.inOut` | Só a home |

Regras: um momento orquestrado por página. Sem fade-up em toda seção. Nav e CTA funcionam desde o primeiro quadro. Scroll sempre nativo: sem Lenis, sem scrolljacking.

## Revisão contra o genérico

Primeira ideia descartada: papel creme com serifa e vermelho (clichê de "artesanal"). Segunda descartada: preto com um acento neon sobre layout de cards. O plano final usa preto mesmo, mas porque é a cor oficial, e o que o torna próprio é a mecânica do − e +, o papel pêssego e o burger real que se abre.
