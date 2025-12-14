import os
from typing import Any, Dict, List, Optional

import httpx

OPENAI_API_URL = "https://api.openai.com/v1/responses"


def llm_rewrite_enabled() -> bool:
    """
    Single source of truth for enabling rewrite.
    Env vars are strings, so normalize.
    """
    return os.getenv("LLM_REWRITE", "").strip().lower() in ("1", "true", "yes", "on")


def _build_prompt(plan: Dict[str, Any], base_lines: List[str]) -> str:
    c = plan.get("conditions") or {}
    lures = plan.get("recommended_lures") or []
    colors = plan.get("color_recommendations") or []
    targets = plan.get("recommended_targets") or []
    tips = plan.get("strategy_tips") or []

    lure = (lures[0] if lures else "the featured bait")
    color = (colors[0] if colors else None)
    lure_phrase = f"{lure} ({color})" if color else lure

    # Tight, facts-only prompt (rewrite layer)
    return f"""
You are rewriting 3 short timeline suggestions for a bass fishing plan.

Rules:
- Do NOT change facts.
- Do NOT introduce new lures, colors, targets, depths, or conditions.
- Use only the provided details.
- Output EXACTLY 3 lines, each starting with: "Morning:", "Midday:", "Late:"
- Each line: EXACTLY 1 SENTENCE. Crisp, premium, non-encyclopedia tone.
- Do NOT output bullet points. Do NOT output a paragraph.
Facts you must stay within:
- Phase: {plan.get("phase")}
- Depth zone: {plan.get("depth_zone")}
- Conditions: temp_f={c.get("temp_f")}, wind_speed={c.get("wind_speed")}, sky_condition={c.get("sky_condition")}, clarity={c.get("clarity")}
- Primary lure+color to reference: {lure_phrase}
- Allowed targets (top): {targets[:4]}
- Allowed tips (optional supporting cues): {tips[:4]}
- Max 24 words per line.

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

        # ---- Extract text from Responses API ----
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

        # ---- Normalize lines (strip bullets, whitespace) ----
        def norm(ln: str) -> str:
            return ln.lstrip("•-* \t").strip()

        lines = [norm(ln) for ln in raw.splitlines() if norm(ln)]

        # ---- Pull the 3 required lines by prefix ----
        wanted = []
        for prefix in ("Morning:", "Midday:", "Late:"):
            found = next((ln for ln in lines if ln.startswith(prefix)), None)
            if not found:
                print("OPENAI REWRITE PARSE FAILED. RAW OUTPUT:")
                print(raw[:2000])
                return None
            wanted.append(found)

        return wanted

    except Exception as e:
        print("OPENAI REWRITE ERROR:", repr(e))
        return None