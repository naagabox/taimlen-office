"use client"

import { useState, useEffect } from "react"

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function toISO(d) { return d.toISOString().slice(0, 10); }
function parseDate(s) { const [y, m, d] = s.split("-"); return new Date(+y, +m - 1, +d); }
function fmtUS(iso) {
  const d = parseDate(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}
function fmtUSShort(d) { return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; }
function isWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }
const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"]
function uid() { return Math.random().toString(36).slice(2, 9); }

function taskEnd(t) { return toISO(addDays(parseDate(t.start), t.days - 1)); }
function dayInRange(day, t) {
  const s = parseDate(t.start), e = parseDate(taskEnd(t));
  return day >= s && day <= e;
}

function buildTimeline(tasks) {
  if (!tasks.length) return [];
  let min = tasks.reduce((a, t) => (t.start < a ? t.start : a), tasks[0].start);
  let max = tasks.reduce((a, t) => { const e = taskEnd(t); return e > a ? e : a; }, "");
  const days = [];
  let cur = parseDate(min);
  const end = parseDate(max);
  while (cur <= end) { days.push(new Date(cur)); cur = addDays(cur, 1); }
  return days;
}

function computePhases(tasks) {
  const map = {};
  tasks.forEach(t => { if (!map[t.phase]) map[t.phase] = []; map[t.phase].push(t); });
  return Object.entries(map).map(([name, ts]) => ({
    name,
    tasks: ts,
    start: ts.reduce((a, t) => (t.start < a ? t.start : a), ts[0].start),
    end: ts.reduce((a, t) => { const e = taskEnd(t); return e > a ? e : a; }, ""),
  }));
}

const SAMPLE = [
  { id: "1",  phase: "Phase 1", task: "Task 1", lead: "Ali",   progress: 100, start: "2024-04-01", days: 5 },
  { id: "2",  phase: "Phase 1", task: "Task 2", lead: "Budi",  progress: 50,  start: "2024-04-06", days: 3 },
  { id: "3",  phase: "Phase 1", task: "Task 3", lead: "",      progress: 0,   start: "2024-04-09", days: 1 },
  { id: "4",  phase: "Phase 1", task: "Task 4", lead: "Citra", progress: 0,   start: "2024-04-10", days: 5 },
  { id: "5",  phase: "Phase 2", task: "Task 1", lead: "Dito",  progress: 25,  start: "2024-04-15", days: 5 },
  { id: "6",  phase: "Phase 2", task: "Task 2", lead: "Eka",   progress: 10,  start: "2024-04-20", days: 3 },
  { id: "7",  phase: "Phase 2", task: "Task 3", lead: "",      progress: 0,   start: "2024-04-23", days: 2 },
  { id: "8",  phase: "Phase 2", task: "Task 4", lead: "Fani",  progress: 0,   start: "2024-04-25", days: 5 },
  { id: "9",  phase: "Phase 3", task: "Task 1", lead: "Gani",  progress: 20,  start: "2024-04-30", days: 3 },
  { id: "10", phase: "Phase 3", task: "Task 2", lead: "",      progress: 0,   start: "2024-05-03", days: 2 },
  { id: "11", phase: "Phase 3", task: "Task 3", lead: "Hani",  progress: 0,   start: "2024-05-05", days: 4 },
  { id: "12", phase: "Phase 3", task: "Task 4", lead: "",      progress: 0,   start: "2024-05-09", days: 2 },
];

const TH = {
  fontSize: 11, fontWeight: 700, color: "#5C7A8A", textTransform: "uppercase",
  letterSpacing: "0.05em", padding: "6px 8px", background: "#D6EEF0",
  border: "0.5px solid #B0D8DD", whiteSpace: "nowrap", textAlign: "left",
}
const TD = {
  fontSize: 12, padding: "6px 8px", border: "0.5px solid #E8EAED",
  verticalAlign: "middle", whiteSpace: "nowrap",
}
const DAY_W = 20
const LEFT_COLS = [
  { key: "task",     label: "TASK",     w: 140 },
  { key: "lead",     label: "LEAD",     w: 100 },
  { key: "progress", label: "PROGRESS", w: 120 },
  { key: "start",    label: "START",    w: 80  },
  { key: "days",     label: "DAYS",     w: 50  },
  { key: "end",      label: "END",      w: 80  },
]

function ProgressBar({ value }) {
  return (
    <div style={{ position: "relative", height: 16, background: "#E8EAF6", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, width: `${value}%`, background: "#7C83D3", borderRadius: 3 }} />
      {value > 0 && (
        <span style={{ position: "absolute", right: 4, top: 0, lineHeight: "16px", fontSize: 10, color: "#3C3F99", fontWeight: 600 }}>
          {value}%
        </span>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 420, maxWidth: "92vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#999", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TaskForm({ initial, phases, onSave, onDelete, onClose }) {
  const [f, setF] = useState(initial || { phase: phases[0] || "", task: "", lead: "", progress: 0, start: "", days: 1 })
  const [err, setErr] = useState("")
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  function save() {
    if (!f.phase.trim() || !f.task.trim() || !f.start || f.days < 1) {
      setErr("Phase, Task, Start, dan Days wajib diisi."); return;
    }
    onSave({ ...f, phase: f.phase.trim(), task: f.task.trim(), lead: f.lead.trim(), days: +f.days, progress: +f.progress })
  }

  const inp = { width: "100%", padding: "7px 9px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }
  const lbl = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4, marginTop: 12 }

  return (
    <div>
      <label style={lbl}>Phase</label>
      <input list="phase-opts" value={f.phase} onChange={e => set("phase", e.target.value)} style={inp} placeholder="cth: Phase 1" />
      <datalist id="phase-opts">{phases.map(p => <option key={p} value={p} />)}</datalist>

      <label style={lbl}>Task</label>
      <input value={f.task} onChange={e => set("task", e.target.value)} style={inp} placeholder="Nama task" />

      <label style={lbl}>Lead</label>
      <input value={f.lead} onChange={e => set("lead", e.target.value)} style={inp} placeholder="Nama penanggung jawab (opsional)" />

      <label style={lbl}>Progress — <span style={{ color: "#7C83D3", fontWeight: 700 }}>{f.progress}%</span></label>
      <input type="range" min={0} max={100} step={1} value={f.progress}
        onChange={e => set("progress", +e.target.value)}
        style={{ width: "100%", accentColor: "#7C83D3" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Start</label>
          <input type="date" value={f.start} onChange={e => set("start", e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>Days</label>
          <input type="number" min={1} value={f.days} onChange={e => set("days", e.target.value)} style={inp} />
        </div>
      </div>

      {f.start && f.days >= 1 && (
        <p style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
          End: <strong>{fmtUS(toISO(addDays(parseDate(f.start), +f.days - 1)))}</strong>
        </p>
      )}

      {err && <p style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>{err}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "space-between" }}>
        <div>
          {onDelete && (
            <button onClick={onDelete} style={{ padding: "8px 14px", border: "1px solid #FCA5A5", borderRadius: 6, background: "#fff", color: "#EF4444", fontSize: 13, cursor: "pointer" }}>
              Hapus
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", border: "1px solid #D1D5DB", borderRadius: 6, background: "#fff", fontSize: 13, cursor: "pointer" }}>Batal</button>
          <button onClick={save} style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: "#E64A19", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Simpan</button>
        </div>
      </div>
    </div>
  )
}

export default function GanttApp() {
  const [tasks, setTasks] = useState(SAMPLE)
  const [isMounted, setIsMounted] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    setIsMounted(true)
    try { 
      const s = localStorage.getItem("gantt_v2")
      if (s) setTasks(JSON.parse(s))
    } catch {}
  }, [])

  useEffect(() => { try { localStorage.setItem("gantt_v2", JSON.stringify(tasks)); } catch {} }, [tasks])

  const displayTasks = isMounted ? tasks : SAMPLE

  const timeline = buildTimeline(displayTasks)
  const phases = computePhases(displayTasks)
  const phaseNames = phases.map(p => p.name)

  function saveTask(f, id) {
    if (id) setTasks(ts => ts.map(t => t.id === id ? { ...t, ...f } : t))
    else setTasks(ts => [...ts, { ...f, id: uid() }])
    setModal(null)
  }
  function deleteTask(id) {
    setTasks(ts => ts.filter(t => t.id !== id))
    setModal(null); setDeleteConfirm(null)
  }

  const weekGroups = []
  timeline.forEach((day, i) => {
    if (day.getDay() === 1 || i === 0) weekGroups.push({ date: fmtUSShort(day), span: 1 })
    else if (weekGroups.length) weekGroups[weekGroups.length - 1].span++
  })

  const dayTD = (day, filled, isPhase) => {
    const we = isWeekend(day)
    let bg = we ? "#FFF3E0" : "#fff"
    if (filled) bg = isPhase ? "#BF360C" : "#E64A19"
    return (
      <td key={day.toISOString()} style={{
        width: DAY_W, minWidth: DAY_W, maxWidth: DAY_W,
        background: bg, border: "0.5px solid " + (we && !filled ? "#FFCCBC" : "#F3E5F5"),
        padding: 0, height: isPhase ? 28 : 32,
      }} />
    )
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#F4F6F9", minHeight: "100vh" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>Gantt of Goals</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>
            {displayTasks.length} tasks · {phases.length} phases · {timeline.length} hari
          </p>
        </div>
        <button onClick={() => setModal({ type: "add" })}
          style={{ padding: "8px 18px", background: "#E64A19", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Tambah Task
        </button>
      </div>

      <div style={{ margin: 16, background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", tableLayout: "fixed",
            minWidth: LEFT_COLS.reduce((a, c) => a + c.w, 0) + timeline.length * DAY_W }}>
            <colgroup>
              {LEFT_COLS.map(c => <col key={c.key} style={{ width: c.w }} />)}
              {timeline.map((_, i) => <col key={i} style={{ width: DAY_W }} />)}
            </colgroup>

            <thead>
              <tr style={{ background: "#D6EEF0" }}>
                {LEFT_COLS.map(c => <th key={c.key} style={{ ...TH, background: "#D6EEF0" }} rowSpan={3}>{c.label}</th>)}
                {weekGroups.map((wg, i) => (
                  <th key={i} colSpan={wg.span} style={{ ...TH, textAlign: "center", borderLeft: "1px solid #B0D8DD", fontSize: 10, padding: "4px 2px" }}>
                    {wg.date}
                  </th>
                ))}
              </tr>
              <tr style={{ background: "#D6EEF0" }}>
                {timeline.map(day => (
                  <th key={day.toISOString()} style={{ ...TH, textAlign: "center", padding: "2px 0", fontSize: 10, width: DAY_W, background: isWeekend(day) ? "#FFF3E0" : "#D6EEF0" }}>
                    {day.getDate()}
                  </th>
                ))}
              </tr>
              <tr style={{ background: "#D6EEF0" }}>
                {timeline.map(day => (
                  <th key={day.toISOString()} style={{ ...TH, textAlign: "center", padding: "2px 0", fontSize: 10, width: DAY_W, background: isWeekend(day) ? "#FFF3E0" : "#D6EEF0" }}>
                    {DAY_LETTER[day.getDay()]}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {phases.map(phase => {
                const isCol = collapsed[phase.name]
                const phaseStart = parseDate(phase.start)
                const phaseEnd = parseDate(phase.end)

                return [
                  <tr key={`ph-${phase.name}`}
                    style={{ background: "#FFF8E1", cursor: "pointer" }}
                    onClick={() => setCollapsed(c => ({ ...c, [phase.name]: !c[phase.name] }))}>
                    <td style={{ ...TD, fontWeight: 800, fontSize: 13, color: "#E64A19", background: "#FFF8E1" }}>
                      <span style={{ marginRight: 6, display: "inline-block", transition: "transform .2s", transform: isCol ? "rotate(-90deg)" : "rotate(0)" }}>▼</span>
                      {phase.name}
                    </td>
                    <td style={{ ...TD, background: "#FFF8E1" }}></td>
                    <td style={{ ...TD, background: "#FFF8E1" }}></td>
                    <td style={{ ...TD, fontWeight: 700, background: "#FFF8E1", fontSize: 11 }}>{fmtUS(phase.start)}</td>
                    <td style={{ ...TD, background: "#FFF8E1" }}></td>
                    <td style={{ ...TD, fontWeight: 700, background: "#FFF8E1", fontSize: 11 }}>{fmtUS(phase.end)}</td>
                    {timeline.map(day => dayTD(day, day >= phaseStart && day <= phaseEnd, true))}
                  </tr>,

                  ...(!isCol ? phase.tasks.map(t => (
                    <tr key={t.id} style={{ background: "#fff" }}
                      onClick={() => setModal({ type: "edit", task: t })}
                      onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      style={{ cursor: "pointer" }}>
                      <td style={{ ...TD, paddingLeft: 24, color: "#374151" }}>{t.task}</td>
                      <td style={{ ...TD, color: "#6B7280" }}>{t.lead}</td>
                      <td style={{ ...TD }}><ProgressBar value={t.progress} /></td>
                      <td style={{ ...TD, color: "#374151", fontSize: 11 }}>{fmtUS(t.start)}</td>
                      <td style={{ ...TD, color: "#374151", textAlign: "center" }}>{t.days}</td>
                      <td style={{ ...TD, color: "#374151", fontSize: 11 }}>{fmtUS(taskEnd(t))}</td>
                      {timeline.map(day => dayTD(day, dayInRange(day, t), false))}
                    </tr>
                  )) : [])
                ]
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === "add" && (
        <Modal title="Tambah Task Baru" onClose={() => setModal(null)}>
          <TaskForm phases={phaseNames} onSave={f => saveTask(f, null)} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === "edit" && (
        <Modal title="Edit Task" onClose={() => setModal(null)}>
          <TaskForm
            initial={modal.task}
            phases={phaseNames}
            onSave={f => saveTask(f, modal.task.id)}
            onDelete={() => setDeleteConfirm(modal.task.id)}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Hapus Task?" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: "#374151", fontSize: 14, marginBottom: 20 }}>
            Yakin ingin menghapus task ini? Tindakan tidak bisa dibatalkan.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 18px", border: "1px solid #D1D5DB", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>Batal</button>
            <button onClick={() => deleteTask(deleteConfirm)} style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: "#EF4444", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Hapus</button>
          </div>
        </Modal>
      )}
    </div>
  )
}