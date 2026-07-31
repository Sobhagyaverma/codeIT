---
name: Cyber-Purple Directive
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d1c2d2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9a8c9b'
  outline-variant: '#4e4350'
  surface-tint: '#edb1ff'
  primary: '#edb1ff'
  on-primary: '#520070'
  primary-container: '#9d50bb'
  on-primary-container: '#fff3fd'
  inverse-primary: '#883ca6'
  secondary: '#ddfcff'
  on-secondary: '#00363a'
  secondary-container: '#00f1fe'
  on-secondary-container: '#006a70'
  tertiary: '#ffb1c3'
  on-tertiary: '#66002c'
  tertiary-container: '#de0069'
  on-tertiary-container: '#fff5f5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f9d8ff'
  primary-fixed-dim: '#edb1ff'
  on-primary-fixed: '#320046'
  on-primary-fixed-variant: '#6e208c'
  secondary-fixed: '#74f5ff'
  secondary-fixed-dim: '#00dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#ffd9e0'
  tertiary-fixed-dim: '#ffb1c3'
  on-tertiary-fixed: '#3f0019'
  on-tertiary-fixed-variant: '#8f0041'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style
The design system targets high-performance competitive programmers and collaborative engineering teams. It evokes an atmosphere of precision, speed, and technical mastery. The aesthetic is a fusion of **Glassmorphism** and **Modern Corporate Futurism**, utilizing deep obsidian surfaces layered with translucent glass panels to create a sense of infinite digital depth.

The UI should feel like a high-end IDE or a command-center interface. Visual cues emphasize focus and low cognitive load while maintaining an energetic, "hacker-spirit" vibe through vibrant neon accents and subtle luminescence. Every interaction should feel instantaneous and responsive, reinforcing the platform's focus on high-performance execution.

## Colors
The palette is built on a "Void and Neon" philosophy. The base is a strictly dark environment to reduce eye strain during long coding sessions.

- **Primary:** Electric Purple (#9D50BB) is used for primary actions, branding elements, and active states.
- **Secondary (Success/Action):** Neon Cyan (#00F2FF) highlights successful test passes, "Go" actions, and collaborative presence indicators.
- **Tertiary (Impact):** Hot Pink (#FF007A) is reserved for high-stakes alerts, errors, or competitive "hot streaks."
- **Neutrals:** Obsidian Black (#0D0D0D) serves as the base layer, with Dark Charcoal (#1A1A1A) used for elevated surfaces and containers.

## Typography
The typography system prioritizes legibility and technical rigor. 

- **Display & Headlines:** Use **Geist** for a sharp, modern, and developer-centric look. It provides a geometric foundation that feels engineered.
- **Interface & Body:** **Inter** handles all UI labels and long-form descriptions, ensuring maximum readability at small sizes.
- **Technical & Code:** **JetBrains Mono** is mandatory for all code blocks, editor views, and data-heavy labels. Its increased x-height and clear character distinction are vital for competitive programming.

## Layout & Spacing
The design system utilizes a **Fluid Grid** model based on a 4px baseline shift to maintain strict mathematical alignment.

- **Desktop:** 12-column grid with 24px gutters. Use wide margins (40px) to give the code editor and terminal views breathing room.
- **Mobile:** 4-column grid with 16px margins. Content should stack vertically, prioritizing the code editor view with a collapsible sidebar for navigation.
- **Philosophy:** Layouts should be "Information Dense." Avoid excessive whitespace in functional areas (like the IDE) while using generous padding for marketing and landing pages to emphasize the premium aesthetic.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than traditional drop shadows.

- **Base Layer:** #0D0D0D (Obsidian).
- **Surface Layer:** #1A1A1A with a 1px solid border (#FFFFFF10) to define edges.
- **Glass Panels:** Background blur (12px - 20px) with 60% opacity fill. These panels are used for modals, floating tooltips, and sidebars.
- **Glow Effects:** Critical components (active buttons, primary tabs) utilize a soft outer glow (0px 0px 15px) using the Primary Purple or Secondary Cyan at 30% opacity to simulate light emission.

## Shapes
The shape language is "Geometric-Technical." 

Edges are primarily sharp or subtly rounded to maintain a serious, high-performance feel. Use **8px (0.5rem)** as the standard radius for buttons, input fields, and small cards. Larger containers or sections use **16px (1rem)**. Avoid fully circular/pill shapes except for status indicators (e.g., online/offline dots).

## Components

- **Buttons:** 
  - *Primary:* Gradient fill (#9D50BB to #6E48AA), white text, subtle purple glow on hover.
  - *Secondary:* Transparent background with a 1px Cyan border. Text is Cyan.
- **Input Fields:** Dark background (#0D0D0D), 1px border (#FFFFFF20). On focus, the border glows Cyan and the background shifts slightly lighter. Use Monospace font for inputs involving code or variables.
- **Cards:** Use the "Glass Panel" style. A dark semi-transparent fill with a subtle 1px top-highlight border to simulate light hitting the edge.
- **Chips/Badges:** Small, rectangular with 4px radius. Use Monospace text. High-contrast backgrounds (Purple for levels, Cyan for tags).
- **Code Editor:** The core component. Dark theme by default. Syntax highlighting must use the system's palette: Cyan for functions, Purple for keywords, Pink for errors.
- **Lists:** Clean rows separated by 1px dimmed borders. Hover state should trigger a subtle horizontal "slide-in" highlight from the left in Primary Purple.