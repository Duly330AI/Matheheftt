# Mobile UI SPEC — Mathe Trainer System

**Version:** 1.0  
**Status:** Implementation Ready  
**Scope:** UI Layer Only (Renderer + Interaction + Layout)  
**Core Architecture:** remains unchanged

---

## 1. Goal of Mobile UI Layer
The Mobile Layer is a pure presentation adapter.

It MUST NOT:
- know engine logic
- modify StudentModel
- affect difficulty

It MAY:
- render
- control focus
- interpret gestures
- adapt layout

---

## 2. Design Principles

### Single Thumb Rule
All primary actions reachable with one thumb.

### Zero Precision Interaction
No precise taps required — large targets only.

### Cognitive Calm UI
UI must never distract from math solving.

---

## 3. Screen Layout

```
Header
Math Grid (scrollable)
Hint Panel
Input Pad
```

---

## 4. Breakpoints

| Device | Width | Mode |
|------|------|------|
Phone | <600px | Compact |
Tablet | 600–1024px | Comfortable |
Desktop | >1024px | Full |

---

## 5. Grid Renderer Rules

**Cell Sizes**
- min: 48px
- ideal: 56px
- max: 72px

**Scaling**
```
cellSize = clamp(viewportWidth / columns, 48, 72)
```

**Touch Zone**
- visual = 56px
- hitbox = 72px

---

## 6. Input System

Mobile uses custom keypad — never system keyboard.

Layout:

```
7 8 9
4 5 6
1 2 3
⌫ 0 ✓
```

Events:

| Action | Result |
|------|------|
Tap cell | Focus |
Tap number | Insert |
Swipe left | Delete |
Long press | Hint |

---

## 7. Focus Override Logic

```
if keyboardOpen → disable scroll jumps
if thumb mode → delay auto advance 200ms
if rapid input → batch updates
```

---

## 8. Animations

| Animation | Duration |
|----------|---------|
Error | 200ms |
Success | 180ms |
Step Done | 250ms |

Rule: never exceed 300ms

---

## 9. Hint Panel States

| State | Behaviour |
|------|-----------|
Hidden | default |
Peek | on error |
Expanded | long press |

---

## 10. Performance Budget

| Operation | Limit |
|---------|------|
Frame | <16ms |
Input | <50ms |
Grid update | <30ms |

---

## 11. Orientation

Portrait → default  
Landscape → split

Landscape Layout:
```
Grid | Input
Grid | Hint
```

---

## 12. Accessibility

Must support:
- Screen readers
- High contrast
- Reduced motion
- Large text

ARIA Example:
```
digit input column 3 row 2
```

---

## 13. Gestures

| Gesture | Action |
|-------|-------|
Tap | Focus |
Double tap | Confirm |
Swipe left | Delete |
Swipe down | Hint |
Long press | Explain |

---

## 14. Error UX Sequence

1. Highlight red
2. Focus return
3. Soft vibration
4. Hint preview

---

## 15. Battery Saver Mode

Disable:
- animations
- shadows
- transitions

---

## 16. Rendering Strategy

```
if mobile → CSS Grid
else → default renderer
```

---

## 17. Test Matrix

Required devices:
- Low-end Android
- High refresh phone
- Tablet
- Foldable

---

## 18. Forbidden Patterns

- scroll + keyboard
- autofocus during scroll
- tiny inputs
- layout shifts mid step

---

## 19. Implementation Order

1. Responsive Grid
2. Touch Layer
3. Focus Engine
4. Animations
5. Hint Panel
6. Orientation
7. Accessibility

---

## 20. Done Definition

Mobile UI is complete when:
- child solves task without zoom
- no scroll needed during input
- errors clearly visible
- input feels instant

---

## 21. Dashboard Adaptation

The Teacher Dashboard is information-dense and requires specific mobile handling:

- **KPI Cards**: Stack vertically on mobile.
- **Skill Radar**: Centered with reduced labels.
- **Learning Curve**: Horizontal scroll or simplified sparkline.
- **Interventions**: Expandable list instead of side panel.

---

## Architecture Note

Mobile support is a UI adapter only — not a refactor.

This confirms a correct separation of:
Engine / State / Renderer
