# Stage 0.3 — UI Proposal

Wireframes for the Stage 1 build. Layout and behaviour are proposed here; the theme
follows the system setting, with both light and dark versions (decision U1).

## App shell

- **Phone:** full viewport (`100dvh`), no frame, safe-area padding for notches.
- **Desktop:** one centred column, 430 px wide and full height, with a subtle page
  background. No rounded phone frame, no border, no nested frames.
- **Bottom nav:** Explore · Home · Profile, as outline icons with labels and 44 px touch targets.
- **Theme:** light and dark via CSS design tokens, following `prefers-color-scheme`. One accent colour, no gradients.
- **Routing:** URL-based (React Router), so the phone's Back button and refresh behave.
- **Typography:** system font stack, 17 px body text, 1.6 line height; monospace for code.
  Small uppercase labels are kept to a minimum.

## Home — learning feed

```text
┌─────────────────────────────────┐
│ ML › Classification             │  breadcrumb (tap → Explore tree)
│ LogReg  SVM  Trees  KNN  NB  →  │  sibling concepts, scrollable, underline = active
├─────────────────────────────────┤
│                                 │
│     σ(z) = 1 / (1 + e^−z)       │  visual: formula / Mermaid diagram / icon
│                                 │
│ Intuition                 2 / 6 │  facet label + position
├─────────────────────────────────┤
│ Squashing a score into a     ⌑  │  title + save ribbon (outline → red)
│ probability                     │
│                                 │
│ ~100–120 word summary …         │
│                                 │
│ [ Explore in Depth ] [ Quick ✓ ]│  primary filled / secondary outlined
├─────────────────────────────────┤
│   Explore     Home     Profile  │
└─────────────────────────────────┘
```

- Swipe left/right (and ←/→ on desktop) moves between cards with a short slide; reduced-motion users get none.
- **End of a concept:** after card 6, a completion card shows "Logistic Regression ✓ ·
  Quick checks 4/6 · Next: SVM →". Swiping on opens the next tab.
- Tapping a tab jumps to that concept's card 1 (or the resume position).
- **First launch:** Home opens on a seeded "Machine Learning" curriculum, so it is never
  empty. Explore is where new topics come from.

## Explore in Depth

```text
┌─────────────────────────────────┐
│ ←  Logistic Regression · Intuit.│
├─────────────────────────────────┤
│ [ visual, larger ]              │
│ Title                           │
│ Body: markdown + LaTeX,         │
│ 300–700 words, scrolls          │
│ ┌ Common misconceptions ──────┐ │
│ └─────────────────────────────┘ │
│ Related: [SVM] [Naive Bayes]    │  chips → that concept's feed
│ ▌Takeaway: one sentence         │
│ [ Take the Quick Check ]        │
└─────────────────────────────────┘
```

## Quick Check

```text
┌─────────────────────────────────┐
│ ←  Quick Check                  │
│ What happens to σ(z) as z → +∞? │
│ ( A ) 0                         │
│ ( B ) 0.5                       │
│ ( C ) 1                ✓        │  after answering: correct = green, chosen-wrong = red
│ Correct. σ saturates at 1 …     │  explanation
│ [ Continue → next card ]        │
└─────────────────────────────────┘
```

- One attempt per question in v1. The result is recorded (in memory in Stage 1, in the API from Stage 5).
- "Continue" returns to the feed and advances to the next card.

## Explore

```text
┌─────────────────────────────────┐
│ What do you want to learn?      │
│ [ e.g. Reinforcement Learning ] │
│ Suggested: [Deep Learning] [NLP]│
│            [MLOps] [LLMs]       │
│ Your curricula                  │
│  Machine Learning   12/40 ▸     │
│ ── tree for selected ─────────  │
│ ▾ Supervised Learning           │
│   ▾ Classification              │
│      ● Logistic Regression  ✓   │  ✓ done · ◐ in progress · ○ not started
│      ○ SVM                      │
└─────────────────────────────────┘
```

- Generating a curriculum shows a skeleton tree with "Planning your curriculum…".
  From Stage 3 an error shows a retry button and a reason ("The AI is busy…").
- Tapping a leaf opens Home on that concept.

## Profile

```text
┌─────────────────────────────────┐
│ Learner                         │
│ 12 concepts · 78% quiz accuracy │
│  · 9 saved                      │
│ Continue learning               │
│  Machine Learning  ███░░ 30%  ▸ │
│ Saved cards                   ▸ │
│ Needs review                    │  concepts with lowest quiz accuracy
│  Naive Bayes  2/6               │
└─────────────────────────────────┘
```

No streaks or fake stats. Everything shown is derived from real learner state.

## Loading, empty and error states

| Situation | UI |
|---|---|
| Concept not generated yet | Skeleton card plus "Writing Logistic Regression… usually 10–30 s". Background prefetch should make this rare. |
| Generation failed | Card-shaped message with the reason and a **Retry** button |
| Rate limited (free tier) | "The AI is busy, try again in a minute." Cached concepts keep working. |
| Offline / API down | Banner; already-loaded content stays readable |
| Visual fails to render | Falls back to the concept icon, so the card never breaks |

## Accessibility

44 px minimum touch targets, labelled icon buttons, visible focus, colour never the
only signal (✓/✗ alongside green/red), `prefers-reduced-motion` respected.
