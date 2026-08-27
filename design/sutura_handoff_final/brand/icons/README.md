# Sutura — Icon System

18 individual SVG icons derived from the approved Sutura icon direction, plus
five explicit color families for handoff and direct Flutter integration.

## Usage

The base icons use `currentColor`, so the same vector works for every state:

- active: `#E90046`
- inactive: `#4A2630`
- accent / selected: `#F5D500`

Default geometry: 24 × 24 viewBox, 2 px stroke, round caps and joins. The
icons are designed to scale to 16, 20, 24, 28 and 40 logical pixels.

## Explicit color variants

The `variants/` directory contains 90 standalone SVG files: 18 icons × 5
Sutura colors. These files use fixed stroke colors and can be integrated
directly without additional theming logic.

| Folder | Hex | Recommended use |
|---|---|---|
| `framboise/` | `#E90046` | active navigation, primary actions |
| `prune/` | `#4A2630` | default icons, secondary actions |
| `jaune/` | `#F5D500` | accent, highlights, selected states |
| `noir/` | `#101418` | dark neutral contexts |
| `blanc/` | `#FFFFFF` | dark or framboise backgrounds |

Naming convention: `variants/<color>/<icon>.svg`.

## Files

`home`, `collections`, `create`, `tests`, `analytics`, `notifications`,
`profile`, `settings`, `search`, `filter`, `back`, `close`, `add`, `more`,
`check`, `lock`, `help`, and `share`.
