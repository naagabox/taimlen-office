"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface GanttTask {
  id: string
  projectId: string
  phase: string
  task: string
  lead: string
  progress: number
  start: string
  days: number
}

interface SimpleProject {
  id: string
  name: string
}

const statusLabels: Record<string, string> = {
  "NOT_STARTED": "Not Started",
  "IN_PROGRESS": "In Progress",
  "FINISHED": "Finished",
}

function taskEnd(t: GanttTask): string { return toISO(addDays(parseDate(t.start), t.days - 1)); }
function dayInRange(day: Date, t: GanttTask): boolean {
  const s = parseDate(t.start), e = parseDate(taskEnd(t));
  return day >= s && day <= e;
}

function buildTimeline(tasks: GanttTask[]): Date[] {
  const today = new Date();
  const todayPlus7 = addDays(today, 7);

  if (!tasks.length) {
    const days: Date[] = [];
    let cur = new Date(today);
    while (cur <= todayPlus7) { days.push(new Date(cur)); cur = addDays(cur, 1); }
    return days;
  }

  let min = tasks.reduce((a, t) => (t.start < a ? t.start : a), tasks[0].start);
  let max = tasks.reduce((a, t) => { const e = taskEnd(t); return e > a ? e : a; }, "");

  const maxDate = parseDate(max);

  if (todayPlus7 > maxDate) max = toISO(todayPlus7);

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

export default function GanttApp() {
  const router = useRouter()
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [projects, setProjects] = useState<SimpleProject[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<{ type: string; task?: GanttTask } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchGanttData = useCallback(async () => {
    try {
      const res = await fetch("/api/gantt")
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (e) {
      console.error("Failed to fetch gantt data", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
      }
    } catch (e) {
      console.error("Failed to fetch projects", e)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
    fetchGanttData()
  }, [fetchGanttData])

  useEffect(() => {
    if (modal?.type === "add") {
      fetchProjects()
    }
  }, [modal, fetchProjects])

  const displayTasks = tasks
  const todayStr = toISO(new Date())

  const timeline = buildTimeline(displayTasks)
  const phases = computePhases(displayTasks)
  const phaseNames = phases.map(p => p.name)

  async function saveTask(f: Partial<GanttTask> & { task: string; start: string; days: number }, id?: string) {
    try {
      if (id) {
        const res = await fetch("/api/gantt", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, title: f.task, startDate: f.start, durationDays: f.days, leadName: f.lead }),
        })
        if (!res.ok) throw new Error("Update failed")
      } else {
        const res = await fetch("/api/gantt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: f.projectId,
            title: f.task,
            startDate: f.start,
            durationDays: f.days,
            leadName: f.lead,
          }),
        })
        if (!res.ok) throw new Error("Create failed")
      }
      await fetchGanttData()
      setModal(null)
    } catch (e) {
      console.error("Save task error", e)
    }
  }

  async function deleteTask(id: string) {
    try {
      const res = await fetch("/api/gantt", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error("Delete failed")
      await fetchGanttData()
      setModal(null)
      setDeleteConfirm(null)
    } catch (e) {
      console.error("Delete task error", e)
    }
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
        className={`p-0 ${bgClass} ${borderClass} relative`}
        style={{
          width: DAY_W,
          minWidth: DAY_W,
          height: isPhase ? 28 : 32
        }}
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
            {loading ? (
              <p className="text-sm text-muted-foreground mt-1">Loading...</p>
            ) : displayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">Belum ada task dengan jadwal di Gantt</p>
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
                  <TableHead key={i} colSpan={wg.span} className={`${thBaseClass}`} style={{ width: wg.span * DAY_W, minWidth: wg.span * DAY_W }}>
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
                    className={`${thBaseClass} p-0.5 text-[10px] relative`}
                    style={{
                      width: DAY_W,
                      minWidth: DAY_W,
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
                    className={`${thBaseClass} p-0.5 text-[10px] relative`}
                    style={{
                      width: DAY_W,
                      minWidth: DAY_W,
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
                    className="group cursor-pointer bg-orange-50/50 dark:bg-orange-950/30 hover:bg-orange-100/50 dark:hover:bg-orange-950/50 [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
                    onClick={() => {
                      const firstTask = phase.tasks[0]
                      if (firstTask) {
                        router.push(`/projects/${firstTask.projectId}`)
                      }
                    }}
                  >
                    <TableCell className="font-extrabold text-sm text-orange-600 dark:text-orange-400 text-left bg-orange-50/50 dark:bg-orange-950/30 border-l border-border max-w-[280px] truncate group-hover:whitespace-normal group-hover:overflow-visible">
                      <span className={`inline-block mr-1.5 transition-transform ${isCol ? "-rotate-90" : ""}`} onClick={(e) => { e.stopPropagation(); setCollapsed(c => ({ ...c, [phase.name]: !c[phase.name] })); }}>▼</span>
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
                      className="group cursor-pointer hover:bg-muted/50 [&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:shadow-[2px_0_4px_rgba(0,0,0,0.1)]"
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
          <AddTaskForm
            projects={projects}
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
            <EditTaskForm
              initial={modal.task}
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

function AddTaskForm({
  projects,
  onSave,
  onClose,
}: {
  projects: SimpleProject[]
  onSave: (f: Partial<GanttTask> & { task: string; start: string; days: number }) => void
  onClose: () => void
}) {
  const [f, setF] = useState({
    projectId: "",
    task: "",
    lead: "",
    start: "",
    days: 1,
  })
  const [err, setErr] = useState("")
  const set = (k: string, v: string | number) => setF(p => ({ ...p, [k]: v }))

  function save() {
    if (!f.projectId || !f.task.trim() || !f.start || f.days < 1) {
      setErr("Project, Task, Start, dan Days wajib diisi."); return;
    }
    onSave({ ...f, task: f.task.trim(), lead: f.lead.trim(), days: +f.days })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project">Project / Phase</Label>
        <Select value={f.projectId} onValueChange={v => set("projectId", v ?? "")}>
          <SelectTrigger id="project">
            <SelectValue placeholder="Pilih project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Label>Progress</Label>
        <p className="text-sm text-muted-foreground">0% — otomatis dari status task (Not Started)</p>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={onClose}>Batal</Button>
        <Button size="sm" onClick={save}>Simpan</Button>
      </div>
    </div>
  )
}

function EditTaskForm({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial: GanttTask
  onSave: (f: Partial<GanttTask> & { task: string; start: string; days: number }) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [f, setF] = useState({
    task: initial.task,
    lead: initial.lead,
    start: initial.start,
    days: initial.days,
  })
  const [err, setErr] = useState("")
  const set = (k: string, v: string | number) => setF(p => ({ ...p, [k]: v }))

  function save() {
    if (!f.task.trim() || !f.start || f.days < 1) {
      setErr("Task, Start, dan Days wajib diisi."); return;
    }
    onSave({ ...f, task: f.task.trim(), lead: f.lead.trim(), days: +f.days })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Phase / Project</Label>
        <p className="text-sm font-medium text-muted-foreground border rounded-md px-3 py-2 bg-muted/50">{initial.phase}</p>
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
        <Label>Progress</Label>
        <p className="text-sm text-muted-foreground">
          {initial.progress}% — otomatis dari status task
        </p>
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
