import sys
import os
import json
from datetime import datetime

# --- 1. ROBUST PATH SETUP ---
# Get the directory where this script actually lives (e.g., .../apps/api/app)
script_dir = os.path.dirname(os.path.abspath(__file__))

# Go up one level to find the root of the API (e.g., .../apps/api)
api_root = os.path.dirname(script_dir)

# Add that root to Python's path so it can find 'app' as a module
if api_root not in sys.path:
    sys.path.append(api_root)

# Debug: Print where we are looking
print(f"📂 context: {api_root}")
# ---------------------------

try:
    # 2. Import the logic
    from app.patterns.pattern_logic import build_pro_pattern
    from app.patterns.schemas import ProPatternRequest
except ImportError as e:
    print(f"❌ IMPORT ERROR: {e}")
    print("Ensure you are running this with the 'apps/api' folder accessible.")
    sys.exit(1)

def run_test():
    print("----------------------------------------------------------------")
    print("🧪  TESTING SMART LOGIC: Foggy Morning + Falling Pressure")
    print("----------------------------------------------------------------")

    # 3. Mock a Request: Foggy (Vis < 2000), Windy, Low Pressure
    # Triggers: 
    # - Fog -> Filters out sight baits (Jerkbait), forces Vibration (Chatterbait)
    # - Low Pressure -> "Chase" mode
    mock_request = ProPatternRequest(
        latitude=34.0, 
        longitude=-84.0,
        trip_date="2023-03-15",
        bottom_composition="rock",
        clarity="stained",
        weather_snapshot={
            "temp_f": 62.0,
            "wind_mph": 15.0,        # Windy -> Aggressive
            "sky_condition": "cloudy",
            "pressure": 1008.0,      # Low/Falling -> Feeding Frenzy
            "visibility": 1500.0,    # FOG ALERT (< 2000m) -> Blind fish
            "uvi": 1.0               # Low UV
        }
    )

    # 4. Run the Builder
    try:
        response = build_pro_pattern(mock_request)
    except Exception as e:
        print(f"❌ CRASHED: {e}")
        import traceback
        traceback.print_exc()
        return

    # 5. PRINT FULL OUTPUT
    # This JSON is exactly what your Frontend will receive.
    print("\n📜 FULL GENERATED PLAN JSON:")
    if hasattr(response, "model_dump_json"):
        print(response.model_dump_json(indent=2))
    else:
        print(response.json(indent=2))

    print("\n----------------------------------------------------------------")
    print("🔍  SMART LOGIC VERIFICATION")
    print("----------------------------------------------------------------")

    # A. Check Weather Insights (The Reverse Card Data)
    insights = response.conditions.get("weather_insights", [])
    print(f"📝 WEATHER INSIGHTS (Back of Card):")
    if not insights:
        print("   ❌ NONE (Logic failed to trigger)")
    for i in insights:
        print(f"   ✅ {i}")

    # B. Check Lure Selection (Fog Filter)
    lures = response.recommended_lures
    print(f"\n🎣 RECOMMENDED LURES: {lures}")
    if "jerkbait" in lures:
        print("   ❌ FAIL: Suggested 'jerkbait' in heavy fog.")
    elif any(x in lures for x in ["chatterbait", "spinnerbait", "squarebill"]):
        print("   ✅ PASS: Correctly prioritized vibration for low visibility.")

    # C. Check Specific Lure Tips
    tips = response.strategy_tips
    print(f"\n💡 STRATEGY TIPS:")
    found_specific = False
    for t in tips:
        print(f"   - {t}")
        # Look for keywords from retrieve_rules.py (e.g. "flare", "thump", "deflect")
        if any(k in t.lower() for k in ["flare", "thump", "deflect", "rip", "contact"]):
            found_specific = True
    
    if found_specific:
        print("   ✅ PASS: Included specific lure mechanics.")
    else:
        print("   ⚠️ WARNING: Tips look generic.")

if __name__ == "__main__":
    run_test()