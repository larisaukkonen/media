"use client";

import { useEffect, useState } from "react";
type Screen = { id: string; name: string; user_id: string; created_at: string };

export default function Page() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [screenName, setScreenName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const screensRes = await fetch("/api/admin/screens");

      if (!screensRes.ok) {
        throw new Error("Failed to load data.");
      }

      const screensPayload = await screensRes.json();
      setScreens(screensPayload.screens ?? []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createScreen = async () => {
    const res = await fetch("/api/admin/screens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: screenName || "Untitled screen" })
    });

    if (!res.ok) {
      setStatus("Failed to create screen.");
      return;
    }

    setScreenName("");
    await load();
  };

  return (
    <main className="shell">
      <header className="hero">
        <div className="pill">Media Admin</div>
        <h1>Screen Builder</h1>
        <p>
          Create screens, set their orientation, build fixed grids, and attach reusable scenes with
          per-cell timelines.
        </p>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Create Screen</h2>
          <button type="button" className="ghost" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="row">
          <input
            placeholder="Screen name"
            value={screenName}
            onChange={(event) => setScreenName(event.target.value)}
          />
          <button type="button" onClick={createScreen}>
            Create screen
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Screens</h2>
          <div className="hint">Click a screen to edit layout and timelines.</div>
        </div>
        <div className="list">
          {screens.map((screen) => (
            <a key={screen.id} className="list-item" href={`/screens/${screen.id}`}>
              <div>
                <strong>{screen.name}</strong>
                <div className="muted">{screen.id}</div>
              </div>
              <span className="tag">Edit</span>
            </a>
          ))}
          {!screens.length && <div className="empty">No screens yet.</div>}
        </div>
      </section>

      {status ? <div className="banner">{status}</div> : null}
    </main>
  );
}
