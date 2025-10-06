got it — thanks for the clarification. Here’s a focused spec for the **Text Slot floating toolbar** (same visual language as your shape toolbar) and how it hands off to the **left-side “Effects / Position” panels**. This is tuned to the screenshot you shared (light theme, compact, chip-style buttons).

# 1) Principles

* **Mirror the shape toolbar shell.** Same height, paddings, rounded corners, separators, hover/focus states.
* **Only text-essentials inline.** Deep controls live in popovers (spacing/color) or the left panel (Effects/Position).
* **Single row, scroll-safe.** Uses overflow → “⋯” more menu on narrow screens.
* **Command merge during drags** (sliders, scrubs) so history doesn’t spam.
* **Multi-select aware.** If multiple text slots are selected: show “Mixed” states; applying a value updates all.

---

# 2) Floating Toolbar (Text) — exact layout & behavior

## Layout (left → right)

**[A] Family** | **[B] Size** | **[C] Color** | **[D] B I U S** | **[E] Case** | **[F] Align** | **[G] Spacing** | **[H] Anchor Box** | **[I] Transparency** | **[J] Effects** | **[K] Position** | **[L] AUTOFIT**

### [A] Font Family (combobox)

* Width ~180px (ellipsis overflow). Shows current family with sample “Ag”.
* Typing filters list; each option shows family name in its own font.
* Right side: small weight dropdown when available (e.g., **Regular ▾** toggles 400/500/600/700; disabled weights appear but are unclickable).
* Data written: `fontFamily`, `fontWeight`, `fontStyle`.
* On family change, preload default weights (400/600/700) via your Google Fonts loader.

### [B] Font Size (scrubbable number input with steppers)

* `-` `[ 64 ]` `+` (exactly as in your screenshot).
* Scrub by dragging on the number; ArrowUp/Down = ±1, Shift = ±10.
* Unit: canvas px (user space). Write to `fontSize`.

### [C] Font Color (swatch button → popover)

* Shows current color square. Click opens popover: color picker + alpha (same control used elsewhere).
* Data: `textColor`. Alpha goes to `opacity` if you want unified transparency, or keep separate (see [I]).

### [D] Style toggles

* **B** → `fontWeight=bold`
* **I** → `fontStyle=italic`
* **U** → underline (text decoration)
* **S** → strikethrough
* Mixed state: half-filled icon.

### [E] Case (Aa button with menu)

* One icon; click opens small menu:

  * None, UPPERCASE, Title Case, Sentence case
* Data: `textTransform: 'none'|'uppercase'|'title'|'sentence'`.
* Tip: apply transform visually but keep source text intact; transform at render.

### [F] Align (3 icons)

* Left / Center / Right. Writes `textAlign`.

### [G] Spacing (Aa with two chevrons icon → popover)

* Popover with two rows:

  * **Letter Spacing**: slider + number input (−2.0 … 10.0; step 0.1; unit px in user space).
  * **Line Spacing**: slider + number input (0.6 … 3.0; step 0.05; unitless multiplier).
* Writes `letterSpacing`, `lineHeight`.
* Footer has “Reset” (revert to defaults).

### [H] Anchor Text Box (chip with icon)

* Toggle group (2 states):

  * **Auto** (text grows with content; your current default)
  * **Fixed** (bounded frame: enables wrapping; shows tiny wrap icon on the chip)
* When Fixed:

  * show secondary mini-toggle in the chip menu for **Autofit text** (scale text to fit box).
* Writes `anchorBox: 'auto'|'fixed'`, and `autoFit: boolean`.

### [I] Transparency (drop icon + number)

* Inline slider OR small input (0–100%). Writes `opacity = value/100`.
* Keep distinct from color alpha if you want (global element opacity is more intuitive here).

### [J] Effects (button)

* Opens **left side panel** to the *Text Effects* section (see §3).
* The button shows a tiny dot when any effect is active (shadow/outline/etc.).

### [K] Position (button)

* Opens **left side panel** to *Position* section (same panel framework).

### [L] AUTOFIT (status badge)

* When `anchorBox='fixed'` and `autoFit=true`, show **AUTOFIT ON** badge; clicking toggles.
* When `autoFit=false`, show **AUTOFIT OFF** (as in your screenshot).

#### Micro-interactions

* Tooltips on hover with shortcuts: e.g., **B – Bold (⌘/Ctrl+B)**.
* “Mixed” value behavior:

  * Family/size shows *Mixed* until user picks a value.
  * Color swatch shows split diagonal when mixed.

---

# 3) Left Side Panel (only opens from toolbar)

Same panel used by shapes; just switch the content.

## A) Effects Panel (Text)

* **Presets grid** at top (None, Shadow, Lift, Hollow, Splice, Outline, Echo, Glitch, Neon, Background, Highlight).
* Clicking a preset simply sets a **property bundle** (no mode switch).
* **Fine Controls** sections below (collapsibles):

  * Text Stroke: width, color, paint-order (stroke above/below)
  * Text Shadow: color, offset X/Y, blur, transparency
  * Background/Highlight: fill, opacity, padding X/Y
  * Neon: stroke size, glow radius, color
  * Echo: count, offset, blur, color
  * Glitch: slices, amplitude, dual-color toggle
  * Curve: radius (0 = none); shows live arc helper
  * Image Mask: pick image, scale, offset
* Reset per section. Active sections show a blue dot in the header.

## B) Position Panel

* **Align to Page**: Left, Center, Right, Top, Middle, Bottom
* **Z-order**: To Front, Forward, Backward, To Back
* **Advanced (numeric)**: X, Y, W, H, lock ratio, Rotate°
* **Distribute** (optional): Horizontal / Vertical (if multiple selected)

The **left rail stays hidden** until the user clicks **Effects** or **Position** from the floating toolbar; closing the panel returns focus to the toolbar.

---

# 4) Component breakdown (plug into your existing shell)

```
<TextToolbar>
  <FontFamilySelect />        // [A]
  <FontSizeInput />           // [B]
  <ColorSwatchPopover />      // [C]
  <StyleToggles />            // [D]
  <CaseMenu />                // [E]
  <AlignGroup />              // [F]
  <SpacingPopover />          // [G]
  <AnchorBoxToggle />         // [H]
  <OpacityInput />            // [I]
  <ButtonEffects />           // [J]
  <ButtonPosition />          // [K]
  <AutofitBadge />            // [L]
</TextToolbar>
```

**Shared behaviors**

* Every control calls `setPropertyBatch(selectionIds, patch, { merge:true, source:'toolbar' })`.
* During drags/scrubs, throttle to 60–90ms; commit a single history entry on mouseup.

---

# 5) Data contract (what each control writes)

* `fontFamily: string`
* `fontWeight: number|'normal'|'bold'`
* `fontStyle: 'normal'|'italic'`
* `fontSize: number`
* `textColor: string` (hex)
* `textDecoration: { underline?:boolean; strike?:boolean }`
* `textTransform: 'none'|'uppercase'|'title'|'sentence'`
* `letterSpacing: number` (px)
* `lineHeight: number` (unitless)
* `textAlign: 'left'|'center'|'right'`
* `anchorBox: 'auto'|'fixed'`
* `autoFit: boolean`
* `opacity: number` (0–1)

Effects/Position live in their panels and write the effect objects and layout props.

---

# 6) Visual specs (to match screenshot)

* Height: 36–38px; corner radius: 10–12px; inner padding: 6px.
* Group separators: 1px hairline with 12px horizontal gap.
* Icon size: 16px; touch target: 28–32px.
* Inputs: 30–34px tall, 6px radius, subtle shadow on focus.
* All items vertically centered; consistent hover bg (5–8% black).

---

# 7) Shortcuts (optional but delightful)

* **Bold/Italic/Underline/Strike:** Ctrl/Cmd+B / I / U / Shift+Cmd+X
* **Align:** Ctrl/Cmd+Shift+L/C/R
* **Increase/Decrease size:** Ctrl/Cmd+Shift+./,
* **Case cycle:** Ctrl/Cmd+Shift+K
* **Open Effects:** E
* **Open Position:** P

---

# 8) What to hand to Claude (task cards)

**Task 1 — Duplicate shape toolbar → `TextToolbar` shell**

* Fork the ShapeToolbar component, rename to TextToolbar, slot into the “text selected” state; keep the same layout primitives and overflow.

**Task 2 — Wire controls to properties**

* Implement the 12 controls above with exact prop names; use `setPropertyBatch` with merge-on-drag.

**Task 3 — Popovers**

* Build `SpacingPopover` (letter/line) and `ColorSwatchPopover` (color+alpha) with shared primitives.

**Task 4 — Left panel routing**

* Buttons “Effects” and “Position” open the left rail with corresponding sections mounted; panel remains hidden otherwise.

**Task 5 — Mixed state + history merging**

* Show “Mixed” where applicable; coalesce drag interactions into one history entry.

---

If you want, I can also generate the JSX/TSX stub for `TextToolbar` with all groups and the event payloads wired to your property system—say the word and I’ll drop it in.
