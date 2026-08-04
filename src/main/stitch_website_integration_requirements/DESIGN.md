---
name: Obsidian Command
colors:
  surface: '#18101f'
  surface-dim: '#18101f'
  surface-bright: '#403547'
  surface-container-lowest: '#130b1a'
  surface-container-low: '#211828'
  surface-container: '#251c2c'
  surface-container-high: '#302637'
  surface-container-highest: '#3b3142'
  on-surface: '#edddf4'
  on-surface-variant: '#cfc2d6'
  inverse-surface: '#edddf4'
  inverse-on-surface: '#362d3e'
  outline: '#988d9f'
  outline-variant: '#4d4354'
  surface-tint: '#ddb7ff'
  primary: '#ddb7ff'
  on-primary: '#490080'
  primary-container: '#b76dff'
  on-primary-container: '#400071'
  inverse-primary: '#842bd2'
  secondary: '#deb7ff'
  on-secondary: '#45166e'
  secondary-container: '#603389'
  on-secondary-container: '#d4a5ff'
  tertiary: '#d2bfe8'
  on-tertiary: '#382a4a'
  tertiary-container: '#9b8ab0'
  on-tertiary-container: '#312343'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f0dbff'
  primary-fixed-dim: '#ddb7ff'
  on-primary-fixed: '#2c0051'
  on-primary-fixed-variant: '#6900b3'
  secondary-fixed: '#f1dbff'
  secondary-fixed-dim: '#deb7ff'
  on-secondary-fixed: '#2d0050'
  on-secondary-fixed-variant: '#5d3186'
  tertiary-fixed: '#eddcff'
  tertiary-fixed-dim: '#d2bfe8'
  on-tertiary-fixed: '#221534'
  on-tertiary-fixed-variant: '#4f4062'
  background: '#18101f'
  on-background: '#edddf4'
  surface-variant: '#3b3142'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for deep focus and high-stakes technical environments. It adopts a "Command Center" aesthetic, evoking the precision of modern developer tools and aerospace interfaces. The personality is authoritative, technical, and hyper-efficient.

The style is a fusion of **Minimalism** and **Glassmorphism**, specifically tailored for dark-mode environments. It utilizes deep obsidian layers, sharp geometric precision, and high-energy violet accents to guide the eye through complex data hierarchies. The emotional response is one of total control and cognitive clarity during prolonged technical sessions.

## Colors

This design system utilizes a monochromatic purple spectrum optimized for low-light legibility and high visual impact. 

- **Primary (Electric Violet):** Used for critical actions, active states, and focus indicators.
- **Surface (Obsidian):** The base layer is a near-black purple, reducing eye strain and providing maximum contrast for text.
- **Accents:** High-vibrancy purples replace traditional amber or orange to signify warnings or highlights, maintaining a cohesive futuristic palette.
- **Neutral:** Used for structural lines and secondary text, providing a calm backdrop to the vibrant primary elements.

## Typography

Typography is a critical component of the engineering feel. **Sora** provides a geometric, tech-forward voice for headlines, while **Outfit** offers a clean, highly legible experience for long-form reading and interface labels.

- Use **Sora** for all major headings to emphasize the geometric structure of the system.
- Use **Outfit** for body text and interactive elements.
- **Label styles** should be uppercase with slight letter spacing to mimic instrumentation panels.
- For technical data or code snippets, integrate a monospaced font like JetBrains Mono to reinforce the developer-centric intent.

## Layout & Spacing

The layout follows a rigorous 4px grid system, ensuring every element is mathematically aligned. 

- **Grid Model:** A 12-column fluid grid is used for desktop, transitioning to a 4-column grid for mobile.
- **Rhythm:** Spacing between logical blocks should be in increments of 8px (e.g., 16, 24, 32, 64). 
- **Density:** The system favors a "High Density" approach for data-rich views, reducing vertical padding to keep more information above the fold, while using generous outer margins to provide visual breathing room.

## Elevation & Depth

Depth is established through **Tonal Layering** and **Subtle Glows** rather than traditional shadows.

- **Tier 1 (Base):** Obsidian-purple background (#09040D).
- **Tier 2 (Surface):** Raised cards use a slightly lighter purple tint (#160B22) with a 1px inner border of low-opacity violet to define the edge.
- **Tier 3 (Overlay):** Modals and dropdowns utilize a backdrop-blur (12px) with a semi-transparent purple fill to create a glass effect.
- **Illumination:** Active elements (like the focused input) should emit a subtle, diffused violet outer glow (bloom effect) to simulate a powered-on console.

## Shapes

The shape language is "Soft-Geometric." While the system values precision, slight rounding prevents the UI from feeling hostile or overly "retro-brutalist."

- **Standard Elements:** Buttons and inputs use a 4px (`0.25rem`) radius to maintain a crisp, engineered look.
- **Containers:** Larger cards and panels use an 8px (`0.5rem`) radius.
- **Active Indicators:** Vertical bars used for active navigation items should have fully rounded (pill) ends to contrast against the sharp grid.

## Components

- **Buttons:** Primary buttons use a solid Electric Violet fill with white or high-contrast purple text. Ghost buttons use a 1px violet border. All buttons exhibit a subtle glow on hover.
- **Input Fields:** Backgrounds are darker than the surface layer. Focus states are indicated by a 1px Electric Violet border and a 2px outer glow.
- **Lists:** Items are separated by low-contrast purple dividers (20% opacity). Hover states use a subtle 5% violet tint background change.
- **Chips/Tags:** Small, pill-shaped elements with low-opacity violet backgrounds and high-vibrancy text, used for status indicators and categories.
- **Status Indicators:** In place of green/red/amber, use varying shades of violet and cyan for "System Normal" and "Alert," maintaining the high-contrast purple aesthetic.
- **Data Visualizations:** Charts should exclusively use the violet color scale, utilizing opacity and line-weight to differentiate data sets.