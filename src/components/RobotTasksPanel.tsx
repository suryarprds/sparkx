import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Package,
  Zap,
  History,
} from "lucide-react";
import { useCurrentTask, usePendingTasks, useTaskHistory } from "@/hooks/useAPI";
import { formatDistanceToNow } from "date-fns";

interface RobotTasksPanelProps {
  robotId: string;
}

export function RobotTasksPanel({ robotId }: RobotTasksPanelProps) {
  const { data: currentTask, isLoading: loadingCurrent } = useCurrentTask(robotId);
  const { data: pendingTasks = [], isLoading: loadingPending } = usePendingTasks(robotId);
  const { data: taskHistory = [], isLoading: loadingHistory } = useTaskHistory(robotId, 10);

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "navigation": return <MapPin className="w-4 h-4" />;
      case "delivery": return <Package className="w-4 h-4" />;
      case "inspection": return <AlertCircle className="w-4 h-4" />;
      case "charging": return <Zap className="w-4 h-4" />;
      case "maintenance": return <Clock className="w-4 h-4" />;
      default: return <PlayCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_progress: { label: "In Progress", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
      pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
      completed: { label: "Completed", className: "bg-success/10 text-success border-success/30" },
      failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/30" },
      cancelled: { label: "Cancelled", className: "bg-muted/10 text-muted-foreground border-muted/30" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      critical: { label: "Critical", className: "bg-red-500/10 text-red-400 border-red-500/30" },
      high: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
      medium: { label: "Medium", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
      low: { label: "Low", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant="outline" className={`${config.className} text-xs`}>{config.label}</Badge>;
  };

  const formatTime = (date: string | null) => {
    if (!date) return "Not started";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Card className="p-4 sm:p-6 card-gradient border-border">
      <div className="flex items-center gap-2 mb-4">
        <PlayCircle className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Task Management</h2>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="pending">
            Pending {pendingTasks.length > 0 && `(${pendingTasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Current Task */}
        <TabsContent value="current" className="space-y-4">
          {loadingCurrent ? (
            <div className="text-center py-8 text-muted-foreground">Loading current task...</div>
          ) : currentTask ? (
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getTaskTypeIcon(currentTask.taskType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{currentTask.taskName}</h3>
                    <p className="text-sm text-muted-foreground">{currentTask.description}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(currentTask.status)}
                  {getPriorityBadge(currentTask.priority)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-bold text-primary">{currentTask.progress}%</span>
                </div>
                <Progress value={currentTask.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-mono">{formatTime(currentTask.actualStartAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Est. End:</span>
                  <span className="font-mono">{formatTime(currentTask.estimatedEndAt)}</span>
                </div>
                {currentTask.sourceLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">From:</span>
                    <span className="truncate">{currentTask.sourceLocation}</span>
                  </div>
                )}
                {currentTask.targetLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-success" />
                    <span className="text-muted-foreground">To:</span>
                    <span className="truncate">{currentTask.targetLocation}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No active task</p>
              <p className="text-sm text-muted-foreground mt-1">Robot is idle</p>
            </div>
          )}
        </TabsContent>

        {/* Pending Tasks */}
        <TabsContent value="pending" className="space-y-3">
          {loadingPending ? (
            <div className="text-center py-8 text-muted-foreground">Loading pending tasks...</div>
          ) : pendingTasks.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {pendingTasks.map((task: any, index: number) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-muted-foreground mt-1">#{index + 1}</span>
                      <div className="flex items-center gap-2">
                        {getTaskTypeIcon(task.taskType)}
                        <span className="font-semibold text-sm">{task.taskName}</span>
                      </div>
                    </div>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ml-6">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Scheduled: {formatTime(task.scheduledStartAt)}</span>
                    </div>
                    {task.targetLocation && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{task.targetLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No pending tasks</p>
              <p className="text-sm text-muted-foreground mt-1">Task queue is empty</p>
            </div>
          )}
        </TabsContent>

        {/* Task History */}
        <TabsContent value="history" className="space-y-3">
          {loadingHistory ? (
            <div className="text-center py-8 text-muted-foreground">Loading task history...</div>
          ) : taskHistory.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {taskHistory.map((task: any) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-slate-900/30 border border-slate-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-semibold text-sm">{task.taskName}</span>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ml-6">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <History className="w-3 h-3" />
                      <span>Completed: {formatTime(task.actualEndAt)}</span>
                    </div>
                    {task.result && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Result:</span>
                        <span className={task.result === 'success' ? 'text-success' : 'text-destructive'}>
                          {task.result}
                        </span>
                      </div>
                    )}
                  </div>
                  {task.failureReason && (
                    <div className="mt-2 ml-6 text-xs text-destructive">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {task.failureReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No task history</p>
              <p className="text-sm text-muted-foreground mt-1">No completed or failed tasks</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
