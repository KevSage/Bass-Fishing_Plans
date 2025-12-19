import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { About } from "./pages/About";
import { Subscribe } from "./pages/Subscribe";
import { Preview } from "./pages/Preview";
import { Members } from "./pages/Members";

function TopBar() {
  return (
    <div style={{ borderBottom: "1px solid rgba(238,242,246,0.10)" }}>
      <div
        className="container"
        style={{
          paddingTop: 14,
          paddingBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", fontWeight: 600 }}>
          BFP
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            to="/about"
            style={{ textDecoration: "none" }}
            className="muted"
          >
            About
          </Link>
          <Link
            to="/members"
            style={{ textDecoration: "none" }}
            className="muted"
          >
            Members
          </Link>
          <Link to="/subscribe" className="btn">
            Subscribe
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/members" element={<Members />} />
      </Routes>
    </>
  );
}
