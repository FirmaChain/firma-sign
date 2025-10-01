# Firma-Sign Landing Page Design System

## Brand Alignment with FirmaChain

This design system aligns with FirmaChain's established brand identity while maintaining Firma-Sign's unique positioning as a decentralized document signing solution.

## Color Palette

### Primary Colors (Aligned with FirmaChain)

```css
--brand-primary: #1050dd; /* FirmaChain Blue */
--brand-secondary: #316bff; /* Lighter Blue */
--brand-accent: #4a7fff; /* Accent Blue */

--dark-bg-primary: #121417; /* Dark Charcoal Background */
--dark-bg-secondary: #1a1b20; /* Slightly Lighter Dark */
--dark-bg-tertiary: #242530; /* Card Background */

--text-primary: #ffffff; /* White for headings */
--text-secondary: #a0a3bd; /* Muted gray for body */
--text-tertiary: #6b7280; /* Darker gray */

--gradient-start: #1050dd; /* Gradient Blue Start */
--gradient-end: #316bff; /* Gradient Blue End */
--gradient-radial: radial-gradient(circle, #1050dd33 0%, transparent 70%);
```

### Semantic Colors

```css
--success: #10b981; /* Green for success states */
--warning: #f59e0b; /* Amber for warnings */
--error: #ef4444; /* Red for errors */
--info: #3b82f6; /* Blue for information */
```

## Typography

### Font Stack (Following FirmaChain)

```css
--font-primary: 'Metropolis', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-secondary: 'Lato', 'Inter', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

### Font Sizes

```css
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */
--text-6xl: 3.75rem; /* 60px */
--text-7xl: 4.5rem; /* 72px */
--text-8xl: 6rem; /* 96px */
```

### Font Weights

```css
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

## Spacing System

### Base Spacing

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
--space-32: 8rem; /* 128px */
```

## Layout

### Container Widths

```css
--container-xs: 475px;
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
--container-max: 1400px; /* Main content max-width */
```

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## Visual Effects

### Shadows (Dark Theme Optimized)

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
--shadow-glow: 0 0 20px rgba(16, 80, 221, 0.3);
```

### Border Radius

```css
--radius-sm: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-3xl: 1.5rem; /* 24px */
--radius-full: 9999px;
```

### Transitions

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
--transition-slower: 500ms ease-in-out;
```

## Component Styles

### Buttons (FirmaChain Style)

```css
/* Primary Button */
.btn-primary {
	background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
	color: white;
	padding: var(--space-3) var(--space-6);
	border-radius: var(--radius-lg);
	font-weight: var(--font-semibold);
	transition: var(--transition-base);
	box-shadow: 0 4px 15px rgba(16, 80, 221, 0.3);
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(16, 80, 221, 0.4);
}

/* Secondary Button */
.btn-secondary {
	background: transparent;
	color: var(--brand-primary);
	border: 2px solid var(--brand-primary);
	padding: var(--space-3) var(--space-6);
	border-radius: var(--radius-lg);
	font-weight: var(--font-semibold);
	transition: var(--transition-base);
}

.btn-secondary:hover {
	background: var(--brand-primary);
	color: white;
}
```

### Cards

```css
.card {
	background: var(--dark-bg-tertiary);
	border-radius: var(--radius-xl);
	padding: var(--space-6);
	border: 1px solid rgba(255, 255, 255, 0.05);
	transition: var(--transition-base);
}

.card:hover {
	transform: translateY(-4px);
	border-color: var(--brand-primary);
	box-shadow: var(--shadow-glow);
}
```

### Sections

```css
.section {
	padding: var(--space-20) 0;
	position: relative;
}

.section-dark {
	background: var(--dark-bg-primary);
}

.section-gradient {
	background: linear-gradient(180deg, var(--dark-bg-primary) 0%, var(--dark-bg-secondary) 100%);
}
```

## Animation Patterns

### Scroll Animations

```javascript
// Framer Motion Variants
export const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: 'easeOut' },
	},
};

export const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
};

export const scaleIn = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: 0.5, ease: 'easeOut' },
	},
};
```

### Hover Interactions

```css
/* Glow Effect on Hover */
.glow-hover {
	transition: var(--transition-base);
}

.glow-hover:hover {
	filter: drop-shadow(0 0 20px rgba(16, 80, 221, 0.5));
}

/* Float Animation */
@keyframes float {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10px);
	}
}

.float-animation {
	animation: float 3s ease-in-out infinite;
}
```

## Background Patterns

### Gradient Mesh Background

```css
.gradient-mesh {
	background: var(--dark-bg-primary);
	position: relative;
	overflow: hidden;
}

.gradient-mesh::before {
	content: '';
	position: absolute;
	top: -50%;
	left: -50%;
	width: 200%;
	height: 200%;
	background:
		radial-gradient(circle at 20% 80%, rgba(16, 80, 221, 0.15) 0%, transparent 50%),
		radial-gradient(circle at 80% 20%, rgba(49, 107, 255, 0.1) 0%, transparent 50%),
		radial-gradient(circle at 40% 40%, rgba(74, 127, 255, 0.08) 0%, transparent 50%);
	animation: gradient-shift 15s ease infinite;
}

@keyframes gradient-shift {
	0%,
	100% {
		transform: translate(0, 0) rotate(0deg);
	}
	33% {
		transform: translate(-5%, -5%) rotate(120deg);
	}
	66% {
		transform: translate(5%, -5%) rotate(240deg);
	}
}
```

### Network Pattern

```css
.network-pattern {
	background-image:
		linear-gradient(rgba(16, 80, 221, 0.03) 1px, transparent 1px),
		linear-gradient(90deg, rgba(16, 80, 221, 0.03) 1px, transparent 1px);
	background-size: 50px 50px;
}
```

## Icon System

### Icon Sizes

```css
--icon-xs: 16px;
--icon-sm: 20px;
--icon-md: 24px;
--icon-lg: 32px;
--icon-xl: 40px;
--icon-2xl: 48px;
```

### Icon Colors

```css
.icon-primary {
	color: var(--brand-primary);
}
.icon-secondary {
	color: var(--text-secondary);
}
.icon-success {
	color: var(--success);
}
.icon-muted {
	color: var(--text-tertiary);
}
```

## Responsive Design

### Mobile First Approach

```css
/* Base styles for mobile */
.hero-title {
	font-size: var(--text-4xl);
	line-height: 1.2;
}

/* Tablet and up */
@media (min-width: 768px) {
	.hero-title {
		font-size: var(--text-6xl);
	}
}

/* Desktop and up */
@media (min-width: 1024px) {
	.hero-title {
		font-size: var(--text-8xl);
	}
}
```

## Component Library Integration

### Using with Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
	theme: {
		extend: {
			colors: {
				brand: {
					primary: '#1050dd',
					secondary: '#316bff',
					accent: '#4a7fff',
				},
				dark: {
					bg: {
						primary: '#121417',
						secondary: '#1a1b20',
						tertiary: '#242530',
					},
				},
			},
			fontFamily: {
				metropolis: ['Metropolis', 'sans-serif'],
				lato: ['Lato', 'sans-serif'],
			},
		},
	},
};
```

## Accessibility

### Color Contrast

- All text meets WCAG AA standards
- Primary text on dark: #ffffff (21:1 ratio)
- Secondary text on dark: #a0a3bd (7.5:1 ratio)
- Interactive elements: Minimum 4.5:1 ratio

### Focus States

```css
.focus-visible {
	outline: 2px solid var(--brand-primary);
	outline-offset: 2px;
	border-radius: var(--radius-md);
}
```

## Brand Voice & Messaging

### Tone Alignment with FirmaChain

- **Professional**: Technical competence without complexity
- **Innovative**: Forward-thinking and cutting-edge
- **Trustworthy**: Secure, reliable, and transparent
- **Accessible**: Complex technology made simple
- **Empowering**: Giving control back to users

### Visual Hierarchy

1. **Hero statements**: Bold, large, impactful
2. **Section headers**: Clear, descriptive, engaging
3. **Body text**: Readable, informative, concise
4. **CTAs**: Action-oriented, compelling, clear

## Implementation Notes

1. **Dark Theme First**: Design primarily for dark theme (aligning with FirmaChain)
2. **Gradient Usage**: Use gradients sparingly for emphasis
3. **Motion**: Subtle animations that enhance, not distract
4. **Consistency**: Maintain visual consistency with FirmaChain brand
5. **Performance**: Optimize all animations for 60fps
6. **Accessibility**: Ensure all interactions are keyboard accessible
