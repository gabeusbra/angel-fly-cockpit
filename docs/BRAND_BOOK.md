# Angel Fly Cockpit — Brand Book & UI Handoff

> **Versão:** 1.0 · **Data:** Abril 2026  
> Este documento é a fonte de verdade visual do sistema. Todo desenvolvedor ou IA deve seguir estes padrões antes de criar ou modificar componentes.

---

## Índice

1. [Identidade da Marca](#1-identidade-da-marca)
2. [Sistema de Cores](#2-sistema-de-cores)
3. [Tipografia](#3-tipografia)
4. [Espaçamento & Grid](#4-espaçamento--grid)
5. [Border Radius](#5-border-radius)
6. [Sombras & Elevação](#6-sombras--elevação)
7. [Temas: Light & Dark](#7-temas-light--dark)
8. [Logo & Branding](#8-logo--branding)
9. [Componentes Base](#9-componentes-base)
10. [Biblioteca de Ícones](#10-biblioteca-de-ícones)
11. [Animações & Transições](#11-animações--transições)
12. [Layout & Estrutura de Páginas](#12-layout--estrutura-de-páginas)
13. [Padrões de Acessibilidade](#13-padrões-de-acessibilidade)
14. [Referências Rápidas de Código](#14-referências-rápidas-de-código)

---

## 1. Identidade da Marca

**Angel Fly Digital Solutions** é uma agência de marketing e tecnologia com DNA ousado, moderno e sofisticado. O Cockpit é o centro de comando interno — deve transmitir **controle, clareza e eficiência**.

### Personalidade Visual
- **Ousada** — uso de vermelho/laranja vibrante como cor primária
- **Moderna** — tipografia limpa, espaços generosos, glassmorphism sutil
- **Profissional** — hierarquia clara, consistência rigorosa
- **Dinâmica** — gradientes, animações suaves, microinterações

---

## 2. Sistema de Cores

### 2.1 Cores da Marca (Brand)

| Token | Hex | HSL | Uso |
|-------|-----|-----|-----|
| `--brand-red` | `#FF3932` | `hsl(2 100% 61%)` | Botões primários, CTAs, destaques |
| `--brand-orange` | `#FF8348` | `hsl(22 100% 64%)` | Acento, hover states, gradiente fim |
| Brand Gradient | `#FF3932 → #FF8348` | — | Botões principais, headers, logos |

```css
/* Gradiente padrão da marca */
background: linear-gradient(135deg, #FF3932 0%, #FF8348 100%);

/* Classe utilitária */
className="brand-gradient"
className="brand-gradient-text"  /* para texto */
```

### 2.2 Paleta Light Theme

| Token Tailwind | CSS Variable | Hex Aproximado | Uso |
|---------------|--------------|----------------|-----|
| `bg-background` | `--background` | `#F4F0E8` | Fundo principal da página |
| `bg-surface-1` | `--surface-1` | `#FFFFFF` | Cards, modais |
| `bg-surface-2` | `--surface-2` | `#EDE9DF` | Surfaces elevadas |
| `bg-surface-3` | `--surface-3` | `#E3DDD3` | Surfaces mais elevadas |
| `text-foreground` | `--foreground` | `#141414` | Texto principal |
| `text-muted-foreground` | `--muted-foreground` | `#6B6B6B` | Textos secundários/placeholder |
| `bg-primary` | `--primary` | `#FF3932` | Botões primários |
| `bg-accent` | `--accent` | `#FF8348` | Acento, badges |
| `bg-secondary` | `--secondary` | `#EDE9DF` | Botões secundários |
| `bg-card` | `--card` | `#FFFFFF` | Fundo de cards |
| `border-border` | `--border` | `rgba(0,0,0,0.10)` | Bordas de componentes |

### 2.3 Paleta Dark Theme

| Token Tailwind | CSS Variable | Hex Aproximado | Uso |
|---------------|--------------|----------------|-----|
| `bg-background` | `--background` | `#0E1117` | Fundo principal |
| `bg-surface-1` | `--surface-1` | `#141820` | Cards |
| `bg-surface-2` | `--surface-2` | `#191F2B` | Surfaces elevadas |
| `bg-surface-3` | `--surface-3` | `#1F2637` | Mais elevadas |
| `text-foreground` | `--foreground` | `#F2F2F2` | Texto principal |
| `text-muted-foreground` | `--muted-foreground` | `#9CA3AF` | Texto secundário |
| `bg-card` | `--card` | `#141820` | Fundo de cards |
| `border-border` | `--border` | `rgba(255,255,255,0.12)` | Bordas |

### 2.4 Cores Semânticas (Status)

| Token | Hex | Uso |
|-------|-----|-----|
| `bg-success` | `#22C55E` | Sucesso, aprovado, ativo |
| `bg-warning` | `#F5A623` | Alerta, pendente, atenção |
| `bg-destructive` | `#EF4444` | Erro, deletar, crítico |
| `bg-primary` | `#FF3932` | Ação primária |

```jsx
// Uso correto de cores semânticas
<Badge className="bg-success text-success-foreground">Aprovado</Badge>
<Badge className="bg-warning text-warning-foreground">Pendente</Badge>
<Badge className="bg-destructive text-destructive-foreground">Cancelado</Badge>
```

### 2.5 Regras de Uso de Cores

- ✅ Sempre use variáveis CSS (`hsl(var(--primary))`) ou classes Tailwind (`bg-primary`)
- ✅ Nunca hardcode cores hex diretamente em componentes
- ✅ Use `text-muted-foreground` para informações secundárias
- ✅ Use `brand-gradient` apenas em elementos de destaque (botões CTA, headers, logos)
- ❌ Nunca use mais de 2 cores da marca no mesmo componente sem gradiente

---

## 3. Tipografia

### 3.1 Fonte Principal: Work Sans

**Google Fonts:** `https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800`

```css
font-family: "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
```

### 3.2 Escala Tipográfica

| Classe Tailwind | Tamanho | Peso | Uso |
|----------------|---------|------|-----|
| `text-2xs` | 10px | 400 | Labels minúsculos, badges compactos |
| `text-xs` | 12px | 400–500 | Metadados, timestamps, labels |
| `text-sm` | 14px | 400–500 | Texto de interface, descrições |
| `text-base` | 16px | 400 | Texto corrido padrão |
| `text-lg` | 18px | 500–600 | Subtítulos de seções |
| `text-xl` | 20px | 600 | Títulos de cards |
| `text-2xl` | 24px | 600–700 | Títulos de páginas (mobile) |
| `text-3xl` | 30px | 700 | Títulos de páginas |
| `text-4xl` | 36px | 700–800 | Display / Hero |
| `text-5xl` | 48px | 800 | Display grande |

### 3.3 Pesos (Font Weights)

| Peso | Valor | Uso Principal |
|------|-------|---------------|
| Light | 300 | Subtítulos decorativos |
| Regular | 400 | Texto corrido, parágrafos |
| Medium | 500 | Labels, badges, navegação |
| SemiBold | 600 | Subtítulos, card titles |
| Bold | 700 | Títulos, headings |
| ExtraBold | 800 | Display, hero titles |

### 3.4 Hierarquia em Uso

```jsx
// Título de página
<h1 className="text-3xl font-bold tracking-tight">Projetos</h1>

// Subtítulo de seção
<h2 className="text-xl font-semibold">Últimas Atividades</h2>

// Título de card
<h3 className="text-lg font-semibold">Nome do Projeto</h3>

// Label de campo
<label className="text-sm font-medium text-foreground">Email</label>

// Texto secundário
<p className="text-sm text-muted-foreground">Criado em 20 de abril</p>

// Badge / tag compacto
<span className="text-xs font-medium uppercase tracking-wide">Ativo</span>
```

### 3.5 Line Heights

| Classe | Valor | Uso |
|--------|-------|-----|
| `leading-tight` | 1.2 | Títulos grandes |
| `leading-snug` | 1.375 | Headings |
| `leading-normal` | 1.5 | Texto corrido (padrão) |
| `leading-relaxed` | 1.625 | Parágrafos longos |
| `leading-loose` | 1.75 | Texto espaçado |

---

## 4. Espaçamento & Grid

### 4.1 Regra de Ouro: Múltiplos de 8

**Todo padding, margin, gap e tamanho fixo deve ser múltiplo de 8px.**

Isso garante consistência visual e alinhamento perfeito na grid.

```
4px  = 0.5 × 8  → micro ajustes apenas (text-xs gap, icon offset)
8px  = 1 × 8    → gap entre elementos irmãos pequenos
16px = 2 × 8    → padding de componente, gap de inputs
24px = 3 × 8    → padding interno de cards, gap entre cards
32px = 4 × 8    → padding de página, gap entre seções
40px = 5 × 8    → espaçamento de seções grandes
48px = 6 × 8    → gap entre blocos de conteúdo
64px = 8 × 8    → padding de página (desktop)
80px = 10 × 8   → espaçamentos de hero/display
96px = 12 × 8   → máximos de espaçamento
```

### 4.2 Tokens Semânticos de Espaçamento

| Token CSS / Tailwind | Valor | Uso |
|---------------------|-------|-----|
| `var(--space-2)` / `p-2` | 8px | Gap entre ícone e texto |
| `var(--space-4)` / `p-4` | 16px | Padding interno de botões, gap entre inputs |
| `var(--space-6)` / `p-6` | 24px | Padding de cards, gap entre cards |
| `var(--space-8)` / `p-8` | 32px | Padding de página, gap entre seções |
| `var(--space-12)` / `p-12` | 48px | Padding de modais, gap grande |
| `var(--space-16)` / `p-16` | 64px | Padding de página (desktop) |

### 4.3 Classes Semânticas

```jsx
// Uso de spacing classes
<div className="card-gap">       {/* gap: 24px entre cards */}
<div className="section-gap">   {/* gap: 32px entre seções */}
<div className="component-gap"> {/* gap: 16px entre campos */}

// Padding de página
<main className="page-container"> {/* max-w + padding: 32px */}
```

### 4.4 Grid de Layout

```jsx
// Grid de cards (3 colunas no desktop)
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

// Grid de stats (4 colunas)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

// Layout de 2 colunas (lista + detalhe)
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">

// Stack vertical
<div className="flex flex-col gap-6">
```

---

## 5. Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-xs` | 4px | Badges, tags compactos |
| `rounded-sm` | 6px | Inputs, selects |
| `rounded` | 8px | Botões, tooltips |
| `rounded-md` | 12px | Cards, dropdowns |
| `rounded-lg` | 16px | Modais, sheets |
| `rounded-xl` | 24px | Cards grandes, hero |
| `rounded-2xl` | 32px | Imagens de perfil, destaque |
| `rounded-full` | 9999px | Avatars, pills, dots |

```jsx
// Exemplos práticos
<Button className="rounded">Ação</Button>          // 8px — padrão
<Card className="rounded-md">...</Card>             // 12px — cards
<Dialog className="rounded-lg">...</Dialog>         // 16px — modais
<Avatar className="rounded-full">...</Avatar>       // circle
<Badge className="rounded-full px-3">Tag</Badge>    // pill
```

---

## 6. Sombras & Elevação

O sistema de elevação usa 5 níveis para comunicar hierarquia.

| Nível | Token / Classe | Uso |
|-------|---------------|-----|
| 0 | `shadow-none` | Flat, sem elevação |
| 1 | `shadow-xs` / `shadow-elevation-1` | Hover de lista, inputs focus |
| 2 | `shadow-sm` / `shadow-elevation-2` | Cards estáticos |
| 3 | `shadow` / `shadow-elevation-3` | Cards com hover, dropdowns |
| 4 | `shadow-md` / `shadow-elevation-4` | Modais, sheets |
| 5 | `shadow-lg` / `shadow-elevation-5` | Notificações, toasts |

### Sombra da Marca

```jsx
// Botão CTA com shadow da marca
<Button className="brand-gradient shadow-brand hover:shadow-brand-lg transition-slow">
  Criar Projeto
</Button>
```

### Glass Effect

```jsx
// Painel com glassmorphism
<div className="glass-panel rounded-lg p-6">...</div>

// Card glass sutil
<div className="glass-card p-6">...</div>
```

---

## 7. Temas: Light & Dark

### 7.1 Ativação

O tema é controlado pela classe `.dark` no `<html>` ou `<body>`. Gerenciado pelo pacote `next-themes`.

```jsx
// _app.jsx ou main.jsx
import { ThemeProvider } from 'next-themes'

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>

// Toggle de tema
import { useTheme } from 'next-themes'
const { theme, setTheme } = useTheme()
setTheme(theme === 'dark' ? 'light' : 'dark')
```

### 7.2 Regras de Tema

- ✅ Use sempre `dark:` prefix para overrides específicos
- ✅ Prefira variáveis CSS que já têm dark mode embutido
- ✅ Teste TODOS os componentes nos dois temas antes de finalizar
- ❌ Nunca use cores fixas sem variante dark
- ❌ Nunca use `bg-white` sem `dark:bg-[dark-equivalent]`

```jsx
// ✅ Correto — usa variável que já tem dark embutido
<div className="bg-card text-card-foreground">

// ✅ Correto — override explícito
<div className="bg-white dark:bg-surface-1">

// ❌ Errado — sem dark mode
<div style={{ background: '#FFFFFF' }}>
```

### 7.3 Paleta Visual Completa

```
LIGHT                              DARK
──────────────────────────────────────────────────
Fundo: #F4F0E8 (warm off-white)   Fundo: #0E1117 (deep navy)
Card:  #FFFFFF (branco)            Card:  #141820 (dark blue)
Texto: #141414 (near-black)        Texto: #F2F2F2 (off-white)
Muted: #6B6B6B (mid-gray)         Muted: #9CA3AF (cool gray)
Borda: rgba(0,0,0, 0.10)          Borda: rgba(255,255,255, 0.12)
──────────────────────────────────────────────────
Brand Red:    #FF3932  ←  IGUAL nos dois temas
Brand Orange: #FF8348  ←  IGUAL nos dois temas
```

---

## 8. Logo & Branding

### 8.1 Arquivos de Logo

| Arquivo | Localização | Uso |
|---------|-------------|-----|
| `logo-angelfly.png` | `/public/branding/logo-angelfly.png` | App, emails, documentos |
| `LOGO_ANGELFLY.png` | `/LOGO_ANGELFLY.png` | Referência master |

### 8.2 Uso Correto do Logo

```jsx
// Logo padrão no sidebar / header
<img
  src="/branding/logo-angelfly.png"
  alt="Angel Fly"
  className="h-8 w-auto"  // altura fixa 32px, largura automática
/>

// Logo em modo dark (use filter se necessário)
<img
  src="/branding/logo-angelfly.png"
  alt="Angel Fly"
  className="h-8 w-auto dark:brightness-0 dark:invert"
/>
```

### 8.3 Área de Proteção

- Manter espaço mínimo de **16px (--space-4)** em volta do logo
- Nunca deformar ou alterar proporções
- Nunca aplicar cores fora da paleta sobre o logo

### 8.4 Favicon

```html
<!-- index.html — SVG inline com cor da marca -->
<link rel="icon" type="image/svg+xml" href="..." />
```
Cor do favicon: `#FF4D35` (aproximação visual da marca)

### 8.5 PWA Manifest

```json
{
  "name": "Angel Fly Cockpit",
  "short_name": "AF Cockpit",
  "theme_color": "#FF4D35",
  "background_color": "#0f172a"
}
```

---

## 9. Componentes Base

### 9.1 Botões

```jsx
// Primário (brand gradient)
<Button className="brand-gradient text-white shadow-brand hover:shadow-brand-lg transition-slow font-semibold">
  Criar Projeto
</Button>

// Primário padrão (shadcn)
<Button>Salvar</Button>

// Secundário
<Button variant="secondary">Cancelar</Button>

// Outline
<Button variant="outline">Ver Detalhes</Button>

// Ghost (em tabelas, listas)
<Button variant="ghost" size="icon">
  <MoreHorizontal className="h-4 w-4" />
</Button>

// Destructive
<Button variant="destructive">Excluir</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>    // h-8 text-sm
<Button size="default">Médio</Button> // h-10 text-base
<Button size="lg">Grande</Button>     // h-12 text-lg
<Button size="icon">...</Button>      // 40×40px square
```

### 9.2 Cards

```jsx
// Card padrão
<Card className="rounded-md shadow-elevation-2 hover:shadow-elevation-3 transition-default">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-semibold">Título</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* conteúdo — padding: 24px (p-6) */}
  </CardContent>
  <CardFooter className="pt-3 border-t border-border">
    {/* ações */}
  </CardFooter>
</Card>

// Card glass (painel especial)
<div className="glass-panel rounded-lg p-6">
  {/* conteúdo */}
</div>

// Stat card
<Card className="rounded-md p-6">
  <div className="flex items-center justify-between mb-4">
    <span className="text-sm font-medium text-muted-foreground">Total de Projetos</span>
    <div className="p-2 rounded-md bg-primary/10">
      <FolderOpen className="h-4 w-4 text-primary" />
    </div>
  </div>
  <div className="text-3xl font-bold">24</div>
  <p className="text-xs text-muted-foreground mt-1">+3 este mês</p>
</Card>
```

### 9.3 Badges / Status

```jsx
// Padrão
<Badge>Ativo</Badge>
<Badge variant="secondary">Rascunho</Badge>
<Badge variant="outline">Em Revisão</Badge>
<Badge variant="destructive">Cancelado</Badge>

// Custom com cores semânticas
<Badge className="bg-success/15 text-success border-success/20">Aprovado</Badge>
<Badge className="bg-warning/15 text-warning border-warning/20">Pendente</Badge>
<Badge className="bg-primary/15 text-primary border-primary/20">Em Progresso</Badge>

// Pill compacto
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
  Online
</span>
```

### 9.4 Inputs & Formulários

```jsx
// Campo padrão
<div className="space-y-2">
  <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
  <Input id="name" placeholder="Digite o nome..." className="rounded-sm" />
</div>

// Grupo de campos (gap: 24px)
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <FormField ... />
  <FormField ... />
</div>

// Seção de formulário (gap entre seções: 32px)
<form className="space-y-8">
  <section className="space-y-6"> {/* grupo de campos */}
    <h3 className="text-lg font-semibold">Informações Básicas</h3>
    <div className="grid gap-6"> ... </div>
  </section>
</form>
```

### 9.5 Tabelas

```jsx
<Table>
  <TableHeader>
    <TableRow className="border-border hover:bg-transparent">
      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Nome
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-border hover:bg-muted/50 transition-fast">
      <TableCell className="font-medium">...</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 9.6 Página Header Padrão

```jsx
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-3xl font-bold">Projetos</h1>
    <p className="text-muted-foreground mt-1">Gerencie todos os projetos ativos</p>
  </div>
  <Button className="brand-gradient text-white shadow-brand">
    <Plus className="h-4 w-4 mr-2" />
    Novo Projeto
  </Button>
</div>
```

---

## 10. Biblioteca de Ícones

### Lucide React (padrão do sistema)

**Pacote:** `lucide-react@0.475.0`  
**Docs:** https://lucide.dev/icons

```jsx
import { FolderOpen, Users, TicketCheck, CreditCard, Settings } from 'lucide-react'

// Tamanhos padrão
<Icon className="h-3 w-3" />   // 12px — badges, inline
<Icon className="h-4 w-4" />   // 16px — botões, listas (mais comum)
<Icon className="h-5 w-5" />   // 20px — subtítulos
<Icon className="h-6 w-6" />   // 24px — navegação, destaque
<Icon className="h-8 w-8" />   // 32px — feature icons, stat cards
<Icon className="h-12 w-12" /> // 48px — empty states, hero
```

### Ícones por Contexto

| Contexto | Ícone | Import |
|---------|-------|--------|
| Projetos | `FolderOpen` | lucide-react |
| Clientes | `Users` | lucide-react |
| Tickets | `TicketCheck` | lucide-react |
| Pagamentos | `CreditCard` | lucide-react |
| Tarefas | `CheckSquare` | lucide-react |
| Relatórios | `BarChart2` | lucide-react |
| Configurações | `Settings` | lucide-react |
| Adicionar | `Plus` | lucide-react |
| Editar | `Pencil` | lucide-react |
| Deletar | `Trash2` | lucide-react |
| Fechar | `X` | lucide-react |
| Buscar | `Search` | lucide-react |
| Filtrar | `Filter` | lucide-react |
| Calendário | `Calendar` | lucide-react |
| Notificação | `Bell` | lucide-react |
| Logout | `LogOut` | lucide-react |
| Menu | `Menu` | lucide-react |
| Seta direita | `ChevronRight` | lucide-react |
| Upload | `Upload` | lucide-react |
| Download | `Download` | lucide-react |
| Link | `ExternalLink` | lucide-react |
| Copiar | `Copy` | lucide-react |
| Olho | `Eye` / `EyeOff` | lucide-react |
| Alerta | `AlertCircle` | lucide-react |
| Sucesso | `CheckCircle` | lucide-react |
| Info | `Info` | lucide-react |

### Ícone + Texto (padrão)

```jsx
// Em botões
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Adicionar
</Button>

// Em navegação
<div className="flex items-center gap-3">
  <FolderOpen className="h-5 w-5 text-muted-foreground" />
  <span className="font-medium">Projetos</span>
</div>

// Ícone com background (stat card)
<div className="p-2 rounded-md bg-primary/10 dark:bg-primary/20">
  <FolderOpen className="h-5 w-5 text-primary" />
</div>
```

---

## 11. Animações & Transições

### 11.1 Transições CSS

```jsx
// Transição padrão (a maioria dos componentes)
className="transition-default"  // 200ms ease

// Transição rápida (hover states, focus)
className="transition-fast"     // 100ms ease

// Transição lenta (modais, expansões)
className="transition-slow"     // 300ms ease

// Spring (elementos que "saltam")
className="transition-spring"   // 400ms spring easing
```

### 11.2 Animações de Entrada

```jsx
// Fade simples
className="animate-fade-in"

// Fade + subida
className="animate-fade-up"

// Fade + descida
className="animate-fade-down"

// Scale in (modais, popovers)
className="animate-scale-in"

// Slide da direita (sheets, sidebars)
className="animate-slide-in-right"
```

### 11.3 Framer Motion (para animações complexas)

```jsx
import { motion } from 'framer-motion'

// Card com entrada
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>

// Lista com stagger
const container = {
  animate: { transition: { staggerChildren: 0.05 } }
}
const item = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 }
}
```

### 11.4 Regras de Animação

- ✅ Use `transition-default` em 90% dos casos
- ✅ Respeite `prefers-reduced-motion`
- ✅ Duração máxima de 400ms para UI
- ❌ Nunca anime `width/height` diretamente (use `max-height` ou `transform`)
- ❌ Evite animações longas (>500ms) em itens de lista

---

## 12. Layout & Estrutura de Páginas

### 12.1 Layout Global

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)  │  Main Content Area       │
│  ─────────────── │  ─────────────────────── │
│  Logo             │  PageHeader (h1 + CTA)   │
│  Nav Items        │  ─────────────────────── │
│                   │  Content Grid / Table    │
│                   │  (padding: 32px)         │
└─────────────────────────────────────────────┘
```

### 12.2 Estrutura de Página Padrão

```jsx
export default function MinhaPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Título da Página</h1>
          <p className="text-muted-foreground mt-1">Descrição breve</p>
        </div>
        <Button className="brand-gradient text-white shadow-brand">
          <Plus className="h-4 w-4 mr-2" /> Nova Ação
        </Button>
      </div>

      {/* Stats (opcional) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard />
      </div>

      {/* Conteúdo principal */}
      <Card className="rounded-md">
        <CardContent className="p-0">
          <Table>...</Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 12.3 Breakpoints

| Breakpoint | Largura | Uso |
|-----------|---------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeno (sidebar visível) |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop grande |

### 12.4 Sidebar

- **Largura desktop:** 240px
- **Mobile:** collapsible (Sheet)
- **Background light:** `#FFFFFF`
- **Background dark:** `hsl(224 24% 9%)`
- **Item ativo:** `bg-primary/10 text-primary font-semibold`
- **Item hover:** `bg-sidebar-hover`

---

## 13. Padrões de Acessibilidade

```jsx
// Labels sempre associados a inputs
<Label htmlFor="email">Email</Label>
<Input id="email" aria-describedby="email-hint" />
<p id="email-hint" className="text-xs text-muted-foreground">
  Informe um email válido
</p>

// Botões icon-only com aria-label
<Button size="icon" aria-label="Excluir projeto">
  <Trash2 className="h-4 w-4" />
</Button>

// Estados de loading
<Button disabled>
  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  Salvando...
</Button>

// Focus visible (já configurado globalmente)
// :focus-visible { outline: 2px solid hsl(var(--ring)); }

// Cores com contraste adequado
// Mínimo: 4.5:1 para texto normal, 3:1 para texto grande
// ✅ text-foreground sobre bg-background: ~15:1
// ✅ text-primary sobre bg-background: ~4.8:1
```

---

## 14. Referências Rápidas de Código

### Import padrão de ícones
```jsx
import {
  Plus, Pencil, Trash2, Search, Filter, Calendar,
  FolderOpen, Users, TicketCheck, CreditCard,
  BarChart2, Settings, Bell, LogOut, ChevronRight,
  CheckCircle, AlertCircle, Info, Loader2, MoreHorizontal,
  Eye, EyeOff, Upload, Download, ExternalLink, Copy
} from 'lucide-react'
```

### Import de componentes UI
```jsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
```

### Template de Card de Ação Rápida
```jsx
<Card className="rounded-md hover:shadow-md transition-default cursor-pointer group">
  <CardContent className="p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-fast">
        <FolderOpen className="h-5 w-5 text-primary" />
      </div>
      <Badge className="text-xs">Ativo</Badge>
    </div>
    <h3 className="font-semibold text-lg mb-1">Nome</h3>
    <p className="text-sm text-muted-foreground">Descrição breve aqui.</p>
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
      <span className="text-xs text-muted-foreground">Atualizado há 2h</span>
    </div>
  </CardContent>
</Card>
```

### Template de Empty State
```jsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="p-4 rounded-full bg-muted mb-4">
    <FolderOpen className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
    Crie seu primeiro projeto para começar a gerenciar tarefas e tickets.
  </p>
  <Button className="brand-gradient text-white shadow-brand">
    <Plus className="h-4 w-4 mr-2" />
    Criar Projeto
  </Button>
</div>
```

---

## Stack de Tecnologias

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | React | 18.2 |
| Build | Vite | 6.1 |
| Estilo | Tailwind CSS | 3.4 |
| Componentes | shadcn/ui (Radix) | latest |
| Ícones | Lucide React | 0.475 |
| Animações | Framer Motion | 11 |
| Tema | next-themes | 0.4 |
| Roteamento | React Router | 6 |
| Estado | Zustand | latest |
| Forms | React Hook Form + Zod | 7.x |
| Gráficos | Recharts | 2.x |
| Fonte | Work Sans (Google Fonts) | — |

---

*Este documento deve ser atualizado sempre que novos padrões forem estabelecidos. Última revisão: Abril 2026.*
