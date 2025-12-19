# BassFishingPlans (BFP) — System Overview

BassFishingPlans (BFP) is a rules-based, deterministic fishing plan generator designed to produce premium, single-session bass fishing plans for a specific place and date.

The system intentionally avoids AI chatter, continuous updates, or adaptive behavior. Each request produces one authoritative plan grounded in environmental inputs, presentation logic, and strict output canon.

## Core Principles

- Presentation-first logic
- Deterministic output
- Two-pattern structure
- No drift

## What BFP Is

- A paid planning tool
- A decision compressor
- A field-ready execution guide
- A single-source-of-truth fishing plan

## What BFP Is Not

- A real-time fish finder
- A sonar or vision system
- A continuously updating advisor
- A lure suggestion engine
- A teaching platform

## Execution Modes

### Preview Mode
Endpoint: /plan/preview  
Reduced content, marketing-safe, canon-compliant.

### Member Mode
Endpoint: /plan/members  
Full plan generation with refinements and full day progression.

## Output Artifacts

- Mobile Field Plan (primary)
- Printable Reference Plan (secondary)

Content is identical; only presentation differs.

## Determinism & Trust

Plans are reproducible via snapshot hashing and strict input contracts.

## Subscription Boundary

Billing gates access only. Plan logic is billing-agnostic.

## Canon Enforcement

All output must conform to locked BFP canons.
