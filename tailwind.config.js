/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    /* ── Spacing: multiples of 8px ──
       Tailwind default: 1 unit = 4px
       Multiples of 8 = even numbers (2,4,6,8,10,12,16,20,24...)
       Named aliases added for semantic clarity */
    extend: {
      fontFamily: {
        sans:  ['var(--font-sans)'],
        inter: ['var(--font-sans)'],
        'work-sans': ['var(--font-sans)'],
      },

      /* ── Border Radius (8px grid) ── */
      borderRadius: {
        xs:   'var(--radius-xs)',   /* 4px */
        sm:   'var(--radius-sm)',   /* 6px */
        DEFAULT: 'var(--radius)',   /* 8px */
        md:   'var(--radius-md)',   /* 12px */
        lg:   'var(--radius-lg)',   /* 16px */
        xl:   'var(--radius-xl)',   /* 24px */
        '2xl': 'var(--radius-2xl)',  /* 32px */
        full: 'var(--radius-full)',
      },

      /* ── Colors ── */
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        surface: {
          1: 'hsl(var(--surface-1))',
          2: 'hsl(var(--surface-2))',
          3: 'hsl(var(--surface-3))',
        },
        brand: {
          red:    '#FF3932',
          orange: '#FF8348',
        },
        card:        { DEFAULT: 'hsl(var(--card))',       foreground: 'hsl(var(--card-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))',    foreground: 'hsl(var(--popover-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))',    foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))',  foreground: 'hsl(var(--secondary-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))',      foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))',     foreground: 'hsl(var(--accent-foreground))' },
        success:     { DEFAULT: 'hsl(var(--success))',    foreground: 'hsl(var(--success-foreground))' },
        warning:     { DEFAULT: 'hsl(var(--warning))',    foreground: 'hsl(var(--warning-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT:            'hsl(var(--sidebar-bg))',
          foreground:         'hsl(var(--sidebar-foreground))',
          primary:            'hsl(var(--primary))',
          'primary-foreground': 'hsl(0 0% 100%)',
          accent:             'hsl(var(--sidebar-hover))',
          'accent-foreground': 'hsl(var(--sidebar-foreground))',
          border:             'hsl(var(--border))',
        },
      },

      /* ── Spacing aliases (multiples of 8) ── */
      spacing: {
        /* Semantic tokens */
        'component-gap': 'var(--space-4)',   /* 16px — gap between form fields */
        'card-gap':      'var(--space-6)',   /* 24px — gap between cards */
        'section-gap':   'var(--space-8)',   /* 32px — gap between sections */
        'page-pad':      'var(--space-8)',   /* 32px — page horizontal padding */
        'card-pad':      'var(--space-6)',   /* 24px — card inner padding */
        'modal-pad':     'var(--space-8)',   /* 32px — modal inner padding */
        /* Grid scale (ensures multiples of 8 usage) */
        '18': '4.5rem',   /* 72px */
        '22': '5.5rem',   /* 88px */
        '26': '6.5rem',   /* 104px */
        '30': '7.5rem',   /* 120px */
        '34': '8.5rem',   /* 136px */
        '38': '9.5rem',   /* 152px */
        '42': '10.5rem',  /* 168px */
        '50': '12.5rem',  /* 200px */
        '54': '13.5rem',  /* 216px */
        '58': '14.5rem',  /* 232px */
        '62': '15.5rem',  /* 248px */
        '68': '17rem',    /* 272px */
        '76': '19rem',    /* 304px */
        '84': '21rem',    /* 336px */
        '88': '22rem',    /* 352px */
        '92': '23rem',    /* 368px */
        '100': '25rem',   /* 400px */
        '104': '26rem',   /* 416px */
        '112': '28rem',   /* 448px */
        '120': '30rem',   /* 480px */
        '128': '32rem',   /* 512px */
      },

      /* ── Box Shadows ── */
      boxShadow: {
        xs:           'var(--shadow-xs)',
        sm:           'var(--shadow-sm)',
        DEFAULT:      'var(--shadow)',
        md:           'var(--shadow-md)',
        lg:           'var(--shadow-lg)',
        xl:           'var(--shadow-xl)',
        brand:        'var(--shadow-brand)',
        'brand-lg':   'var(--shadow-brand-lg)',
        'elevation-1': 'var(--shadow-sm)',
        'elevation-2': 'var(--shadow)',
        'elevation-3': 'var(--shadow-md)',
        'elevation-4': 'var(--shadow-lg)',
        'elevation-5': 'var(--shadow-xl)',
        none:         'none',
      },

      /* ── Typography Scale ── */
      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '0.875rem' }],  /* 10px */
        xs:    ['0.75rem',   { lineHeight: '1rem' }],       /* 12px */
        sm:    ['0.875rem',  { lineHeight: '1.25rem' }],    /* 14px */
        base:  ['1rem',      { lineHeight: '1.5rem' }],     /* 16px */
        lg:    ['1.125rem',  { lineHeight: '1.75rem' }],    /* 18px */
        xl:    ['1.25rem',   { lineHeight: '1.75rem' }],    /* 20px */
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],       /* 24px */
        '3xl': ['1.875rem',  { lineHeight: '2.25rem' }],    /* 30px */
        '4xl': ['2.25rem',   { lineHeight: '2.5rem' }],     /* 36px */
        '5xl': ['3rem',      { lineHeight: '1.2' }],        /* 48px */
        '6xl': ['3.75rem',   { lineHeight: '1.1' }],        /* 60px */
      },

      /* ── Font Weights (Work Sans) ── */
      fontWeight: {
        light:      '300',
        normal:     '400',
        medium:     '500',
        semibold:   '600',
        bold:       '700',
        extrabold:  '800',
      },

      /* ── Line Heights ── */
      lineHeight: {
        tight:    '1.2',
        snug:     '1.375',
        normal:   '1.5',
        relaxed:  '1.625',
        loose:    '1.75',
      },

      /* ── Animations ── */
      keyframes: {
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to:   { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          to:   { height: '0', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(100%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'pulse-brand': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,57,50, 0.4)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(255,57,50, 0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'fade-in':         'fade-in 0.2s ease-out',
        'fade-up':         'fade-up 0.3s ease-out',
        'fade-down':       'fade-down 0.3s ease-out',
        'scale-in':        'scale-in 0.2s ease-out',
        'slide-in-right':  'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
        'spin-slow':       'spin-slow 3s linear infinite',
        'pulse-brand':     'pulse-brand 2s ease-in-out infinite',
        'shimmer':         'shimmer 2s linear infinite',
      },

      /* ── Max Widths ── */
      maxWidth: {
        'content':  '720px',
        'wide':     '1024px',
        'full':     '1280px',
        'ultrawide':'1536px',
      },

      /* ── Z-Index scale ── */
      zIndex: {
        'dropdown':  '1000',
        'sticky':    '1020',
        'fixed':     '1030',
        'modal-bg':  '1040',
        'modal':     '1050',
        'popover':   '1060',
        'tooltip':   '1070',
        'toast':     '1080',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
