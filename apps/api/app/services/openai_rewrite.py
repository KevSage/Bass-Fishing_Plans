# apps/api/app/services/open_ai_rewrite_day_progression.py
from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional

import httpx

OPENAI_API_URL = "https://api.openai.com/v1/responses"


def llm_rewrite_enabled() -> bool:
    return os.getenv("LLM_REWRITE", "").strip().lower() in ("1", "true", "yes", "on")


def _norm_text(s: Any) -> str:
    t = str(s or "").strip()
    t = t.replace("—", "-").replace("–", "-")
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def _phrase_regex(phrase: str) -> re.Pattern:
    """
    Build a dash-tolerant regex for a lure phrase, so:
      "Drop Shot — Small Minnow" matches:
      - "Drop Shot - Small Minnow"
      - "Drop Shot — Small Minnow"
      - "Drop Shot – Small Minnow"
    Also collapses whitespace.
    """
    p = _norm_text(phrase)
    if not p:
        # match nothing
        return re.compile(r"a^")

    # escape everything, then relax dashes and whitespace
    esc = re.escape(p)
    esc = esc.replace(r"\-", r"[-—–]")          # dash tolerant
    esc = esc.replace(r"\ ", r"\s+")           # whitespace tolerant
    return re.compile(esc, re.IGNORECASE)


def _build_featured_phrase(plan: Dict[str, Any]) -> str:
    c = plan.get("conditions")
    if isinstance(c, dict):
        pls = c.get("primary_lure_spec")
        if isinstance(pls, dict):
            dn = str(pls.get("display_name") or "").strip()
            if dn:
                return dn
    return str(plan.get("featured_lure_name") or "").strip()


def _build_secondary_phrase(plan: Dict[str, Any]) -> Optional[str]:
    c = plan.get("conditions")
    if not isinstance(c, dict):
        return None
    p2 = c.get("pattern_2")
    if not isinstance(p2, dict):
        return None

    pls = p2.get("primary_lure_spec")
    if isinstance(pls, dict):
        dn = str(pls.get("display_name") or "").strip()
        if dn:
            return dn

    recs = p2.get("recommended_lures") or []
    if isinstance(recs, list) and recs:
        s = str(recs[0] or "").strip()
        return s or None

    s = str(p2.get("lure") or "").strip()
    return s or None


def _strip_colors(line: str) -> str:
    line = re.sub(r"\s*\([^)]{1,40}\)\s*", " ", line)
    line = re.sub(
        r"\s+\bin\b\s+[a-z0-9][a-z0-9 /_-]{1,40}(?=\s*(—|--|-|,|;|:|\.|\s))",
        " ",
        line,
        flags=re.IGNORECASE,
    )
    return re.sub(r"\s+", " ", line).strip()


def _enforce_no_lure_repeats(lines: List[str], featured: str, secondary: Optional[str]) -> List[str]:
    """
    Enforce Kevin rule post-rewrite:
    - Morning: "Morning: <FEATURED>" appears exactly once, immediately after colon.
    - Midday/Late: no featured phrase at all.
    - Secondary phrase allowed ONLY if that line is explicitly a lure change, and then
      it must appear exactly once immediately after colon.
    """
    if len(lines) < 3:
        return lines

    featured = featured.strip()
    secondary = (secondary.strip() if secondary else None)

    feat_rx = _phrase_regex(featured)
    sec_rx = _phrase_regex(secondary) if secondary else None

    def starts_with_prefix(line: str, prefix: str) -> str:
        ln = (line or "").strip()
        if not ln.lower().startswith(prefix.lower()):
            return f"{prefix} {ln}".strip()
        pfx, _, rest = ln.partition(":")
        return f"{pfx.strip().title()}: {rest.strip()}".strip()

    # --- Morning ---
    m = starts_with_prefix(lines[0], "Morning:")
    pfx, _, rest = m.partition(":")
    rest = rest.strip()

    # remove ANY featured variant occurrences from rest (all of them)
    rest = feat_rx.sub("", rest)
    # also remove any secondary if it accidentally appears
    if sec_rx:
        rest = sec_rx.sub("", rest)

    rest = re.sub(r"\s+", " ", rest).strip(" —-").strip()

    # rebuild morning with exactly one canonical featured
    morning = f"{pfx.strip().title()}: {featured}"
    if rest:
        morning += f" — {rest}"
    morning = _strip_colors(morning)

    out = [morning]

    # --- Midday/Late ---
    for idx, prefix in [(1, "Midday:"), (2, "Late:")]:
        ln = starts_with_prefix(lines[idx], prefix)
        pfx, _, rest = ln.partition(":")
        rest = rest.strip()

        # remove featured everywhere (dash tolerant)
        rest = feat_rx.sub("", rest)

        used_secondary = False
        if secondary and sec_rx:
            # detect secondary at start (after normalization)
            if re.match(rf"^\s*{sec_rx.pattern}", _norm_text(rest), flags=re.IGNORECASE):
                used_secondary = True
            else:
                rest = sec_rx.sub("", rest)

        rest = re.sub(r"\s+", " ", rest).strip(" —-").strip()
        rest = _strip_colors(rest)

        if used_secondary and secondary:
            # remove secondary from the remainder (if duplicated), then rebuild
            rest2 = sec_rx.sub("", rest) if sec_rx else rest
            rest2 = re.sub(r"\s+", " ", rest2).strip(" —-").strip()

            rebuilt = f"{pfx.strip().title()}: {secondary}"
            if rest2:
                rebuilt += f" — {rest2}"
        else:
            rebuilt = f"{pfx.strip().title()}: {rest}".rstrip()

        out.append(rebuilt)

    return out


def _build_prompt(plan: Dict[str, Any], base_lines: List[str]) -> str:
    c = plan.get("conditions") or {}
    targets = plan.get("recommended_targets") or []
    tips = plan.get("strategy_tips") or []

    featured = _build_featured_phrase(plan)
    secondary = _build_secondary_phrase(plan)

    secondary_note = (
        f"- Optional Pattern 2 lure phrase (ONLY if changing lures): {secondary}"
        if secondary
        else "- Pattern 2: not present (do not introduce a second lure)."
    )

    return f"""
You are rewriting the day progression (3 lines) for a bass fishing plan.

NON-NEGOTIABLE RULES
- Do NOT change facts.
- Do NOT add new lures, colors, targets, conditions, depths, or numbers.
- Do NOT include any colors anywhere (no parentheses, no "in <color>").
- Output EXACTLY 3 lines, each starting with exactly: "Morning:", "Midday:", "Late:".
- Each line must be EXACTLY 1 sentence. Crisp, premium, practical tone.
- Max 24 words per line.

LURE MENTION RULE (STRICT)
- Morning line MUST be: "Morning: {featured} — <one sentence>".
  - The featured lure phrase must appear EXACTLY ONCE and must be immediately after the colon.
- Midday and Late MUST start with "Midday:" / "Late:" and must NOT include the featured lure phrase at all.
- You may ONLY mention a lure again if you are explicitly changing to Pattern 2.
  - If changing, the line must be: "Midday: <Pattern 2 lure phrase> — ..." or "Late: <Pattern 2 lure phrase> — ...".
  - Otherwise: "Midday: <tactical sentence>" / "Late: <tactical sentence>".

Facts you must stay within:
- Phase: {plan.get("phase")}
- Depth zone: {plan.get("depth_zone")}
- Conditions: temp_f={c.get("temp_f")}, wind_speed={c.get("wind_speed")}, sky_condition={c.get("sky_condition")}, clarity={c.get("clarity")}
- Featured lure phrase (use only in Morning): {featured}
{secondary_note}
- Allowed targets (top): {targets[:4]}
- Allowed tips (optional supporting cues): {tips[:4]}

Current draft (rewrite for variation + specificity, keep meaning):
- {base_lines[0] if len(base_lines) > 0 else "Morning: ..."}
- {base_lines[1] if len(base_lines) > 1 else "Midday: ..."}
- {base_lines[2] if len(base_lines) > 2 else "Late: ..."}
""".strip()


async def rewrite_day_progression(plan: Dict[str, Any], base_lines: List[str]) -> Optional[List[str]]:
    if not llm_rewrite_enabled():
        return None

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI REWRITE ERROR: Missing OPENAI_API_KEY")
        return None

    model = (os.getenv("OPENAI_MODEL") or "gpt-5-mini").strip() or "gpt-5-mini"
    prompt = _build_prompt(plan, base_lines)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body: Dict[str, Any] = {
        "model": model,
        "input": prompt,
        "text": {"verbosity": "low"},
        "reasoning": {"effort": "minimal"},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(OPENAI_API_URL, headers=headers, json=body)
            if r.status_code >= 400:
                print("OPENAI REWRITE HTTP ERROR:", r.status_code)
                print("OPENAI REWRITE BODY:", r.text[:2000])
                r.raise_for_status()
            data = r.json()

        text_out = None
        for item in data.get("output", []):
            for c in item.get("content", []):
                if c.get("type") == "output_text" and c.get("text"):
                    text_out = c["text"]
                    break
            if text_out:
                break

        if not text_out:
            print("OPENAI REWRITE ERROR: No output_text found. Keys:", list(data.keys()))
            return None

        raw = text_out.strip()

        def norm(ln: str) -> str:
            return ln.lstrip("•-* \t").strip()

        lines = [norm(ln) for ln in raw.splitlines() if norm(ln)]

        wanted = []
        for prefix in ("Morning:", "Midday:", "Late:"):
            found = next((ln for ln in lines if ln.startswith(prefix)), None)
            if not found:
                print("OPENAI REWRITE PARSE FAILED. RAW OUTPUT:")
                print(raw[:2000])
                return None
            wanted.append(found)

        featured = _build_featured_phrase(plan)
        secondary = _build_secondary_phrase(plan)
        wanted = _enforce_no_lure_repeats(wanted, featured=featured, secondary=secondary)

        return wanted

    except Exception as e:
        print("OPENAI REWRITE ERROR:", repr(e))
        return None