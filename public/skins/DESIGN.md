---
name: Meu Vidraceiro
description: Software de gestão para vidraçarias e serralherias
colors:
  primary: "#1f54a1"
  financials: "#0d7b62"
  materials: "#2d578e"
  quotes: "#259853"
  snow-gray: "#f5f5f5"
  charcoal-gray: "#545454"
typography:
  display:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "clamp(1.8rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "8px"
spacing:
  sm: "8px"
  md: "15px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "#2e9ad6"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "15px"
---

# Design System: Meu Vidraceiro

## 1. Overview

**Creative North Star: "Steel & Glass Blueprint"**

The design system for Meu Vidraceiro is built on architectural precision, clean lines, and high-density layouts. It mirrors the structural discipline of the glazing and locksmith industries: everything is sharp, well-ordered, and visible. The interface focuses on high readability, low cognitive load, and immediate utility for busy tradespeople.

This system rejects low-density designs, startup flamboyance, nested cards, and low-contrast typography. Spacing is tight and deliberate, maximizing screen utilization for office and production workflows.

**Key Characteristics:**
- Sharp corners (0px radius) for cards, buttons, and inputs.
- High-contrast, dense information layouts to prevent unnecessary scrolling.
- Clear module color-coding to group financial, material, and quote components.
- Zero non-functional animations to maintain immediate operational speed.

## 2. Colors

High-contrast primary blues with module-specific accent greens and teals.

### Primary
- **Deep Trust Blue** (#1f54a1): Used for the main sidebar, header highlights, and primary actions. It represents the structural backbone of the product.

### Secondary
- **Invoicing Teal** (#0d7b62): Dedicated to the Financial Module (`financeiro2`). Indicates revenues, payments, and invoices.
- **Steel Blue** (#2d578e): Dedicated to the Materials Module (`materiais`). Represents structural hardware and components.
- **Safety Green** (#259853): Dedicated to the Quotes Module (`orcamento`). Indicates approved proposals, budgets, and gains.

### Neutral
- **Page Background** (#fafafa): Flat background color for main content canvases.
- **Snow Gray** (#f5f5f5): Container backgrounds and subtle section headers.
- **Charcoal Gray** (#545454): Default text ink, providing contrast against light backgrounds.

### Named Rules
**The High-Contrast Rule.** Text element contrast must maintain a minimum 4.5:1 ratio against its background to ensure legibility under direct sunlight.
**The Module Coding Rule.** Use designated module colors (Teal for Finance, Green for Quotes) only for contextual accenting and badges, never as full-screen backgrounds.

## 3. Typography

**Display Font:** Montserrat (sans-serif)
**Body Font:** Montserrat (sans-serif)
**Label/Mono Font:** Open Sans (sans-serif)

**Character:** Bold, solid Montserrat for prominent headings combined with highly legible Open Sans for functional labels and table headers.

### Hierarchy
- **Display** (bold, clamp(1.8rem, 4vw, 3rem), 1.2): Used for page titles, main dashboard summaries, and hero values.
- **Headline** (bold, 1.4rem, 1.3): Used for card headings and section titles.
- **Title** (semi-bold, 1.1rem, 1.3): Used for subsection headers and table headers.
- **Body** (regular, 14px, 1.5): Used for main page copy, descriptions, and data lists. Max line length is 70ch.
- **Label** (semi-bold, 12px, 1.2): Used for badges, form fields, and tooltips.

### Named Rules
**The No-Orphan Headline Rule.** Display and headline components must use `text-wrap: balance` to prevent awkward word wrapping.

## 4. Elevation

The system is flat by default, relying on solid borders and background colors rather than soft depth to group contents. Shadows are used sparingly to elevate primary containers.

### Shadow Vocabulary
- **Structural Card Shadow** (`box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1)`): Used on cards at rest to lift them off the #fafafa page background.

### Named Rules
**The Flat-At-Rest Rule.** All buttons, inputs, and dropdowns remain flat at rest. Depth is indicated through color fills and sharp outlines rather than shadows.

## 5. Components

### Buttons
- **Shape:** Sharp corners (0px radius).
- **Primary:** Background `#1f54a1`, white text, padding `8px 16px`. Class name: `.btn-dark-blue`.
- **Hover / Focus:** Transition to `#1f54a1dd` over `0.2s`.
- **Secondary:** Background `#2e9ad6`, white text, hover background `#2e9ad6dd`. Class name: `.btn-sky-blue`.

### Cards / Containers
- **Corner Style:** Sharp corners (0px radius).
- **Background:** White (#ffffff).
- **Shadow Strategy:** Structural Card Shadow (`0 3px 5px rgba(0, 0, 0, 0.1)`).
- **Internal Padding:** `15px`.
- **Hover:** Interactive cards transition to `#e8e8e8` background to signal clickability.

### Inputs / Fields
- **Style:** 1px gray border, sharp corners, white background.
- **Focus:** Highlight border using primary Deep Trust Blue (`#1f54a1`).

### Navigation
- **Sidebar Style:** Deep Trust Blue (`#1f54a1`) background, Open Sans font, white text.
- **States:** Active links use white background with sky blue (`#2e9ad6`) text. Hover state matches the active link style.

## 6. Do's and Don'ts

### Do:
- **Do** design cards, inputs, and buttons with sharp corners (0px border-radius).
- **Do** ensure all text hits a contrast ratio of at least 4.5:1 for sunlight visibility.
- **Do** maintain high information density to minimize scrolling for office staff.
- **Do** use designated module colors (Teal, Green, Blue) to organize multi-module workflows.

### Don't:
- **Don't** use flashy startup-style interfaces, excessive animations, or hidden actions.
- **Don't** construct low-density layouts that waste screen space.
- **Don't** use low-contrast text or thin, light-gray fonts.
- **Don't** design workflows that require too many clicks or hide critical controls in deeply nested menus.
