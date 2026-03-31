# Design System Document: Atmospheric Utility

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Midnight Archivist."** 

This system transcends the utility of a standard note-taking app, moving into the realm of a premium digital sanctuary. It rejects the "flatness" of modern utility apps in favor of **Atmospheric Depth**. By leveraging a deep, nocturnal palette and editorial typography, we create an environment that feels private, authoritative, and sophisticated. 

The design breaks the standard "template" look through **Tonal Layering** and **Intentional Asymmetry**. We move away from rigid grid lines and embrace a layout that feels like a curated collection of thoughts rather than a database. The visual hierarchy is driven by contrast—the warmth of gold against the infinite depth of navy.

---

## 2. Colors
Our palette is rooted in a high-contrast relationship between deep midnight foundations and luminous accents.

*   **Primary Foundation:** The `background` (`#0d1030`) and `surface` tokens provide a "bottomless" feel. 
*   **The Gold Accent:** The `primary` token (`#e9c349`) is our "Light." It is used sparingly for critical actions and brand moments to mimic the look of gold foil on a leather-bound book.
*   **Neutral Roles:** `secondary` (`#c6c6c7`) and `on_surface_variant` (`#c7c5d1`) handle the heavy lifting of secondary information, providing a soft "glow" rather than harsh white text.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a note list item sitting on `surface` should be defined by its container being `surface_container_low`. We define space through mass, not lines.

### Surface Hierarchy & Nesting
Use the `surface_container` tiers to create depth. To create a "nested" effect:
1.  **Level 0 (Base):** `surface`
2.  **Level 1 (Sections/Groups):** `surface_container_low`
3.  **Level 2 (Active Cards):** `surface_container_high`
This stacking creates a physical sense of hierarchy where the most important content "floats" closer to the user.

### The "Glass & Gradient" Rule
Floating elements (like a navigation bar or a floating action button) should utilize the `surface_bright` token with a `backdrop-blur` of 20px and 70% opacity. For primary CTAs, use a subtle linear gradient from `primary` (`#e9c349`) to `on_primary_container` (`#957700`) at a 135-degree angle to provide a metallic, premium "soul."

---

## 3. Typography
The typography system uses a dual-font approach to balance editorial personality with professional utility.

*   **Display & Headlines (Manrope):** We use Manrope for `display-lg` through `headline-sm`. Its geometric yet warm character provides an authoritative, "high-end magazine" feel. 
*   **Body & Labels (Inter):** We use Inter for all functional text (`body` and `label` scales). It offers maximum legibility at small sizes, ensuring that long-form notes remain highly readable.

**The Hierarchy Strategy:**
We utilize extreme scale contrast. A `display-md` title for a folder should be paired with a `label-md` metadata tag to create an intentional "editorial" gap, making the layout feel designed rather than just populated.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Rather than using a shadow to lift a card, place a `surface_container_lowest` card inside a `surface_container_highest` wrapper. This "recessed" look feels more custom and architectural.
*   **Ambient Shadows:** If a floating element (like a modal) requires a shadow, it must be an "Ambient Shadow." Use the `on_surface` color at 6% opacity with a blur of 32px and a Y-offset of 16px. Never use pure black for shadows.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline_variant` token at 15% opacity. It should be felt, not seen.
*   **Glassmorphism:** Use `surface_container_low` with a 0.8 alpha and a 16px blur for overlays. This allows the navy background to bleed through, maintaining the "Midnight" atmosphere even when menus are open.

---

## 5. Components

### Buttons
*   **Primary:** A rounded-full container using the Gold Gradient (`primary` to `on_primary_container`). Text is `on_primary` (Bold).
*   **Secondary:** `surface_container_highest` background with `primary` (Gold) text. No border.
*   **Tertiary:** Transparent background with `secondary` text and a `primary` underline (2px) only on hover/active states.

### Cards & Lists
*   **Note Cards:** Use `surface_container_low`. Set `rounded-lg` (1rem). 
*   **Forbid Dividers:** Do not use lines between list items. Use a `1rem` vertical gap (Spacing 4) or alternate between `surface_container_low` and `surface_container_lowest`.
*   **Folders:** Use `headline-sm` for titles. Use `primary_fixed_dim` for folder icons to keep the "Midnight Archivist" aesthetic consistent.

### Input Fields
*   **Text Fields:** A simple `surface_container_high` background with a `rounded-md` (0.75rem) corner. The label should use `label-md` in `primary` color, sitting above the field (not floating inside) to mimic professional forms.

### Chips
*   **Action Chips:** Use `surface_bright` with `on_surface` text. Rounded-full. Use these for tags like "Urgent" or "Work."

### Additional Component: The "Archivist Toolbar"
A specialized bottom-bar component for the note editor. Use a `surface_container_highest` background with a `backdrop-blur`. Icons should be `primary` (Gold) when active and `outline` when inactive.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. For example, give a header a larger left-side padding (`spacing-8`) than the right-side padding (`spacing-6`) to create an editorial look.
*   **Do** use `primary` (Gold) as a highlight for specific words or numbers within a note to guide the eye.
*   **Do** embrace negative space. If a screen feels crowded, increase the spacing between containers using the `spacing-10` or `spacing-12` tokens.

### Don't:
*   **Don't** use 100% white (#FFFFFF) for body text. Use `on_surface_variant` to reduce eye strain against the navy background.
*   **Don't** use standard iOS "Chevron-Right" icons on every list item. Trust the layout to imply navigability.
*   **Don't** use `rounded-none` or `rounded-sm`. This system requires the softness of `rounded-md` (12px) and `rounded-lg` (16px) to feel premium and approachable.