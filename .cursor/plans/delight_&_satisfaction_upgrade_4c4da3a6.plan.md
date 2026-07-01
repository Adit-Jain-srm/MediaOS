---
name: Delight & Satisfaction Upgrade
overview: "Remove the blocking FloatingSuggestions, then implement a research-backed satisfaction layer: native View Transitions, motion design tokens, spring-physics interactions, procedural UI sounds (tiks), depth system, and contextual delight moments that make MediaOS feel like Linear/Raycast."
todos: []
isProject: true
phases:
  - name: "Phase 1: Fix Blocker + Motion Infrastructure"
    todos:
      - id: remove-floating-suggestions
        content: Remove FloatingSuggestions from dashboard-shell.tsx, delete the component file, push immediately. This blocks Operator input.
        status: pending
      - id: motion-tokens
        content: "Add motion design tokens to globals.css: --motion-duration-instant (0ms), --motion-duration-fast (100ms), --motion-duration-standard (200ms), --motion-duration-slow (350ms), --motion-ease-enter (cubic-bezier(0,0,0.2,1)), --motion-ease-exit (cubic-bezier(0.4,0,1,1)), --motion-ease-spring (cubic-bezier(0.22,1.36,0.36,1)). Add prefers-reduced-motion override that sets all durations to 0."
        status: pending
      - id: view-transitions
        content: "Enable native View Transitions in next.config.ts (experimental.viewTransition: true). Add CSS for ::view-transition-old/new with crossfade animation (opacity 200ms). This is zero-library - the browser handles the morph between route snapshots."
        status: pending
      - id: shadow-depth-system
        content: "Add elevation utility classes: shadow-depth-1 (rest), shadow-depth-2 (hover/raised), shadow-depth-3 (floating/modal). Use oklch-based colored shadows tinted toward emerald (not pure black). Add glow-primary (0 0 12px oklch(0.696 0.17 162.5 / 25%)) for CTA emphasis."
        status: pending
  - name: "Phase 2: Button Fluidity + Spring Physics (The Linear Stack)"
    todos:
      - id: button-spring-physics
        content: "Upgrade button.tsx: convert from base-ui Button to motion.button for default+primary variants. Add whileHover={{ scale: 1.02 }} and whileTap={{ scale: 0.97 }} with spring config (stiffness: 500, damping: 30). Keep CSS handling color/bg/shadow transitions. Ghost/icon variants get whileTap only (no hover scale). Destructive gets a brief red shadow flash on hover."
        status: pending
      - id: button-shadow-depth
        content: "Add shadow transitions to button press: rest state has shadow-depth-1, hover lifts to shadow-depth-2 (translateY -1px implied by scale), active compresses shadow back to shadow-depth-1. Primary buttons get glow-primary on hover. This creates the 'pushed into surface' feel Linear uses."
        status: pending
      - id: button-gradient-shine
        content: "Add a gradient shine sweep to primary CTA buttons only (not all buttons): a ::before pseudo with skewed white/20% gradient that translates from -100% to +100% on hover over 1.2s ease-in-out. Subtle premium feel for hero actions (Open Operator, Generate Creatives). Gate behind prefers-reduced-motion."
        status: pending
      - id: card-tilt-deploy
        content: "Apply TiltCard wrapper to Command Center action cards (Open Operator, Run Research) and campaign card. Subtle 2-degree max tilt with spring damping (300/30). GPU-only (transform + perspective). Already built, just needs deployment."
        status: pending
      - id: sidebar-active-spring
        content: "Upgrade sidebar active indicator: add a soft emerald glow (box-shadow 0 0 8px oklch(0.696 0.17 162.5 / 30%)) on the active item. Tune AnimatedIndicator spring to (stiffness: 350, damping: 25) for slight overshoot on route change - the Raycast selection snap feel."
        status: pending
      - id: dropdown-scale-enter
        content: "Verify all dropdowns/popovers use scale(0.95)+opacity(0) -> scale(1)+opacity(1) with --motion-ease-enter (150ms entry, 100ms exit). Already done via tw-animate-css data-open, just verify timing aligns with motion tokens."
        status: pending
  - name: "Phase 3: Deploy Unused Primitives (Quick Wins)"
    todos:
      - id: deploy-slide-up
        content: "Wire SlideUp (currently dead code) to Operator chat messages in operator-chat.tsx. Each new message slides up 12px + fades in over 200ms. Stagger if multiple messages arrive. This is the highest-impact change for the AI interaction feel."
        status: pending
      - id: deploy-shimmer-skeleton
        content: "Replace plain Skeleton components in all loading.tsx files with ShimmerSkeleton (also dead code). The shimmer gradient is GPU-composited and already built - just needs imports swapped."
        status: pending
      - id: deploy-pressable-button
        content: "PressableButton exists with spring whileTap but is unused. After button.tsx gets its spring upgrade (Phase 2), PressableButton becomes redundant. Mark for removal or repurpose as a specialized 'magnetic' button for a single hero CTA."
        status: pending
      - id: agent-rail-slide
        content: "Add slide transition to AgentRail open/close. When agentRailOpen toggles, the panel slides in from right (translateX 100% -> 0) over 250ms with --motion-ease-enter. Use AnimatePresence + motion.aside for exit animation."
        status: pending
      - id: command-palette-scale
        content: "Add ScaleIn animation to CommandPalette open. It already uses Dialog under the hood which has zoom-in-95, but verify the timing uses --motion-duration-standard (200ms) and the backdrop blur transitions smoothly (150ms)."
        status: pending
  - name: "Phase 4: Procedural Sound System"
    todos:
      - id: install-tiks
        content: "Install tiks (npm i tiks) - zero-dependency procedural sound library using Web Audio API. No audio files shipped. Configure: theme 'soft', volume 0.3, respectReducedMotion: true."
        status: pending
      - id: sound-provider
        content: "Create src/hooks/use-sound.ts - a thin hook wrapping tiks that: (1) initializes AudioContext lazily on first user gesture, (2) reads mute preference from localStorage, (3) exposes play(type) method. No React context needed - tiks is a singleton."
        status: pending
      - id: wire-sounds
        content: "Wire sounds: tiks.click() on primary button press, tiks.success() on generation complete + deploy + save, tiks.pop() on tab switch, tiks.toggle() on sidebar collapse + theme toggle. Use the hook in each component, not a global listener."
        status: pending
      - id: sound-toggle
        content: "Add speaker icon toggle in TopBar (SpeakerHigh/SpeakerSlash from Phosphor). Persisted to localStorage key 'mediaos:sound'. Default: MUTED. Tooltip: 'Enable UI sounds'. This is opt-in delight."
        status: pending
  - name: "Phase 5: Data-Reactive Motion + Feedback"
    todos:
      - id: count-up-everywhere
        content: "Deploy CountUp on: analytics metric-cards (currently static numbers), creative studio stat pills, campaign hub metrics. The primitive exists and works - just swap static <span>{value}</span> for <CountUp value={n} />."
        status: pending
      - id: success-pulse
        content: "Add @keyframes ring-pulse { 0% { box-shadow: 0 0 0 0 oklch(0.696 0.17 162.5 / 40%); } 100% { box-shadow: 0 0 0 8px transparent; } } - 400ms one-shot. Fire on: toast success (via sonner custom styling), creative generation button after completion, deploy button after success."
        status: pending
      - id: operator-typing-indicator
        content: "Replace the current shimmer cursor bar in operator chat with a 3-dot typing indicator. Each dot: size-1.5 bg-primary rounded-full, staggered scale animation (0.5->1->0.5) at 0.6s period with 0.15s stagger. Spring physics for the bounce."
        status: pending
      - id: chart-animate-in
        content: "Recharts supports isAnimationActive + animationDuration. Set animationDuration={400} and animationEasing='ease-out' on all chart components. The useReducedMotion hook from chart-kit.tsx already gates this (isAnimationActive={!reduced})."
        status: pending
      - id: skeleton-crossfade
        content: "In all loading.tsx files: wrap the Suspense fallback content in a FadeIn with duration 0. When real content arrives, it fades in via the page's own FadeIn. The skeleton disappears and content appears with a 200ms crossfade rather than a hard swap."
        status: pending
  - name: "Phase 6: Contextual Delight Moments"
    todos:
      - id: hover-icon-animations
        content: "Sidebar nav icons: add CSS transition on the icon (transform 150ms). On link:hover, icon gets translateY(-1px) + scale(1.08). On link:active, icon returns to normal. Pure CSS, no JS overhead for a high-frequency interaction."
        status: pending
      - id: tooltip-explainability
        content: "Add Tooltip wrapping: CPA='Cost per Acquisition', CTR='Click-through Rate', CVR='Conversion Rate', ROAS='Return on Ad Spend', CPA in table headers. Score meters get 'Quality score: hook clarity + specificity + CTA strength'. Status badges get context ('Active: receiving live traffic')."
        status: pending
      - id: empty-state-personality
        content: "Upgrade loading.tsx skeleton headings with product-specific lines: analytics='Crunching campaign numbers...', research='Scanning the web...', creatives='Preparing the studio...', operator='Waking up the Operator...'. Brief, specific, not-cliche."
        status: pending
      - id: scroll-progress
        content: "Add a 2px fixed emerald bar at top of <main> showing scroll %. Implemented as a pure CSS scroll-driven animation (scroll-timeline: --page-scroll; animation-timeline: --page-scroll) with scaleX(0)->scaleX(1). No JS needed. Only visible on pages with overflow."
        status: pending
      - id: first-time-confetti
        content: "Dynamic import canvas-confetti. Fire a brief burst (particleCount: 80, spread: 60, origin.y: 0.7) when creative count goes 0->1+ for the first time in a session. Use a sessionStorage flag to prevent repeat. One-shot delight."
        status: pending
  - name: "Phase 7: Final Polish + Verification"
    todos:
      - id: reduced-motion-audit
        content: "grep -r 'animation\\|transition\\|whileHover\\|whileTap\\|@keyframes' src/ and verify each has prefers-reduced-motion handling. Motion tokens auto-handle CSS animations. motion/react props need useReducedMotion gating."
        status: pending
      - id: performance-budget
        content: "Run npm run build. tiks adds ~2KB gzipped. canvas-confetti ~5KB (dynamic). Total budget: <10KB new JS. Verify no layout-triggering animations (only transform+opacity). Run Lighthouse on local build."
        status: pending
      - id: mobile-375-test
        content: "Test at 375px: button springs feel good on touch, no horizontal overflow from new shadows, sounds don't auto-play, View Transitions work on Safari 18+, scroll progress bar doesn't occlude content."
        status: pending
      - id: full-verification
        content: "tsc --noEmit (0 errors) + npm test (all pass) + npm run build (success) + manual test of Operator typing (no overlap). Git commit + push + deploy."
        status: pending
---

# Delight & Satisfaction Upgrade

## Problem

1. **Immediate bug:** FloatingSuggestions component overlaps Operator composer input, blocking typing. It's also redundant with the sidebar navigation.
2. **Broader issue:** The platform is functional but lacks the tactile, satisfying feel of tools like Linear, Raycast, and Arc. Interactions feel flat despite having motion primitives available.

## Research Sources

- [The Micro-Transition Stack Used by Linear and Raycast](https://pixicstudio.medium.com/the-micro-transition-stack-used-by-linear-and-raycast-4fac298d5b9e) - Spring physics, press feedback, ease curves
- [Motion Design 2026: What Most Designers Get Wrong](https://mantlr.com/blog/motion-design-principles-2026) - Duration hierarchy, easing direction, reduced motion
- [Motion Design Tokens](https://www.uiuxatlas.com/lessons/motion/motion-design-tokens/) - Centralized motion values as CSS custom properties
- [Next.js View Transitions Guide](https://nextjs.org/docs/app/guides/view-transitions) - Native browser transitions for Next.js 16
- [Micro-Interactions 2026: The New Rules](https://creativealive.com/micro-interactions-2026-motion-ux-rules/) - Springs > bezier, data-reactive motion
- [tiks](https://github.com/rexa-developer/tiks/) - Zero-dependency procedural UI sound library
- [Atlassian Motion Design](https://atlassian.design/foundations/motion) - Frequency-based motion budget
- [Tactile Buttons (Reza Jafar)](https://www.rezajafar.com/experiments/tactile-buttons) - Spring press physics, interruptible animation
- [Spring Physics Buttons (tigerabrodi)](https://tigerabrodi.blog/how-to-implement-spring-physics-buttons-with-framer-motion) - Motion handles transform, CSS handles color

## Design Philosophy

**Target feel:** Linear's command bar responsiveness + Raycast's snappy selection + Vercel's clean transitions

**Key principles (from research):**
- Spring physics replace cubic-bezier for interactive elements (springs feel alive, beziers feel mechanical)
- Springs are INTERRUPTIBLE - you can release mid-press and the animation preserves velocity (beziers restart from zero)
- Duration hierarchy: micro (100-150ms), mid (200-300ms), large (300-500ms). Nothing over 500ms.
- High-frequency interactions (button press, hover) must be under 150ms
- Motion communicates state change, not decoration
- Sound is opt-in, not opt-out (default muted)
- Every animation has a reduced-motion fallback
- Deformation range: 0.95-1.05 scale. More reads as toy, not tool.

## Button Fluidity Strategy (from deep research)

**The layered approach (prevents property conflicts):**
- `motion/react` owns: `transform` (scale, translate) via spring physics
- CSS `transition` owns: `color`, `background-color`, `border-color`, `box-shadow`
- NEVER let both fight over the same property

**Per-variant behavior:**

| Variant | Hover | Press (whileTap) | Shadow | Special |
|---------|-------|-------------------|--------|---------|
| Primary/Default | scale(1.02) | scale(0.97) | depth-1 → depth-2 → depth-1 | Emerald glow + gradient shine sweep |
| Ghost/Icon | none | scale(0.96) | none | — |
| Secondary | scale(1.01) | scale(0.98) | depth-1 → depth-2 | — |
| Destructive | scale(1.01) | scale(0.97) | red glow flash | Warning emphasis |
| Link | none | none | none | Underline slide |

**Spring config:** `{ type: "spring", stiffness: 500, damping: 30 }` (from Tactile Buttons research - fast settle, slight overshoot)

## Dead Code to Deploy (from zoom-out audit)

4 primitives built but NEVER used:
- **SlideUp** → wire to Operator chat messages (biggest impact)
- **ShimmerSkeleton** → swap into all loading.tsx files
- **PressableButton** → redundant after button.tsx upgrade, remove
- **ScaleIn** → redundant with tw-animate-css, keep as utility

## Current Infrastructure (leverage, don't reinvent)

- `motion/react` already in bundle (spring physics available)
- Primitives: FadeIn, Stagger, CountUp, ScaleIn, PressableButton, TiltCard, AnimatedIndicator, SlideUp, ShimmerSkeleton
- CSS: card-hover, btn-press, shimmer, pulse-border
- Next.js 16.2.9 - View Transitions API supported natively
- Tailwind v4 with oklch tokens
- All existing animations honor prefers-reduced-motion
- PageTransition already exists in template.tsx (cross-fade + y-slide)

## Key Files to Modify

- `next.config.ts` - Enable viewTransition
- `src/app/globals.css` - Motion tokens, shadow utilities, keyframes, scroll-progress
- `src/components/layout/dashboard-shell.tsx` - Remove FloatingSuggestions
- `src/components/layout/floating-suggestions.tsx` - DELETE
- `src/components/layout/sidebar.tsx` - Active glow, icon hover
- `src/components/layout/agent-rail.tsx` - Slide transition
- `src/components/ui/button.tsx` - Spring physics upgrade (motion.button)
- `src/components/agent/operator-chat.tsx` - SlideUp messages, typing indicator
- `src/components/agent/message-bubble.tsx` - Entrance animation
- `src/hooks/use-sound.ts` - NEW: sound hook
- `src/app/(dashboard)/page.tsx` - TiltCard on action cards
- `src/app/(dashboard)/*/loading.tsx` - ShimmerSkeleton + personality copy
- `src/components/analytics/metric-cards.tsx` - CountUp, tooltips

## Performance Budget

| Addition | Size (gzipped) | Impact |
|----------|---------------|--------|
| tiks | ~2KB | Procedural sounds, no audio files |
| canvas-confetti | ~5KB (dynamic) | Only loaded once on first-creative event |
| Motion tokens CSS | ~500B | Zero runtime cost |
| View Transitions CSS | ~200B | Browser-native, zero JS |
| **Total new JS** | **<10KB** | Well within budget |
