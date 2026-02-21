"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type Screen = { id: string; name: string; user_id: string; created_at: string };

type ScreenDraft = {
  id: string;
  screen_id: string;
  title: string | null;
  layout_json: LayoutJson;
};

type LayoutCell = {
  id: string;
  sceneId: string | null;
};

type LayoutJson = {
  orientation: "landscape" | "portrait";
  rows: number;
  cols: number;
  cells: LayoutCell[];
};

type Scene = { id: string; name: string; user_id: string; created_at: string };

type SceneDraft = {
  id: string;
  scene_id: string;
  data_json: SceneData;
};

type MediaAsset = {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  type: "image" | "video";
  created_at: string;
};

type TimelineItem = {
  id: string;
  type: "video" | "image" | "text";
  label: string;
  durationMs: number;
  src?: string | null;
};

type SceneData = {
  timeline: TimelineItem[];
};

function ensureGrid(layout: LayoutJson): LayoutJson {
  const rows = Math.max(1, Math.min(6, layout.rows || 1));
  const cols = Math.max(1, Math.min(6, layout.cols || 1));
  const cells: LayoutCell[] = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const id = `${r}-${c}`;
      const existing = layout.cells?.find((cell) => cell.id === id);
      cells.push({ id, sceneId: existing?.sceneId ?? null });
    }
  }

  return { ...layout, rows, cols, cells };
}

function newTimelineItem(type: TimelineItem["type"]): TimelineItem {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
    type,
    label: type === "text" ? "Headline" : type === "image" ? "Image" : "Video clip",
    durationMs: 5000,
    src: ""
  };
}

export default function ScreenEditor({ params }: { params: { screenId: string } }) {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [draft, setDraft] = useState<ScreenDraft | null>(null);
  const [layout, setLayout] = useState<LayoutJson>({
    orientation: "landscape",
    rows: 1,
    cols: 1,
    cells: [{ id: "0-0", sceneId: null }]
  });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [sceneDraft, setSceneDraft] = useState<SceneDraft | null>(null);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedCell, setSelectedCell] = useState<LayoutCell | null>(null);
  const [newSceneName, setNewSceneName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"editor" | "media">("editor");
  const [uploading, setUploading] = useState(false);

  const selectedSceneId = selectedCell?.sceneId ?? null;
  const timeline = sceneDraft?.data_json?.timeline ?? [];

  const gridTemplate = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
      gridTemplateRows: `repeat(${layout.rows}, 1fr)`
    }),
    [layout.cols, layout.rows]
  );

  const load = async () => {
    setStatus(null);
    const [screenRes, draftRes, scenesRes] = await Promise.all([
      fetch(`/api/admin/screens/${params.screenId}`),
      fetch(`/api/admin/screens/${params.screenId}/draft`),
      fetch(`/api/admin/scenes`)
    ]);

    if (!screenRes.ok || !draftRes.ok || !scenesRes.ok) {
      setStatus("Failed to load screen data.");
      return;
    }

    const screenPayload = await screenRes.json();
    const draftPayload = await draftRes.json();
    const scenesPayload = await scenesRes.json();

    setScreen(screenPayload);
    setDraft(draftPayload.draft);
    const normalized = ensureGrid(draftPayload.draft.layout_json);
    setLayout(normalized);
    setScenes(scenesPayload.scenes ?? []);
  };

  const loadMedia = async (userId?: string) => {
    if (!userId) return;
    const res = await fetch(`/api/admin/media?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      setStatus("Failed to load media library.");
      return;
    }
    const payload = await res.json();
    setMedia(payload.media ?? []);
  };

  useEffect(() => {
    load();
  }, [params.screenId]);

  useEffect(() => {
    if (screen?.user_id) {
      loadMedia(screen.user_id);
    }
  }, [screen?.user_id]);

  useEffect(() => {
    if (!selectedSceneId) {
      setSceneDraft(null);
      return;
    }

    const loadScene = async () => {
      const res = await fetch(`/api/admin/scenes/${selectedSceneId}/draft`);
      if (!res.ok) {
        setStatus("Failed to load scene draft.");
        return;
      }
      const payload = await res.json();
      setSceneDraft(payload.draft);
    };

    loadScene();
  }, [selectedSceneId]);

  const updateLayout = async (next: LayoutJson) => {
    setSaving(true);
    const res = await fetch(`/api/admin/screens/${params.screenId}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layoutJson: next })
    });
    if (!res.ok) {
      setStatus("Failed to save layout.");
    } else {
      const payload = await res.json();
      setDraft(payload.draft);
      setLayout(ensureGrid(payload.draft.layout_json));
    }
    setSaving(false);
  };

  const onGridChange = async (rows: number, cols: number) => {
    const next = ensureGrid({ ...layout, rows, cols });
    setLayout(next);
    await updateLayout(next);
  };

  const onOrientationChange = async (orientation: LayoutJson["orientation"]) => {
    const next = { ...layout, orientation };
    setLayout(next);
    await updateLayout(next);
  };

  const onAssignScene = async (cellId: string, sceneId: string | null) => {
    const nextCells = layout.cells.map((cell) =>
      cell.id === cellId ? { ...cell, sceneId } : cell
    );
    const next = { ...layout, cells: nextCells };
    setLayout(next);
    await updateLayout(next);
  };

  const createScene = async () => {
    if (!screen?.user_id) {
      setStatus("Missing screen user id.");
      return;
    }

    const res = await fetch("/api/admin/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: screen.user_id, name: newSceneName || "Untitled scene" })
    });

    if (!res.ok) {
      setStatus("Failed to create scene.");
      return;
    }

    setNewSceneName("");
    await load();
  };

  const saveTimeline = async (nextTimeline: TimelineItem[]) => {
    if (!selectedSceneId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/scenes/${selectedSceneId}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataJson: { timeline: nextTimeline } })
    });

    if (!res.ok) {
      setStatus("Failed to save timeline.");
    } else {
      const payload = await res.json();
      setSceneDraft(payload.draft);
    }
    setSaving(false);
  };

  const addTimelineItem = async (type: TimelineItem["type"]) => {
    const next = [...timeline, newTimelineItem(type)];
    await saveTimeline(next);
  };

  const updateTimelineItem = async (index: number, patch: Partial<TimelineItem>) => {
    const next = timeline.map((item, i) => (i === index ? { ...item, ...patch } : item));
    await saveTimeline(next);
  };

  const moveTimelineItem = async (index: number, direction: -1 | 1) => {
    const next = [...timeline];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    await saveTimeline(next);
  };

  const removeTimelineItem = async (index: number) => {
    const next = timeline.filter((_, i) => i !== index);
    await saveTimeline(next);
  };

  const uploadFile = async (file: File) => {
    if (!screen?.user_id) {
      setStatus("Create a user before uploading media.");
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const uploadRes = await fetch("/api/admin/media/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type })
      });

      const uploadPayload = uploadRes.ok ? await uploadRes.json() : {};
      const signedUrl = uploadPayload.signedUrl as string | undefined;
      const publicUrl = (uploadPayload.publicUrl as string | undefined) ?? "";

      if (signedUrl && !signedUrl.includes("your-storage-signed-url")) {
        const putRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file
        });

        if (!putRes.ok) {
          throw new Error("Upload failed.");
        }
      } else {
        setStatus("Upload URL is a placeholder. File metadata saved, but file not uploaded.");
      }

      const fileUrl = publicUrl || URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video" : "image";

      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: screen.user_id,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          type,
          mimeType: file.type
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save media metadata.");
      }

      await loadMedia(screen.user_id);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) {
      await uploadFile(file);
    }
    event.target.value = "";
  };

  return (
    <main className="shell">
      <header className="hero">
        <div className="pill">Screen Builder</div>
        <h1>{screen?.name ?? "Loading..."}</h1>
        <p>Configure orientation, build a fixed grid, and assign reusable scenes to each cell.</p>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={`tab ${tab === "editor" ? "active" : ""}`}
          onClick={() => setTab("editor")}
        >
          Screen editor
        </button>
        <button
          type="button"
          className={`tab ${tab === "media" ? "active" : ""}`}
          onClick={() => setTab("media")}
        >
          Media library
        </button>
      </nav>

      {tab === "editor" ? (
        <>
          <section className="panel">
            <div className="panel-header">
              <h2>Screen Layout</h2>
              <div className="muted">Draft id: {draft?.id ?? "-"}</div>
            </div>
            <div className="row">
              <label className="field">
                Orientation
                <select
                  value={layout.orientation}
                  onChange={(event) => onOrientationChange(event.target.value as LayoutJson["orientation"])}
                >
                  <option value="landscape">Landscape (16:9)</option>
                  <option value="portrait">Portrait (9:16)</option>
                </select>
              </label>
              <label className="field">
                Rows
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={layout.rows}
                  onChange={(event) => onGridChange(Number(event.target.value), layout.cols)}
                />
              </label>
              <label className="field">
                Columns
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={layout.cols}
                  onChange={(event) => onGridChange(layout.rows, Number(event.target.value))}
                />
              </label>
              <div className="status">{saving ? "Saving..." : ""}</div>
            </div>

            <div className={`grid-preview ${layout.orientation}`} style={gridTemplate}>
              {layout.cells.map((cell) => (
                <button
                  type="button"
                  key={cell.id}
                  className={`cell ${selectedCell?.id === cell.id ? "active" : ""}`}
                  onClick={() => setSelectedCell(cell)}
                >
                  <span>Cell {cell.id}</span>
                  <strong>{cell.sceneId ? "Scene linked" : "Empty"}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Assign Scene To Selected Cell</h2>
              <div className="muted">
                {selectedCell ? `Selected: ${selectedCell.id}` : "Select a cell to attach a scene."}
              </div>
            </div>
            <div className="row">
              <select
                value={selectedSceneId ?? ""}
                onChange={(event) => onAssignScene(selectedCell?.id ?? "", event.target.value || null)}
                disabled={!selectedCell}
              >
                <option value="">No scene</option>
                {scenes.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {scene.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="New scene name"
                value={newSceneName}
                onChange={(event) => setNewSceneName(event.target.value)}
              />
              <button type="button" onClick={createScene}>
                Create scene
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Scene Timeline</h2>
              <div className="muted">{selectedSceneId ? `Scene: ${selectedSceneId}` : "Select a cell."}</div>
            </div>

            <div className="timeline-actions">
              <button type="button" onClick={() => addTimelineItem("video")} disabled={!selectedSceneId}>
                Add video
              </button>
              <button type="button" onClick={() => addTimelineItem("image")} disabled={!selectedSceneId}>
                Add image
              </button>
              <button type="button" onClick={() => addTimelineItem("text")} disabled={!selectedSceneId}>
                Add text
              </button>
            </div>

            <div className="timeline">
              {timeline.map((item, index) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-row">
                    <strong>{item.type.toUpperCase()}</strong>
                    <div className="timeline-controls">
                      <button type="button" className="ghost" onClick={() => moveTimelineItem(index, -1)}>
                        Up
                      </button>
                      <button type="button" className="ghost" onClick={() => moveTimelineItem(index, 1)}>
                        Down
                      </button>
                      <button type="button" className="ghost" onClick={() => removeTimelineItem(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="row">
                    <input
                      placeholder="Label"
                      value={item.label}
                      onChange={(event) => updateTimelineItem(index, { label: event.target.value })}
                    />
                    <input
                      placeholder="Source URL"
                      value={item.src ?? ""}
                      onChange={(event) => updateTimelineItem(index, { src: event.target.value })}
                    />
                    <input
                      type="number"
                      min={500}
                      step={500}
                      value={item.durationMs}
                      onChange={(event) => updateTimelineItem(index, { durationMs: Number(event.target.value) })}
                    />
                  </div>
                  {item.type !== "text" ? (
                    <div className="row">
                      <select
                        value={item.src ?? ""}
                        onChange={(event) => updateTimelineItem(index, { src: event.target.value })}
                      >
                        <option value="">Pick from media library</option>
                        {media.filter((asset) => asset.type === item.type).map((asset) => (
                          <option key={asset.id} value={asset.file_url}>
                            {asset.file_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              ))}
              {!timeline.length && <div className="empty">No timeline items yet.</div>}
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="panel-header">
            <h2>Media Library</h2>
            <div className="muted">Upload images or videos and reuse them in timelines.</div>
          </div>
          <div className="row">
            <input type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} />
            <div className="status">{uploading ? "Uploading..." : ""}</div>
          </div>
          <div className="hint">Upload URL signing is still a placeholder until storage is wired.</div>
          <div className="media-grid">
            {media.map((asset) => (
              <div key={asset.id} className="media-card">
                <div className="media-thumb">
                  {asset.type === "image" ? (
                    <img src={asset.file_url} alt={asset.file_name} />
                  ) : (
                    <video src={asset.file_url} />
                  )}
                </div>
                <div className="media-meta">
                  <strong>{asset.file_name}</strong>
                  <div className="muted">{asset.mime_type}</div>
                </div>
              </div>
            ))}
            {!media.length && <div className="empty">No media yet.</div>}
          </div>
        </section>
      )}

      {status ? <div className="banner">{status}</div> : null}
    </main>
  );
}
