"use client"

import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from "react"
import { format } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, History, Loader2 } from "lucide-react"

interface Activity {
  id: string
  taskId: string
  taskTitle: string
  oldStatus: string | null
  newStatus: string
  userName: string
  createdAt: string
}

interface ActivityLogProps {
  projectId: string
}

function getStatusLabel(status: string) {
  switch (status) {
    case "NOT_STARTED": return "To Do"
    case "IN_PROGRESS": return "In Progress"
    case "FINISHED": return "Finished"
    default: return status
  }
}

export const ActivityLog = forwardRef<{ refresh: () => void }, ActivityLogProps>(function ActivityLog({ projectId }, ref) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hidden, setHidden] = useState(true)
  const [showScrollbar, setShowScrollbar] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  async function fetchActivities(offset: number = 0) {
    setLoading(true)
    try {
      const limit = 20
      const res = await fetch(`/api/projects/${projectId}/activities?limit=${limit}&offset=${offset}`)
      const data = await res.json()
      if (offset === 0) {
        setActivities(data.activities || [])
      } else {
        setActivities((prev) => [...prev, ...(data.activities || [])])
      }
      setTotal(data.total || 0)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useImperativeHandle(ref, () => ({
    refresh: () => fetchActivities(0)
  }))

  useEffect(() => {
    if (!hidden) {
      fetchActivities()
    }
  }, [projectId, hidden])

  useEffect(() => {
    if (!hidden) {
      const interval = setInterval(() => fetchActivities(0), 3000)
      return () => clearInterval(interval)
    }
  }, [projectId, hidden])

  const handleShowScrollbar = () => {
    setShowScrollbar(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setShowScrollbar(false)
    }, 2000)
  }

  const handleMouseEnter = () => {
    if (activities.length > 5) {
      setShowScrollbar(true)
    }
  }

  const handleMouseLeave = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setShowScrollbar(false)
    }, 500)
  }

  const handleToggle = () => {
    const newHidden = !hidden
    setHidden(newHidden)
    if (!newHidden && activities.length === 0) {
      fetchActivities()
    }
  }

  function getActivityMessage(activity: Activity): React.ReactNode {
    const user = activity.userName
    const task = activity.taskTitle
    
    if (activity.oldStatus === null) {
      return <><span className="font-medium">{user}</span> created <span className="font-medium">"{task}"</span> in To Do</>
    }
    
    if (activity.newStatus === "TITLE_UPDATED") {
      return <><span className="font-medium">{user}</span> updated title of <span className="font-medium">"{activity.oldStatus}"</span> to <span className="font-medium">"{task}"</span></>
    }
    
    if (activity.newStatus === "DELETED") {
      return <><span className="font-medium text-red-600">{user}</span> deleted <span className="font-medium">"{task}"</span></>
    }
    
    return (
      <><span className="font-medium">{user}</span> changed <span className="font-medium">"{task}"</span>
      {activity.oldStatus && <> from <span className="text-blue-600">{getStatusLabel(activity.oldStatus)}</span></>}
      {" to "}<span className="text-green-600">{getStatusLabel(activity.newStatus)}</span></>
    )
  }

  if (total === 0 && hidden) {
    return (
      <div className="border-t pt-4 mt-4">
        <Button variant="ghost" size="sm" onClick={handleToggle} className="w-full justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <History className="h-4 w-4" />
            Activity Log
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="border-t pt-4 mt-4">
      <Button variant="ghost" size="sm" onClick={handleToggle} className="w-full justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <History className="h-4 w-4" />
          Activity Log {total > 0 && `(${total})`}
        </div>
        {hidden ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>

      {!hidden && (
        <div className="mt-2">
          {loading && activities.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No activity yet</p>
          ) : (
            <div 
              className={`h-[150px] pr-4 overflow-auto ${showScrollbar ? "scrollbar-show" : "scrollbar-hide"}`}
              onScroll={handleShowScrollbar}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ScrollArea className="h-full">
                <div className="space-y-2 text-sm">
                  {activities.map((activity) => (
                    <div key={activity.id} className="text-gray-600 dark:text-gray-300 ml-2 mr-2">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {format(new Date(activity.createdAt), "HH:mm")}
                      </span>{" "}
                      {getActivityMessage(activity)}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  )
})