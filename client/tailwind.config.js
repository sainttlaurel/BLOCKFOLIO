/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Professional Trading Platform Breakpoints
      screens: {
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1199px'},
        'desktop': {'min': '1200px'},
        'mobile-only': {'max': '767px'},
        'tablet-only': {'min': '768px', 'max': '1199px'},
        'desktop-only': {'min': '1200px'},
        'not-mobile': {'min': '768px'},
        'not-desktop': {'max': '1199px'},
      },
      colors: {
        // Legacy colors for backward compatibility
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
        },
        danger: {
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        
        // Professional Trading Platform Color System
        // Matches CSS custom properties in professional-color-palette.css
        
        // Brand Colors (Primary Blue)
        brand: {
          primary: 'var(--color-brand-primary)',
          'primary-light': 'var(--color-brand-primary-light)',
          'primary-dark': 'var(--color-brand-primary-dark)',
          50: 'var(--color-brand-primary-50)',
          100: 'var(--color-brand-primary-100)',
          200: 'var(--color-brand-primary-200)',
          300: 'var(--color-brand-primary-300)',
          400: 'var(--color-brand-primary-400)',
          500: 'var(--color-brand-primary-500)',
          600: 'var(--color-brand-primary-600)',
          700: 'var(--color-brand-primary-700)',
          800: 'var(--color-brand-primary-800)',
          900: 'var(--color-brand-primary-900)',
        },
        
        // Neutral Colors (Fintech Standard)
        neutral: {
          white: 'var(--color-neutral-white)',
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
        
        // Market Indicators
        market: {
          // Green (Gains/Positive)
          'green-50': 'var(--color-market-green-50)',
          'green-100': 'var(--color-market-green-100)',
          'green-200': 'var(--color-market-green-200)',
          'green-300': 'var(--color-market-green-300)',
          'green-400': 'var(--color-market-green-400)',
          'green-500': 'var(--color-market-green-500)',
          'green-600': 'var(--color-market-green-600)',
          'green-700': 'var(--color-market-green-700)',
          'green-800': 'var(--color-market-green-800)',
          'green-900': 'var(--color-market-green-900)',
          
          // Red (Losses/Negative)
          'red-50': 'var(--color-market-red-50)',
          'red-100': 'var(--color-market-red-100)',
          'red-200': 'var(--color-market-red-200)',
          'red-300': 'var(--color-market-red-300)',
          'red-400': 'var(--color-market-red-400)',
          'red-500': 'var(--color-market-red-500)',
          'red-600': 'var(--color-market-red-600)',
          'red-700': 'var(--color-market-red-700)',
          'red-800': 'var(--color-market-red-800)',
          'red-900': 'var(--color-market-red-900)',
          
          // Semantic shortcuts
          positive: 'var(--color-market-green-600)',
          negative: 'var(--color-market-red-600)',
          'positive-bg': 'var(--color-market-green-50)',
          'negative-bg': 'var(--color-market-red-50)',
        },
        
        // Semantic Colors
        success: {
          50: 'var(--color-success-50)',
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
          300: 'var(--color-success-300)',
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
          800: 'var(--color-success-800)',
          900: 'var(--color-success-900)',
        },
        
        warning: {
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
        },
        
        error: {
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
        },
        
        info: {
          50: 'var(--color-info-50)',
          100: 'var(--color-info-100)',
          200: 'var(--color-info-200)',
          300: 'var(--color-info-300)',
          400: 'var(--color-info-400)',
          500: 'var(--color-info-500)',
          600: 'var(--color-info-600)',
          700: 'var(--color-info-700)',
          800: 'var(--color-info-800)',
          900: 'var(--color-info-900)',
        },
        
        // Surface Colors
        surface: {
          primary: 'var(--color-surface-primary)',
          secondary: 'var(--color-surface-secondary)',
          tertiary: 'var(--color-surface-tertiary)',
          elevated: 'var(--color-surface-elevated)',
          overlay: 'var(--color-surface-overlay)',
          glass: 'var(--color-surface-glass)',
        },
        
        // Text Colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          disabled: 'var(--color-text-disabled)',
          inverse: 'var(--color-text-inverse)',
          brand: 'var(--color-text-brand)',
        },
        
        // Border Colors
        border: {
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
          focus: 'var(--color-border-focus)',
          error: 'var(--color-border-error)',
          success: 'var(--color-border-success)',
          warning: 'var(--color-border-warning)',
        },
        
        // Trading Colors
        trading: {
          buy: 'var(--color-trading-buy)',
          'buy-hover': 'var(--color-trading-buy-hover)',
          'buy-light': 'var(--color-trading-buy-light)',
          'buy-bg': 'var(--color-trading-buy-bg)',
          
          sell: 'var(--color-trading-sell)',
          'sell-hover': 'var(--color-trading-sell-hover)',
          'sell-light': 'var(--color-trading-sell-light)',
          'sell-bg': 'var(--color-trading-sell-bg)',
          
          neutral: 'var(--color-trading-neutral)',
          'neutral-bg': 'var(--color-trading-neutral-bg)',
        },
        
        // Chart Colors
        chart: {
          primary: 'var(--color-chart-primary)',
          secondary: 'var(--color-chart-secondary)',
          grid: 'var(--color-chart-grid)',
          axis: 'var(--color-chart-axis)',
          'tooltip-bg': 'var(--color-chart-tooltip-bg)',
          'tooltip-text': 'var(--color-chart-tooltip-text)',
          
          'candle-up': 'var(--color-chart-candle-up)',
          'candle-down': 'var(--color-chart-candle-down)',
          'candle-up-border': 'var(--color-chart-candle-up-border)',
          'candle-down-border': 'var(--color-chart-candle-down-border)',
          
          'volume-up': 'var(--color-chart-volume-up)',
          'volume-down': 'var(--color-chart-volume-down)',
        },
        
        // Portfolio Colors
        portfolio: {
          positive: 'var(--color-portfolio-positive)',
          negative: 'var(--color-portfolio-negative)',
          neutral: 'var(--color-portfolio-neutral)',
          'bg-positive': 'var(--color-portfolio-bg-positive)',
          'bg-negative': 'var(--color-portfolio-bg-negative)',
        },
        
        // Status Colors
        status: {
          online: 'var(--color-status-online)',
          offline: 'var(--color-status-offline)',
          pending: 'var(--color-status-pending)',
          processing: 'var(--color-status-processing)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'value-change': 'valueChange 0.5s ease-in-out',
        'price-flash': 'priceFlash 0.3s ease-in-out',
        'layout-transition': 'layoutTransition 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth-expand': 'smoothExpand 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth-collapse': 'smoothCollapse 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'tab-slide-in': 'tabSlideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'tab-slide-out': 'tabSlideOut 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        valueChange: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        priceFlash: {
          '0%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        layoutTransition: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        smoothExpand: {
          '0%': { maxHeight: '0', opacity: '0', transform: 'scaleY(0)' },
          '100%': { maxHeight: '2000px', opacity: '1', transform: 'scaleY(1)' },
        },
        smoothCollapse: {
          '0%': { maxHeight: '2000px', opacity: '1', transform: 'scaleY(1)' },
          '100%': { maxHeight: '0', opacity: '0', transform: 'scaleY(0)' },
        },
        tabSlideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        tabSlideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-20px)', opacity: '0' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      transitionTimingFunction: {
        'professional': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      scale: {
        '102': '1.02',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Display sizes (Portfolio values, major headlines)
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.05em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.05em', fontWeight: '600' }],
        'display-lg': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '500' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '500' }],
        
        // Heading sizes
        'heading-xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading-lg': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.025em', fontWeight: '500' }],
        'heading-md': ['1.125rem', { lineHeight: '1.4', letterSpacing: '0em', fontWeight: '500' }],
        'heading-sm': ['1rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '500' }],
        'heading-xs': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em', fontWeight: '500' }],
        
        // Body text sizes
        'body-xl': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body-lg': ['1rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.025em', fontWeight: '400' }],
        'body-xs': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '400' }],
        
        // Trading specific sizes
        'price-primary': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'price-secondary': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'price-table': ['1rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }],
        'price-small': ['0.875rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '500' }],
        'percentage': ['0.875rem', { lineHeight: '1.1', letterSpacing: '0.01em', fontWeight: '500' }],
        'volume': ['0.75rem', { lineHeight: '1.1', letterSpacing: '0.025em', fontWeight: '400' }],
        'timestamp': ['0.6875rem', { lineHeight: '1.1', letterSpacing: '0.05em', fontWeight: '400' }],
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        'price': '-0.01em',
        'percentage': '0.01em',
        'symbol': '0.05em',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      }
      addUtilities(newUtilities)
    }
  ],
}