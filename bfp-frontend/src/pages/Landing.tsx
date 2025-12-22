import React from "react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="container" style={{ paddingTop: 44, paddingBottom: 60 }}>
      {/* Hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <h1 className="h1" style={{ fontSize: "2.5em", lineHeight: 1.1 }}>
          Clarity, before you ever make the first cast.
        </h1>
        <p
          className="p"
          style={{ marginTop: 20, fontSize: "1.1em", opacity: 0.9 }}
        >
          Bass Fishing Plans builds a location-specific bass fishing plan for
          the water you're fishing today — based on current conditions, seasonal
          timing, and how bass are likely positioned — distilled into one clear
          approach you can commit to.
        </p>
        <div style={{ marginTop: 32 }}>
          <Link
            className="btn primary"
            to="/preview"
            style={{ fontSize: "1.1em", padding: "14px 32px" }}
          >
            Get your plan
          </Link>
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: "0.95em" }}>
          Generated on demand. No noise. No bait roulette.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* The Reality of Bass Fishing */}
      <section className="grid2">
        <div>
          <h2 className="h2">The Reality of Bass Fishing</h2>
          <p className="p" style={{ marginTop: 14 }}>
            You already know how to catch bass.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            You've checked the weather. You've watched the forecast shift.
            You've rigged rods, tied backups, and thought through how the day
            should set up.
          </p>
          <p className="p" style={{ marginTop: 14 }}>
            That's not the hard part.
          </p>
        </div>
        <div className="card">
          <p className="p" style={{ fontSize: "1.05em" }}>
            The hard part is showing up to a big body of water with too many
            reasonable options — and deciding which ones deserve your time right
            now.
          </p>
          <p className="p" style={{ marginTop: 14, fontWeight: 500 }}>
            Bass Fishing Plans doesn't give you more ideas.
            <br />
            It narrows the water.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* What a Plan Actually Does */}
      <section>
        <h2 className="h2" style={{ textAlign: "center" }}>
          What a Plan Actually Does
        </h2>
        <p
          className="p"
          style={{
            marginTop: 14,
            textAlign: "center",
            maxWidth: 640,
            margin: "14px auto 0",
          }}
        >
          Each plan is built for one place, one day — not a generic "today's
          bait."
        </p>

        <div className="grid2" style={{ marginTop: 40 }}>
          <div className="card">
            <div className="kicker">A Bass Fishing Plan gives you:</div>
            <ul style={{ marginTop: 14, paddingLeft: 20, lineHeight: 1.8 }}>
              <li className="p">
                A primary presentation built around how bass are most likely
                positioned and feeding right now
              </li>
              <li className="p">
                A counter presentation for a different behavior or depth zone if
                bass aren't doing exactly what you expect
              </li>
              <li className="p">
                Specific lure choices and colors, chosen to express the
                presentation — not random picks
              </li>
              <li className="p">
                Target areas that matter: points, edges, transitions, and zones
                worth spending time on
              </li>
              <li className="p">
                How to fish it — cadence, positioning, and timing
              </li>
              <li className="p">
                Gear guidance that fits the plan without overloading you
              </li>
              <li className="p">
                Context and reasoning, so you understand why it makes sense
              </li>
            </ul>
          </div>
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p className="p" style={{ fontSize: "1.1em", fontWeight: 500 }}>
                The goal isn't variety.
              </p>
              <p
                className="p"
                style={{ fontSize: "1.1em", fontWeight: 500, marginTop: 8 }}
              >
                It's commitment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Narrowing the Water */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2" style={{ textAlign: "center" }}>
          Narrowing the Water
        </h2>
        <p className="p" style={{ marginTop: 14 }}>
          Most anglers don't struggle because they lack options. They struggle
          because everything could work.
        </p>
        <div className="card" style={{ marginTop: 24 }}>
          <p className="p" style={{ fontSize: "1.05em" }}>
            A good plan does two things:
          </p>
          <ol style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">
              It cuts the lake down to water that actually matters today
            </li>
            <li className="p">
              It gives you permission to fish with intent instead of
              second-guessing
            </li>
          </ol>
          <p className="p" style={{ marginTop: 16, fontWeight: 500 }}>
            That's how Bass Fishing Plans earns its place in your day.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* How Anglers Use It */}
      <section className="grid2">
        <div>
          <h2 className="h2">How Anglers Use It</h2>
          <p className="p" style={{ marginTop: 14 }}>
            You request a plan when you're ready to fish:
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
            <li className="p">When you arrive at the water</li>
            <li className="p">Before launching</li>
            <li className="p">Anytime you want a fresh read</li>
          </ul>
          <p className="p" style={{ marginTop: 14 }}>
            Nothing is pushed.
            <br />
            Nothing updates unless you ask.
          </p>
        </div>
        <div className="card">
          <p className="p" style={{ fontSize: "1.05em" }}>
            Most anglers read the plan once, fish it, make adjustments, and
            learn as the day unfolds.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Pricing */}
      <section style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 className="h2" style={{ textAlign: "center" }}>
          Pricing
        </h2>

        <div className="card" style={{ marginTop: 32, textAlign: "center" }}>
          <div
            style={{
              fontSize: "3em",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            $15
            <span className="muted" style={{ fontSize: "0.4em" }}>
              /month
            </span>
          </div>
          <p className="p" style={{ marginTop: 16, fontSize: "1.1em" }}>
            Unlimited plans, whenever you fish.
          </p>
          <p className="muted" style={{ marginTop: 12 }}>
            No picking dates.
            <br />
            No guessing when it's "worth it."
          </p>
          <div style={{ marginTop: 24 }}>
            <Link
              className="btn primary"
              to="/subscribe"
              style={{ fontSize: "1.1em", padding: "14px 32px" }}
            >
              Get your plan
            </Link>
          </div>
          <p
            className="p"
            style={{ marginTop: 20, fontSize: "0.95em", fontStyle: "italic" }}
          >
            The cost of one lure gets you clarity every time you're on the
            water.
          </p>
        </div>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Who This Is For */}
      <section style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h2" style={{ textAlign: "center" }}>
          Who This Is For
        </h2>
        <p className="p" style={{ marginTop: 14 }}>
          Bass Fishing Plans is for anglers who:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 20, lineHeight: 1.7 }}>
          <li className="p">Want to fish with intention, not impulse</li>
          <li className="p">
            Care more about positioning and behavior than cycling baits
          </li>
          <li className="p">Appreciate restraint over endless options</li>
          <li className="p">
            Want to learn why things work, not just what to throw
          </li>
        </ul>
        <p className="p" style={{ marginTop: 20, fontStyle: "italic" }}>
          Whether you already understand seasonal movement — or you want to
          understand it better — this gives you a disciplined starting point.
        </p>
      </section>

      <hr style={{ margin: "60px 0" }} />

      {/* Final CTA */}
      <section style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <h2 className="h2" style={{ fontSize: "2em" }}>
          Have clarity before you ever launch the boat.
          <br />
          Fish with intent.
        </h2>
        <div style={{ marginTop: 32 }}>
          <Link
            className="btn primary"
            to="/preview"
            style={{ fontSize: "1.2em", padding: "16px 40px" }}
          >
            Get your plan
          </Link>
        </div>
      </section>
    </div>
  );
}
