"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AppUser = { id: string; email: string | null; created_at: string };
type Screen = { id: string; name: string; user_id: string; created_at: string };
type Scene = { id: string; name: string; user_id: string; created_at: string };
type Monitor = { id: string; name: string; user_id: string; device_token: string; created_at: string };
type MediaAsset = { id: string; file_name: string; file_url: string; user_id: string; created_at: string };

type DashboardData = {
  users: AppUser[];
  screens: Screen[];
  scenes: Scene[];
  monitors: Monitor[];
  media: MediaAsset[];
};

const emptyData: DashboardData = {
  users: [],
  screens: [],
  scenes: [],
  monitors: [],
  media: []
};

function randomToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `monitor-${Date.now()}`;
}

export default function Page() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [screenName, setScreenName] = useState("");
  const [sceneName, setSceneName] = useState("");
  const [monitorName, setMonitorName] = useState("");
  const [deviceToken, setDeviceToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const userFilterQuery = useMemo(() => (userId ? `?userId=${encodeURIComponent(userId)}` : ""), [userId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setStatus(null);

    try {
      const [usersRes, screensRes, scenesRes, monitorsRes, mediaRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch(`/api/admin/screens${userFilterQuery}`),
        fetch(`/api/admin/scenes${userFilterQuery}`),
        fetch(`/api/admin/monitors${userFilterQuery}`),
        fetch(`/api/admin/media${userFilterQuery}`)
      ]);

      if (![usersRes, screensRes, scenesRes, monitorsRes, mediaRes].every((res) => res.ok)) {
        throw new Error("Failed to load dashboard data.");
      }

      const users = (await usersRes.json()).users ?? [];
      const screens = (await screensRes.json()).screens ?? [];
      const scenes = (await scenesRes.json()).scenes ?? [];
      const monitors = (await monitorsRes.json()).monitors ?? [];
      const media = (await mediaRes.json()).media ?? [];

      setData({ users, screens, scenes, monitors, media });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [userFilterQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    await loadData();
    setStatus("User created.");
  };

  const createScreen = async () => {
    if (!userId) {
      setStatus("Set a user id before creating screens.");
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
    await loadData();
  };

  const createScene = async () => {
    if (!userId) {
      setStatus("Set a user id before creating scenes.");
      return;
    }

    const res = await fetch("/api/admin/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: sceneName || "Untitled scene" })
    });

    if (!res.ok) {
      setStatus("Failed to create scene.");
      return;
    }

    setSceneName("");
    await loadData();
  };

  const createMonitor = async () => {
    if (!userId) {
      setStatus("Set a user id before creating monitors.");
      return;
    }

    const token = deviceToken || randomToken();
    const res = await fetch("/api/admin/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name: monitorName || "New monitor", deviceToken: token })
    });

    if (!res.ok) {
      setStatus("Failed to create monitor.");
      return;
    }

    setMonitorName("");
    setDeviceToken("");
    await loadData();
  };

  return (
    <main>
      <header>
        <div className="badge">media-admin • draft UI</div>
        <h1>Media Admin Console</h1>
        <p>
          This is a lightweight admin surface for the API you deployed. Create users, screens, scenes, and
          monitors, then wire publish flows and playback on top.
        </p>
      </header>

      <section className="grid">
        <div className="card">
          <h3>Users</h3>
          <p>{data.users.length} total</p>
        </div>
        <div className="card">
          <h3>Screens</h3>
          <p>{data.screens.length} total</p>
        </div>
        <div className="card">
          <h3>Scenes</h3>
          <p>{data.scenes.length} total</p>
        </div>
        <div className="card">
          <h3>Monitors</h3>
          <p>{data.monitors.length} total</p>
        </div>
      </section>

      <section className="section card">
        <h2>Active Workspace</h2>
        <div className="form-row">
          <input
            placeholder="Current user id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
          <button type="button" className="secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="mono">Leave user id empty to see all records.</div>
      </section>

      <section className="section">
        <h2>Create User</h2>
        <div className="form-row">
          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="button" onClick={createUser}>Create user</button>
        </div>
      </section>

      <section className="section">
        <h2>Create Screen</h2>
        <div className="form-row">
          <input
            placeholder="Screen name"
            value={screenName}
            onChange={(event) => setScreenName(event.target.value)}
          />
          <button type="button" onClick={createScreen}>Create screen</button>
        </div>
      </section>

      <section className="section">
        <h2>Create Scene</h2>
        <div className="form-row">
          <input
            placeholder="Scene name"
            value={sceneName}
            onChange={(event) => setSceneName(event.target.value)}
          />
          <button type="button" onClick={createScene}>Create scene</button>
        </div>
      </section>

      <section className="section">
        <h2>Create Monitor</h2>
        <div className="form-row">
          <input
            placeholder="Monitor name"
            value={monitorName}
            onChange={(event) => setMonitorName(event.target.value)}
          />
          <input
            placeholder="Device token (optional)"
            value={deviceToken}
            onChange={(event) => setDeviceToken(event.target.value)}
          />
          <button type="button" onClick={createMonitor}>Create monitor</button>
        </div>
      </section>

      {status ? (
        <section className="section card">
          <div>{status}</div>
        </section>
      ) : null}

      <section className="section grid">
        <div className="card">
          <h3>Recent Screens</h3>
          <div className="list">
            {data.screens.slice(0, 5).map((screen) => (
              <div className="list-item" key={screen.id}>
                <strong>{screen.name}</strong>
                <span className="mono">{screen.id}</span>
              </div>
            ))}
            {!data.screens.length && <div className="list-item">No screens yet.</div>}
          </div>
        </div>

        <div className="card">
          <h3>Recent Scenes</h3>
          <div className="list">
            {data.scenes.slice(0, 5).map((scene) => (
              <div className="list-item" key={scene.id}>
                <strong>{scene.name}</strong>
                <span className="mono">{scene.id}</span>
              </div>
            ))}
            {!data.scenes.length && <div className="list-item">No scenes yet.</div>}
          </div>
        </div>

        <div className="card">
          <h3>Recent Monitors</h3>
          <div className="list">
            {data.monitors.slice(0, 5).map((monitor) => (
              <div className="list-item" key={monitor.id}>
                <strong>{monitor.name}</strong>
                <span className="mono">{monitor.device_token}</span>
              </div>
            ))}
            {!data.monitors.length && <div className="list-item">No monitors yet.</div>}
          </div>
        </div>

        <div className="card">
          <h3>Recent Media</h3>
          <div className="list">
            {data.media.slice(0, 5).map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.file_name}</strong>
                <span className="mono">{item.file_url}</span>
              </div>
            ))}
            {!data.media.length && <div className="list-item">No media yet.</div>}
          </div>
        </div>
      </section>

      <footer>
        Next steps: add auth, implement upload URL signing, and wire draft/publish flows.
      </footer>
    </main>
  );
}
