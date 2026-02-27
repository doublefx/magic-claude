---
name: ui-design
description: "UI design context gathering for features involving frontend work. Detects design MCP tools, gathers design context through layered fallback, and produces a UI Design Spec that feeds into TDD."
user-invocable: false
---

# UI Design Phase

Conditional phase (Phase 1.75) in the proactive-orchestration pipeline. Gathers design context for UI features before TDD begins, ensuring intentional design decisions instead of generic implementations.

## When to Activate

Plan tasks involve UI work:
- File extensions: `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`, `.scss`
- Plan mentions: UI components, screens, layouts, visual elements, forms, modals, navigation
- Feature description includes: "design", "mockup", "wireframe", "UI", "layout", "frontend", "component"

## When NOT to Activate

- Backend-only features (API endpoints, database, services)
- CLI tools and terminal interfaces
- Infrastructure and DevOps (CI/CD, Docker, deployment)
- Pure refactoring with no visual changes
- Configuration or dependency changes

## Tool Detection

Run `detect-tools.cjs` to scan for available design tools:

```bash
node skills/ui-design/detect-tools.cjs --json
```

The script scans:
1. **MCP config** from `~/.claude/settings.json`, `.claude/project.json`, `.claude/settings.json`
2. **Disabled servers** from `disabledMcpServers` arrays in the same config files
3. **frontend-design plugin** from `~/.claude/plugins/installed_plugins.json`
4. **Tool reference files** at three levels (plugin → user → project, project wins)

Present a summary table of detected tools to the user:

| Tool | Status | Category | Tier |
|------|--------|----------|------|
| figma | installed / not installed / disabled | design | Freemium |
| pencil | ... | design | Free |
| shadcn-ui | ... | component-library | Free |
| screenshot | always available | native | Free |
| frontend-design | installed / not installed | plugin | Free |

If no design MCPs are installed, present installation options. The user decides whether to install or proceed without.

## MCP Error Handling

**Never block the pipeline on a broken MCP.** Treat any MCP tool error or timeout as "tool unavailable" and fall to the next layer.

- MCP tool calls have a ~30s default timeout
- Errors return `isError: true` in the tool result, not protocol-level errors
- Log which layer succeeded in the design spec confidence indicator
- Rate limits: respect per-tool limits (e.g., Figma free = 6 calls/month — self-ration)

## Layered Fallback Strategy

Gather design context through layers, falling to the next on error or absence:

### Layer 1: Design MCP (highest fidelity)

Available tools: Figma, Pencil.dev, Penpot

Use when a design file/project exists with the feature's UI designs:
1. Extract layout structure and component hierarchy
2. Extract design tokens (colors, typography, spacing)
3. Identify reusable components and patterns
4. Export visual references if available

**On error** → fall to Layer 2.

### Layer 2: Component Library MCP

Available tools: shadcn/ui, Storybook, Magic UI / 21st.dev

Use to match design needs to available components:
1. Search for components matching the feature's UI needs
2. Get component APIs, props, and usage patterns
3. Identify which existing components to reuse vs. create new
4. Get code patterns for selected components

**On error** → fall to Layer 3.

### Layer 3: Screenshot Analysis (native)

Always available — Claude's built-in multimodal vision:
1. Ask the user for screenshots of existing UI, mockups, or reference designs
2. Read image files with the Read tool
3. Extract layout hierarchy, component types, spacing patterns
4. Map visual elements to component library equivalents

**If no screenshots provided** → fall to Layer 4.

### Layer 4: Design Inference (baseline)

Invoke the `frontend-design:frontend-design` plugin skill if installed:
1. Use the Skill tool to invoke `frontend-design:frontend-design`
2. The skill provides design thinking framework and aesthetic guidance
3. Apply design heuristics based on the plan context

If the plugin is not installed:
- Print installation instructions:
  ```
  /plugin marketplace add anthropics/claude-plugins-official
  /plugin install frontend-design@claude-plugins-official
  ```
- Continue with Claude's built-in design knowledge (degraded but functional)

## Lightweight vs Full Spec

**Full spec** (Layer 1, 2, or 3 succeeded): Complete design spec with concrete values.

**Lightweight spec** (Layer 4 only — no MCPs, no screenshots, no plugin):
- Component list and hierarchy only
- Basic layout structure from plan context
- No concrete design token values
- Note: "This spec is based on plan context and design heuristics. Consider providing screenshots or installing a design MCP for higher fidelity."

Include a **confidence indicator** in the spec:
- `[MCP:<tool-name>]` — Design data from an MCP tool
- `[screenshot]` — Design data from screenshot analysis
- `[inference-only]` — No external design source available

## Architectural Respect

**Do not override Phase 0/1 decisions.** The plan from Phase 1 already incorporates any architectural decisions from Phase 0. Respect:
- Component library choices (e.g., "use shadcn/ui" from the plan)
- Framework decisions (React, Vue, Svelte, etc.)
- Design system selections already in the plan
- Layout architecture choices (e.g., sidebar vs. top-nav)

The UI Design phase **enriches** the plan with design detail — it does not redesign.

## UI Design Spec Output

Produce a structured spec:

```markdown
# UI Design Spec: <feature-name>

**Date:** YYYY-MM-DD
**Design Source:** [MCP:<tool>/screenshot/inference-only]
**Confidence:** [high/medium/low]

## Layout

- Page/screen structure
- Grid/flex layout approach
- Responsive breakpoints

## Components

| Component | Source | Key Props | A11y |
|-----------|--------|-----------|------|
| ... | shadcn/ui Button | variant="primary" | role="button" |

## Design Tokens

- Colors: primary, secondary, accent, background, text
- Typography: headings, body, labels
- Spacing: component gaps, padding, margins

## Interactions

- User flows (click → navigate, submit → loading → success)
- Animation/transition notes
- Error states and feedback

## Responsive Behavior

- Mobile, tablet, desktop variations
- Component visibility/layout changes per breakpoint

## Accessibility

- ARIA roles and labels
- Keyboard navigation
- Color contrast requirements
- Screen reader considerations
```

## Design Spec Persistence

Persist the spec to `.claude/design-specs/YYYY-MM-DD-<feature-name>.md`:
- Survives session loss, compaction, or exit
- Referenced during TDD (Phase 2) and review (Phase 4)
- Includes the design source and confidence indicator

## Integration with TDD

The design spec becomes input context for Phase 2:
- Component tests reference the spec's component list
- Visual assertions use spec's design tokens where possible
- Accessibility tests verify spec's a11y requirements
- **No separate user approval** for the spec — it flows directly into TDD

## Related

- `magic-claude:proactive-orchestration` — Parent pipeline (Phase 1.75)
- `frontend-design:frontend-design` — Anthropic design thinking skill (Layer 4 baseline)
- `magic-claude:frontend-patterns` — React/Next.js implementation patterns
- `magic-claude:coding-standards` — TypeScript/JavaScript coding standards
- `detect-tools.cjs` — Tool detection utility script
- `tools/` — Tool reference files (extensible at user/project level)
