"use client";

import { useEffect, useMemo, useState } from "react";

type AppUser = { id: string; email: string | null; created_at: string };
type Screen = { id: string; name: string; user_id: string; created_at: string };

export default function Page() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [screenName, setScreenName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const screenQuery = useMemo(
    () => (userId ? `?userId=${encodeURIComponent(userId)}` : ""),
    [userId]
  );

  const load = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [usersRes, screensRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch(`/api/admin/screens${screenQuery}`)
      ]);

      if (!usersRes.ok || !screensRes.ok) {
        throw new Error("Failed to load data.");
      }

      const usersPayload = await usersRes.json();
      const screensPayload = await screensRes.json();
      setUsers(usersPayload.users ?? []);
      setScreens(screensPayload.screens ?? []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [screenQuery]);

  const createUser = async () => {
    setStatus(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() || null })
    });

    if (!res.ok) {
      setStatus("Failed to create user.");
      return;
    }

    const payload = await res.json();
    setUserId(payload.userId);
    setEmail("");
    await load();
  };

  const createScreen = async () => {
    if (!userId) {
      setStatus("Pick a user to create screens.");
      return;
    }

    const res = await fetch("/api/admin/screens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: screenName || "Untitled screen" })
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
          <h2>Active User</h2>
          <button type="button" className="ghost" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="row">
          <select value={userId} onChange={(event) => setUserId(event.target.value)}>
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email ? `${user.email} (${user.id.slice(0, 8)})` : user.id}
              </option>
            ))}
          </select>
          <div className="hint">No user yet? Create one below.</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Create User</h2>
        </div>
        <div className="row">
          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="button" onClick={createUser}>
            Create user
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Create Screen</h2>
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
