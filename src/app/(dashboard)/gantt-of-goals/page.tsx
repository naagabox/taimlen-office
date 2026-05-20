"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

function addDays(date: Date | string, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function toISO(d: Date): string { return d.toISOString().slice(0, 10); }
function parseDate(s: string): Date { const [y, m, d] = s.split("-"); return new Date(+y, +m - 1, +d); }
function fmtUS(iso: string): string {
  const d = parseDate(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}
function fmtMonthYear(d: Date): string { return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function isWeekend(d: Date): boolean { return d.getDay() === 0 || d.getDay() === 6; }
const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"]
function uid() { return Math.random().toString(36).slice(2, 9); }

interface GanttTask {
  id: string
  phase: string
  task: string
  lead: string
  progress: number
  start: string
  days: number
}

function taskEnd(t: GanttTask): string { return toISO(addDays(parseDate(t.start), t.days - 1)); }
function dayInRange(day: Date, t: GanttTask): boolean {
  const s = parseDate(t.start), e = parseDate(taskEnd(t));
  return day >= s && day <= e;
}

function buildTimeline(tasks: GanttTask[]): Date[] {
  const today = new Date();
  const todayPlus20 = addDays(today, 20);

  if (!tasks.length) {
    const days: Date[] = [];
    let cur = new Date(today);
    while (cur <= todayPlus20) { days.push(new Date(cur)); cur = addDays(cur, 1); }
    return days;
  }

  let min = tasks.reduce((a, t) => (t.start < a ? t.start : a), tasks[0].start);
  let max = tasks.reduce((a, t) => { const e = taskEnd(t); return e > a ? e : a; }, "");

  const maxDate = parseDate(max);

  if (todayPlus20 > maxDate) max = toISO(todayPlus20);

  const days: Date[] = [];
  let cur = parseDate(min);
  const end = parseDate(max);
  while (cur <= end) { days.push(new Date(cur)); cur = addDays(cur, 1); }
  return days;
}

function computePhases(tasks: GanttTask[]) {
  const map: Record<string, GanttTask[]> = {};
  tasks.forEach(t => { if (!map[t.phase]) map[t.phase] = []; map[t.phase].push(t); });
  return Object.entries(map).map(([name, ts]) => ({
    name,
    tasks: ts,
    start: ts.reduce((a, t) => (t.start < a ? t.start : a), ts[0].start),
    end: ts.reduce((a, t) => { const e = taskEnd(t); return e > a ? e : a; }, ""),
  }));
}



const DAY_W = 20
const LEFT_COLS = [
  { key: "task",     label: "PROJECT/TASK",     w: 280, maxW: 280 },
  { key: "lead",     label: "LEAD",             w: 100 },
  { key: "progress", label: "PROGRESS",         w: 120 },
  { key: "start",    label: "START",            w: 80  },
  { key: "days",     label: "DAYS",             w: 50  },
  { key: "end",      label: "END",              w: 80  },
]

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-4 rounded-md overflow-hidden bg-primary/10">
      <div className="absolute inset-0 bg-primary rounded-md" style={{ width: `${value}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-primary-foreground">
        {value}%
      </span>
    </div>
  )
}

interface TaskFormProps {
  initial?: Partial<GanttTask>
  phases: string[]
  onSave: (task: GanttTask) => void
  onDelete?: () => void
  onClose: () => void
}

function TaskForm({ initial, phases, onSave, onDelete, onClose }: TaskFormProps) {
  const [f, setF] = useState<GanttTask>(initial 
    ? { phase: initial.phase || "", task: initial.task || "", lead: initial.lead || "", progress: initial.progress || 0, start: initial.start || "", days: initial.days || 1, id: initial.id || uid() } 
    : { id: uid(), phase: phases[0] || "", task: "", lead: "", progress: 0, start: "", days: 1 })
  const [err, setErr] = useState("")
  const set = (k: keyof GanttTask, v: string | number) => setF(p => ({ ...p, [k]: v }))

  function save() {
    if (!f.phase.trim() || !f.task.trim() || !f.start || f.days < 1) {
      setErr("Phase, Task, Start, dan Days wajib diisi."); return;
    }
    onSave({ ...f, phase: f.phase.trim(), task: f.task.trim(), lead: f.lead.trim(), days: +f.days, progress: +f.progress })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phase">Phase</Label>
        <Input 
          id="phase"
          list="phase-opts" 
          value={f.phase} 
          onChange={e => set("phase", e.target.value)} 
          placeholder="cth: Phase 1" 
        />
        <datalist id="phase-opts">{phases.map(p => <option key={p} value={p} />)}</datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task">Task</Label>
        <Input 
          id="task"
          value={f.task} 
          onChange={e => set("task", e.target.value)} 
          placeholder="Nama task" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead">Lead</Label>
        <Input 
          id="lead"
          value={f.lead} 
          onChange={e => set("lead", e.target.value)} 
          placeholder="Nama penanggung jawab (opsional)" 
        />
      </div>

      <div className="space-y-2">
        <Label>
          Progress — <span className="font-bold text-primary">{f.progress}%</span>
        </Label>
        <input 
          type="range" 
          min={0} 
          max={100} 
          step={1} 
          value={f.progress}
          onChange={e => set("progress", +e.target.value)}
          className="w-full accent-primary" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start">Start</Label>
          <Input 
            id="start"
            type="date" 
            value={f.start} 
            onChange={e => set("start", e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="days">Days</Label>
          <Input 
            id="days"
            type="number" 
            min={1} 
            value={f.days} 
            onChange={e => set("days", e.target.value)} 
          />
        </div>
      </div>

      {f.start && f.days >= 1 && (
        <p className="text-sm text-muted-foreground">
          End: <strong>{fmtUS(toISO(addDays(parseDate(f.start), +f.days - 1)))}</strong>
        </p>
      )}

      {err && <p className="text-sm text-destructive">{err}</p>}

      <div className="flex justify-between pt-4">
        <div>
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive border-destructive/50 hover:text-destructive hover:bg-destructive/10">
              Hapus
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Batal</Button>
          <Button size="sm" onClick={save}>Simpan</Button>
        </div>
      </div>
    </div>
  )
}

export default function GanttApp() {
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<{ type: string; task?: GanttTask } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    try { 
      const s = localStorage.getItem("gantt_v2")
      if (s) setTasks(JSON.parse(s))
    } catch {}
  }, [])

  useEffect(() => { try { localStorage.setItem("gantt_v2", JSON.stringify(tasks)); } catch {} }, [tasks])

  const displayTasks = tasks
  const todayStr = toISO(new Date())

  const timeline = buildTimeline(displayTasks)
  const phases = computePhases(displayTasks)
  const phaseNames = phases.map(p => p.name)

  function saveTask(f: GanttTask, id?: string) {
    if (id) setTasks(ts => ts.map(t => t.id === id ? { ...t, ...f } : t))
    else setTasks(ts => [...ts, { ...f, id: uid() }])
    setModal(null)
  }
  function deleteTask(id: string) {
    setTasks(ts => ts.filter(t => t.id !== id))
    setModal(null); setDeleteConfirm(null)
  }

  const weekGroups: { date: string; span: number }[] = []
  let weekCounter = 0
  let prevMonth: number | null = null
  timeline.forEach((day, i) => {
    const currentMonth = day.getMonth()
    if (day.getDay() === 1 || i === 0) {
      if (currentMonth !== prevMonth) {
        weekCounter = 1
        prevMonth = currentMonth
      } else {
        weekCounter++
      }
      weekGroups.push({ date: `W${weekCounter} ${fmtMonthYear(day)}`, span: 1 })
    }
    else if (weekGroups.length) weekGroups[weekGroups.length - 1].span++
  })

  const thBaseClass = "text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center p-1.5 border border-border"
  const tdBaseClass = "text-sm p-1.5 border border-border text-center align-middle whitespace-nowrap"

  const dayTD = (day: Date, filled: boolean, isPhase: boolean) => {
    const we = isWeekend(day)
    const dayDate = parseDate(toISO(day))
    const todayDate = parseDate(todayStr)
    const dayBeforeToday = addDays(todayDate, -1)
    const isDayBeforeToday = toISO(dayDate) === toISO(dayBeforeToday)
    let bgClass = we 
      ? (isMounted && theme === "dark" ? "bg-orange-950/50" : "bg-orange-50") 
      : ""
    if (filled) bgClass = isPhase ? "bg-orange-700" : "bg-orange-500"
    
    const borderClass = "border-l border-border border-r border-border"
    
    return (
      <td 
        key={day.toISOString()} 
        className={`w-5 min-w-5 max-w-5 p-0 ${bgClass} ${borderClass} relative`}
        style={{ height: isPhase ? 28 : 32 }}
      >
        {isDayBeforeToday && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 z-10" />}
      </td>
    )
  }

  return (
    <div className="min-h-screen font-sans">
      <Card className="m-4 border-border flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b shrink-0">
          <div>
            <CardTitle className="text-lg font-bold">Gantt of Goals</CardTitle>
            {displayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">Belum ada project dibuat</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {displayTasks.length} tasks · {phases.length} phases · {timeline.length} hari
              </p>
            )}
          </div>
          <Button onClick={() => setModal({ type: "add" })} size="sm">
            + Tambah Task
          </Button>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col" style={{ marginTop: "-17px", marginBottom: "-17px" }}>
          <div className="overflow-auto flex-1">
            <Table style={{ minWidth: LEFT_COLS.reduce((a, c) => a + c.w, 0) + timeline.length * DAY_W }}>
            <colgroup>
              {LEFT_COLS.map(c => <col key={c.key} style={{ width: c.w }} />)}
              {timeline.map((_, i) => <col key={i} style={{ width: DAY_W }} />)}
            </colgroup>

            <TableHeader className="sticky top-0 z-20">
              <TableRow className="bg-primary/5">
                {LEFT_COLS.map(c => (
                  <TableHead key={c.key} rowSpan={3} className={`${thBaseClass} text-left max-w-[280px] whitespace-normal`} style={{ textAlign: c.key === "task" ? "left" : "center" }}>
                    {c.label}
                  </TableHead>
                ))}
                {weekGroups.map((wg, i) => (
                  <TableHead key={i} colSpan={wg.span} className={`${thBaseClass}`}>
                    {wg.date}
                  </TableHead>
                ))}
              </TableRow>
<TableRow className="bg-primary/5">
                {timeline.map(day => {
                  const dayDate = parseDate(toISO(day))
                  const todayDate = parseDate(todayStr)
                  const dayBeforeToday = addDays(todayDate, -1)
                  const isDayBeforeToday = toISO(dayDate) === toISO(dayBeforeToday)
                  return (
                  <TableHead 
                    key={day.toISOString()} 
                    className={`${thBaseClass} p-0.5 text-[10px] w-5 relative`}
                    style={{ 
                      background: isWeekend(day) 
                        ? (isMounted && theme === "dark" ? "#451a03" : "#FFF3E0") 
                        : undefined
                    }}
                  >
                    {DAY_LETTER[day.getDay()]}
                    {isDayBeforeToday && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 z-10" />}
                  </TableHead>
                )})}
              </TableRow>
<TableRow className="bg-primary/5">
                {timeline.map(day => {
                  const dayDate = parseDate(toISO(day))
                  const todayDate = parseDate(todayStr)
                  const dayBeforeToday = addDays(todayDate, -1)
                  const isDayBeforeToday = toISO(dayDate) === toISO(dayBeforeToday)
                  return (
                  <TableHead 
                    key={day.toISOString()} 
                    className={`${thBaseClass} p-0.5 text-[10px] w-5 relative`}
                    style={{ 
                      background: isWeekend(day) 
                        ? (isMounted && theme === "dark" ? "#451a03" : "#FFF3E0") 
                        : undefined
                    }}
                  >
                    {day.getDate()}
                    {isDayBeforeToday && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 z-10" />}
                  </TableHead>
                )})}
              </TableRow>
            </TableHeader>

            <TableBody>
              {phases.map(phase => {
                const isCol = collapsed[phase.name]
                const phaseStart = parseDate(phase.start)
                const phaseEnd = parseDate(phase.end)

                return [
                  <TableRow 
                    key={`ph-${phase.name}`}
                    className="group cursor-pointer bg-orange-50/50 dark:bg-orange-950/30 hover:bg-orange-100/50 dark:hover:bg-orange-950/50 [&amp;_td:first-child]:sticky [&amp;_td:first-child]:left-0 [&amp;_td:first-child]:z-10 [&amp;_td:first-child]:shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
                    onClick={() => setCollapsed(c => ({ ...c, [phase.name]: !c[phase.name] }))}
                  >
                    <TableCell className="font-extrabold text-sm text-orange-600 dark:text-orange-400 text-left bg-orange-50/50 dark:bg-orange-950/30 border-l border-border max-w-[280px] truncate group-hover:whitespace-normal group-hover:overflow-visible">
                      <span className={`inline-block mr-1.5 transition-transform ${isCol ? "-rotate-90" : ""}`}>▼</span>
                      {phase.name}
                    </TableCell>
                    <TableCell className="bg-orange-50/50 dark:bg-orange-950/30" />
                    <TableCell className="bg-orange-50/50 dark:bg-orange-950/30" />
                    <TableCell className="font-bold text-xs text-muted-foreground bg-orange-50/50 dark:bg-orange-950/30">{fmtUS(phase.start)}</TableCell>
                    <TableCell className="bg-orange-50/50 dark:bg-orange-950/30" />
                    <TableCell className="font-bold text-xs text-muted-foreground bg-orange-50/50 dark:bg-orange-950/30">{fmtUS(phase.end)}</TableCell>
                    {timeline.map(day => dayTD(day, day >= phaseStart && day <= phaseEnd, true))}
                  </TableRow>,

                  ...(!isCol ? phase.tasks.map(t => (
                    <TableRow 
                      key={t.id} 
                      className="group cursor-pointer hover:bg-muted/50 [&amp;_td:first-child]:sticky [&amp;_td:first-child]:left-0 [&amp;_td:first-child]:z-10 [&amp;_td:first-child]:shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
                      onClick={() => setModal({ type: "edit", task: t })}
                    >
                      <TableCell className="text-muted-foreground text-left font-medium border-l border-border max-w-[280px] truncate group-hover:whitespace-normal group-hover:overflow-visible">{t.task}</TableCell>
                      <TableCell className="text-muted-foreground">{t.lead}</TableCell>
                      <TableCell><ProgressBar value={t.progress} /></TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmtUS(t.start)}</TableCell>
                      <TableCell className="text-muted-foreground text-center">{t.days}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmtUS(taskEnd(t))}</TableCell>
                      {timeline.map(day => dayTD(day, dayInRange(day, t), false))}
                    </TableRow>
                  )) : [])
                ]
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modal?.type === "add"} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Task Baru</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <TaskForm 
            phases={phaseNames} 
            onSave={f => saveTask(f, undefined)} 
            onClose={() => setModal(null)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={modal?.type === "edit" && !!modal?.task} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {modal?.task && (
            <TaskForm
              initial={modal.task}
              phases={phaseNames}
              onSave={f => saveTask(f, modal.task!.id)}
              onDelete={() => setDeleteConfirm(modal.task!.id)}
              onClose={() => setModal(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Task?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Yakin ingin menghapus task ini? Tindakan tidak bisa dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteTask(deleteConfirm!)}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}