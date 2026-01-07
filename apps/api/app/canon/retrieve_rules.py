from typing import Any, Dict, List, Tuple
import hashlib
import json

Tip = Tuple[str, str, Tuple[str, ...]]  # (text, category, tags)

# ------------------------------------------------------------
# Lure-specific retrieve tips for LLM context
# ------------------------------------------------------------

LURE_TIP_BANK: Dict[str, List[Tip]] = {
    # --- Horizontal Reaction ---
    "shallow crankbait": [
        ("Keep it moving and hunting—aim to deflect off wood/rock without stalling the bait.", "contact", ("any", "wood", "rock", "riprap")),
        ("Run it across the first break and along bank transitions; repeat the angles that produce bumps.", "angles", ("any", "shallow", "mid")),
        ("In clearer/brighter water, lengthen casts and keep the track line clean before you speed up.", "gear", ("clear", "bright")),
        ("In stained/dirty water, tighten to cover and let contact be the trigger.", "targets", ("stained", "dirty")),
    ],
    "mid crankbait": [
        ("Use steady retrieves with short speed changes every few casts—let the fish 'vote' on pace.", "cadence", ("any",)),
        ("Prioritize mid-depth edges: points, channel swings, and the outside line of cover.", "targets", ("mid", "points", "channel")),
        ("If you're ticking grass/cover, occasionally pop it free—those breakouts are prime reaction moments.", "contact", ("grass", "stained", "dirty", "any")),
        ("Windy banks first—position so the bait tracks naturally with the push.", "positioning", ("windy",)),
    ],
    "deep crankbait": [
        ("Make long casts and keep bottom contact—grinding and brief stalls often trigger the bite.", "contact", ("deep", "very_deep", "any")),
        ("Focus on depth access: ledges, channel edges, and hard spots rather than random deep water.", "targets", ("deep", "very_deep", "channel")),
        ("If bites are scarce, slow the retrieve before you change locations—deep fish often want a steadier track.", "cadence", ("any", "bright")),
        ("In wind, set up to maintain consistent contact—control matters more than speed.", "positioning", ("windy",)),
    ],
    "lipless crankbait": [
        ("Cover water quickly, then tighten to the stretch that produces the first tick or follow.", "discipline", ("any",)),
        ("If you're ticking grass, rip it free occasionally—snaps create the reaction moment.", "contact", ("grass", "any")),
        ("In colder windows, use a yo-yo lift-drop along edges instead of burning it.", "cadence", ("winter", "mid", "deep", "any")),
        ("Stained/dirty water: keep it closer to cover and trust vibration/contrast.", "targets", ("stained", "dirty")),
    ],
    "chatterbait": [
        ("Keep a steady thump, then add short 'flare' pauses when you contact cover.", "cadence", ("any", "wood", "grass")),
        ("Track it just above grass/cover—rod angle controls depth more than speed.", "depth", ("any", "grass", "shallow", "mid")),
        ("Windy stretches first—use the push to find active fish before slowing down.", "positioning", ("windy",)),
        ("In calm/clear, keep the track line cleaner and soften cadence around the target.", "gear", ("calm", "clear")),
    ],
    "swim jig": [
        ("Swim it through lanes and edges; let it tick cover but avoid plowing into it.", "targets", ("any", "grass", "wood")),
        ("Use a steady swim with occasional half-second stalls near cover to trigger followers.", "cadence", ("any",)),
        ("Bright skies: run it tighter to shade edges and the cleanest cover boundary.", "targets", ("bright", "shade")),
        ("In wind, maintain a consistent track with the drift—natural speed extends the strike zone.", "positioning", ("windy",)),
    ],
    "spinnerbait": [
        ("Keep it moving with consistent blade rhythm; bump cover and pause briefly to make it flare.", "cadence", ("any", "wood", "riprap")),
        ("In stained/dirty water, fish it tighter to targets—let vibration do the locating.", "targets", ("stained", "dirty")),
        ("Calm/clear: longer casts and a slightly subtler cadence near the target.", "gear", ("calm", "clear")),
        ("Windy banks/points first—fish often position facing into the push.", "positioning", ("windy",)),
    ],
    "underspin": [
        ("Swim it steadily just above the fish—underspin wins by believability, not noise.", "cadence", ("any",)),
        ("Clearer water: longer casts and smoother turns; keep it tracking true.", "gear", ("clear", "bright")),
        ("Work open-water edges: points, channel sides, and baitfish lanes.", "targets", ("open_water", "points", "channel", "mid", "deep")),
        ("Wind helps: use it to cover water and keep the bait moving naturally.", "positioning", ("windy",)),
    ],
    "paddle tail swimbait": [
        ("Keep it smooth and consistent—small speed changes beat big cadence swings.", "cadence", ("any",)),
        ("Fish the highest-percentage lanes: edges, points, and depth access where bait travels.", "targets", ("points", "channel", "open_water", "any")),
        ("Dirty/stained: run it tighter to cover or along the edge so fish can track it.", "targets", ("dirty", "stained")),
        ("Clear/bright: longer casts and a slightly higher track line can draw more followers into bites.", "gear", ("clear", "bright")),
    ],

    # --- Vertical Reaction ---
    "jerkbait": [
        ("Start with twitch-twitch-pause, then let the fish tell you the pause length.", "cadence", ("any",)),
        ("Bright/clear: lengthen pauses on the best edge and keep it in-zone longer.", "cadence", ("bright", "clear")),
        ("Lower light: shorten pauses and cover more water—fish track more willingly.", "cadence", ("low_light",)),
        ("Work it parallel to depth changes and over depth access; direction matters as much as cadence.", "angles", ("any", "mid", "deep")),
    ],
    "blade bait": [
        ("Use short lifts and controlled falls—most bites happen on the drop.", "cadence", ("any", "mid", "deep")),
        ("Keep it tight to bottom edges and hard spots; blade bait is a precision tool, not a search bait.", "targets", ("rock", "riprap", "channel", "deep", "any")),
        ("Cold window: slow the lift and extend the fall—let it 'vibrate then die.'", "cadence", ("winter",)),
        ("Windy days: maintain contact and line control—sloppy falls lose strikes.", "gear", ("windy",)),
    ],

    # --- Bottom Contact - Dragging ---
    "texas rig": [
        ("Drag, pause, and re-cast key angles—bites often happen after the bait stops.", "cadence", ("any",)),
        ("Work bottom transitions (hard-to-soft, edge lines) instead of dragging featureless water.", "targets", ("any", "rock", "channel", "points")),
        ("Dirty/stained: fish tighter to cover and make your moves a bit more pronounced.", "targets", ("dirty", "stained", "wood", "grass")),
        ("Clear/bright: longer casts, lighter feel, and longer soaks near the best target.", "gear", ("clear", "bright")),
    ],
    "carolina rig": [
        ("Cover bottom efficiently: long drags with clean resets; let the rig sweep over changes.", "cadence", ("any", "mid", "deep")),
        ("Prioritize flats near channels and the first break off feeding areas.", "targets", ("flats", "channel", "mid", "deep")),
        ("Wind helps maintain feel—drag quartering downwind to keep consistent contact.", "positioning", ("windy",)),
        ("When bites are subtle, slow the drag before changing locations.", "discipline", ("bright", "any")),
    ],
    "football jig": [
        ("Drag it through rock/hard bottom and pause when it 'loads up' on a seam.", "contact", ("rock", "any", "mid", "deep")),
        ("Work points and ledges—football jigs shine where bottom contour changes.", "targets", ("points", "channel", "mid", "deep")),
        ("In colder windows, shorten moves and extend pauses.", "cadence", ("winter",)),
        ("Bright skies: focus on the cleanest edge and stay methodical.", "discipline", ("bright",)),
    ],
    "shaky head": [
        ("Let it sit, then shake in place—shaky head wins by time-in-zone, not distance.", "cadence", ("any",)),
        ("Work it along edges and subtle cover; small changes in angle often trigger bites.", "angles", ("any", "rock", "wood", "docks")),
        ("Clear/bright: lighten up and lengthen casts; keep the movements smaller.", "gear", ("clear", "bright")),
        ("Windy: keep line control tight so the bait stays pinned where you want it.", "gear", ("windy",)),
    ],

    # --- Bottom Contact - Hopping / Targeted ---
    "casting jig": [
        ("Fish target-to-target: first flip is the best flip—then give it a second look from a better angle.", "angles", ("any",)),
        ("Let it fall on controlled slack; watch for ticks or early stops.", "cadence", ("any",)),
        ("Work the darkest shade and the hardest edge you can reach in bright conditions.", "targets", ("bright", "shade", "docks", "wood")),
        ("In grass/wood, keep hops short and controlled; in rock, let it settle longer.", "cadence", ("grass", "wood", "rock", "any")),
    ],

    # --- Hovering / Mid-Column Finesse ---
    "neko rig": [
        ("Make it a 'hover then glide'—small pulls, long pauses, and repeatable casts.", "cadence", ("any",)),
        ("Clear water: longer casts and quieter entries; let it fall naturally.", "gear", ("clear", "bright")),
        ("Work along edges and around isolated targets—neko shines when you can repeat the fall path.", "targets", ("any", "docks", "wood", "rock")),
        ("In wind, tighten line control so your fall stays vertical enough to read strikes.", "gear", ("windy",)),
    ],
    "wacky rig": [
        ("Let it fall on slack and watch the line—most bites happen on the fall.", "cadence", ("any",)),
        ("Best around shade and edges: docks, overhangs, isolated cover.", "targets", ("shade", "docks", "wood", "any")),
        ("Bright/clear: slow down and let it soak longer near the target.", "cadence", ("bright", "clear")),
        ("Lower light: rotate targets faster until you find the stretch that reloads.", "positioning", ("low_light",)),
    ],
    "soft jerkbait": [
        ("Use twitch-twitch-glide; let the glide do the convincing.", "cadence", ("any",)),
        ("Work it over grass lanes, points, and shallow edges where fish roam.", "targets", ("grass", "points", "shallow", "any")),
        ("Clear/bright: longer casts and subtler twitches; keep it tracking true.", "gear", ("clear", "bright")),
        ("Wind: use it to cover water, but keep slack managed for clean glides.", "gear", ("windy",)),
    ],
    "ned rig": [
        ("Short drags with micro-pauses—ned is about bottom presence, not hops.", "cadence", ("any",)),
        ("Work hard spots and edges; transitions are your targets.", "targets", ("rock", "any", "shallow", "mid")),
        ("Clear water: longer casts, smaller moves, longer soaks.", "gear", ("clear", "bright")),
        ("Windy: keep your line angle under control so you can feel the 'mush' bite.", "gear", ("windy",)),
    ],
    "dropshot": [
        ("Hold it in place and shake the slack—dropshot wins by staying in-zone.", "cadence", ("any", "mid", "deep")),
        ("Fish vertical edges, points, and depth access; keep it near the cleanest boundary.", "targets", ("points", "channel", "mid", "deep")),
        ("Bright/clear: extend soak time and keep movements subtle.", "cadence", ("bright", "clear")),
        ("Windy: add just enough control to stay vertical and detect light bites.", "gear", ("windy",)),
    ],

    # --- Topwater - Horizontal ---
    "walking bait": [
        ("Work a steady walk and only pause at 'high-percentage' targets or after a show.", "cadence", ("any",)),
        ("Lower light: cover more water—points, flats near depth, and long edges can light up fast.", "positioning", ("low_light", "points", "flats")),
        ("Bright/calm: longer casts and quieter rhythm; favor shade edges.", "gear", ("bright", "calm", "shade")),
        ("Windy: focus on lanes and seams rather than trying to fish every pocket.", "targets", ("windy",)),
    ],
    "buzzbait": [
        ("Start steady and keep it tracking—speed up slightly when fish are swiping short.", "cadence", ("any",)),
        ("Run it tight to cover and along shade lines; buzzbait is a lane tool.", "targets", ("shade", "wood", "docks", "any")),
        ("In stained/dirty water, tighter to targets is better than 'open' buzzing.", "targets", ("stained", "dirty")),
        ("Wind: hit windward banks early—fish commit harder in chop.", "positioning", ("windy",)),
    ],
    "whopper plopper": [
        ("Use a steady burn as baseline, then add brief pauses near cover to convert followers.", "cadence", ("any",)),
        ("Best on edges and lanes—points, outside grass lines, and shade boundaries.", "targets", ("points", "grass", "shade", "any")),
        ("Bright/calm: longer casts; don't land it on top of them.", "gear", ("bright", "calm")),
        ("Low light: cover water and revisit the stretch that produced shows.", "discipline", ("low_light",)),
    ],
    "wake bait": [
        ("Keep it waking cleanly—steady speed and a tight track line beat aggressive cadence changes.", "cadence", ("any", "shallow")),
        ("Run it along banks, over cover tops, and beside shade lines; it's a 'lane' presentation.", "targets", ("shade", "wood", "grass", "any")),
        ("Calm/clear: longer casts and subtle turns; let it glide through the strike zone.", "gear", ("calm", "clear")),
        ("Wind: prioritize protected lanes where you can maintain a consistent wake.", "targets", ("windy",)),
    ],

    # --- Topwater - Precision / Vertical Surface Work ---
    "hollow body frog": [
        ("Work it methodically across mats and pockets—pause in the holes longer than feels natural.", "cadence", ("grass", "pads", "any")),
        ("After a blowup, re-cast immediately and slow down; follow-ups happen fast.", "discipline", ("any",)),
        ("Bright skies: focus on the thickest cover and the deepest shade pockets.", "targets", ("bright", "shade", "grass", "pads")),
        ("Wind: fish the protected side of mats/pads where you can keep control.", "positioning", ("windy",)),
    ],
    "popping frog": [
        ("Pop-pop-pause in pockets and along edges—let the pause be the trigger.", "cadence", ("grass", "pads", "any")),
        ("Target the clean edges and openings; precision beats speed.", "targets", ("any",)),
        ("Lower light: cover more pockets faster; fish roam and commit more readily.", "positioning", ("low_light",)),
        ("Bright: slow down and work the best shade pockets thoroughly.", "cadence", ("bright", "shade")),
    ],
    "popper": [
        ("Pop and pause near targets—most bites happen after the bait sits still.", "cadence", ("any",)),
        ("Fish shade edges, dock corners, and isolated cover with repeatable casts.", "targets", ("shade", "docks", "wood", "any")),
        ("Calm/clear: keep it subtle and let it sit longer.", "gear", ("calm", "clear")),
        ("Windy: tuck into protected pockets where you can maintain cadence and see strikes.", "targets", ("windy",)),
    ],
}