# Dos Tazas Design System

A self-contained, brand-consistent component library that encodes the Dos Tazas
identity — the warm coffee palette (espresso / warm-roast / coffee-fruit /
pergamino), the Gotham + Titan One type pairing, and rounded, softly-elevated
surfaces.

It is built on the **same tokens as the app** (`src/app/globals.css`, Tailwind
v4 CSS-first), so every component is dark-mode-aware automatically — no
per-element `dark:` overrides for brand colors.

## View it

Run the project and open the home page. The showcase renders every component
in light and dark (toggle in the top-right), grouped into Foundations, Basic,
and Advanced.

```bash
npm run dev   # then visit http://localhost:3000
```

## Use it

```tsx
import { Button, Surface, StatCard, RoastLevelMeter, toast } from "@/design-system";

<Button variant="primary" pill leadingIcon={<Plus />}>New order</Button>
<RoastLevelMeter defaultValue="Medium" onValueChange={setRoast} />
toast.success("Order placed");
```

## What's inside

| Group | Components |
|---|---|
| **Foundations** | `tokens.ts` — palette, type scale, radii, elevation, spacing |
| **Basic** | Button, IconButton, Badge, StatusPill, Field, Input, Textarea, Select, Checkbox, RadioGroup/Radio, Switch, Avatar/AvatarGroup, Alert, Tooltip, Spinner, Skeleton, Progress, Divider |
| **Advanced** | Surface, StatCard, Tabs, Accordion, Modal, `toast`, DataTable, EmptyState, Pagination, Breadcrumb, Stepper, SegmentedControl, QuantityStepper, RoastLevelMeter |

## Conventions

- **No raw hex / arbitrary colors** — brand or semantic tokens only; depth comes
  from opacity modifiers (`text-expresso/70`, `bg-warm-roast/10`).
- Classes merged with `cn()` from `@/lib/utils`; variants via `class-variance-authority`.
- Interactive components are `"use client"`; presentational ones stay server-safe.
- Icons from `lucide-react`, colored with `currentColor`.

## Relationship to the Management app's `ui/`

This is a **standalone design reference**, separate from the Dos Tazas
Management app's production primitives in its `src/components/ui/` (which are
wired to `@base-ui` via shadcn). Where that app already has a battle-tested
primitive (e.g. `GenericModal`, the `@base-ui` `Select`), prefer it in product
code; reach for these when you want the documented, dependency-light reference
implementation or are prototyping.

> Note: the showcase uses plain English labels because it is internal design
> documentation, not product UI — product surfaces still route all user-facing
> strings through i18n (`useTranslation` / `TranslateText`).
