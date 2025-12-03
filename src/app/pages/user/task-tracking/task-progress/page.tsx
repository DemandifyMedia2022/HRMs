'use client';

import { useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, GripVertical, MessageCircle, Paperclip, Plus, Loader2, AlertCircle, Minus } from 'lucide-react';
import { TaskCreateForm } from '@/components/tasks/TaskCreateForm';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Task {
  id: number;
  task_number: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  completed_date?: string | null;
  assigned_to?: {
    id: number;
    Full_name: string;
    email: string;
  };
  labels?: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  _count?: {
    comments: number;
    attachments: number;
  };
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
}

const statusColumns = [
  { id: 'todo', title: 'To Do', color: '#8B7355' },
  { id: 'in_progress', title: 'In Progress', color: '#6B8E23' },
  { id: 'review', title: 'Review', color: '#CD853F' },
  { id: 'done', title: 'Done', color: '#556B2F' },
];

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [pinnedTaskIds, setPinnedTaskIds] = useState<number[]>([]);
  const [manageBoardOpen, setManageBoardOpen] = useState(false);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [manageLoading, setManageLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('kanbanPinnedTaskIds') : null;
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        if (Array.isArray(parsed)) {
          setPinnedTaskIds(parsed);
          fetchTasks(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load pinned tasks from storage', e);
    }
  }, []);

  useEffect(() => {
    // When pinnedTaskIds change (e.g. user toggles pins in another tab and reloads),
    // refetch tasks for the current set of pinned IDs.
    fetchTasks();
  }, [pinnedTaskIds]);

  // Periodically refresh tasks so done tasks are auto-removed after 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async (explicitPinnedIds?: number[]) => {
    const currentPinnedIds = explicitPinnedIds ?? pinnedTaskIds;
    setLoading(true);
    try {
      const response = await fetch('/api/tasks?my_tasks=true&limit=100');
      if (response.ok) {
        const data = await response.json();
        const allTasks = (data.data || []) as Task[];

        const now = Date.now();
        const fifteenMinutesMs = 15 * 60 * 1000;

        const tasks = currentPinnedIds.length > 0
          ? allTasks.filter((task: Task) => {
              if (!currentPinnedIds.includes(task.id)) return false;

              if (task.status !== 'done') return true;

              if (!task.completed_date) return true;

              const completedAt = new Date(task.completed_date).getTime();
              const ageMs = now - completedAt;

              // Keep on board only if completed less than 15 minutes ago
              return ageMs < fifteenMinutesMs;
            })
          : [];
        
        // Group tasks by status
        const groupedColumns = statusColumns.map(col => ({
          ...col,
          tasks: tasks.filter((task: Task) => task.status === col.id)
        }));
        
        setColumns(groupedColumns);
      } else {
        toast.error('Failed to load tasks');
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTasksForManage = async () => {
    setManageLoading(true);
    try {
      const response = await fetch('/api/tasks?my_tasks=true&limit=200');
      if (response.ok) {
        const data = await response.json();
        setAllTasks((data.data || []) as Task[]);
      }
    } catch (error) {
      console.error('Failed to load tasks for board management:', error);
      toast.error('Failed to load tasks for board');
    } finally {
      setManageLoading(false);
    }
  };

  const handleOpenManageBoard = async () => {
    setManageBoardOpen(true);
    await loadAllTasksForManage();
  };

  const togglePinnedFromManage = (taskId: number) => {
    setPinnedTaskIds(prev => {
      const exists = prev.includes(taskId);
      const next = exists ? prev.filter(id => id !== taskId) : [...prev, taskId];
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('kanbanPinnedTaskIds', JSON.stringify(next));
        }
      } catch (e) {
        console.error('Failed to persist pinned tasks from board manager', e);
      }
      toast.success(exists ? 'Removed from board' : 'Added to board');
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ task, sourceColumnId: columnId }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { task, sourceColumnId } = data;

    if (sourceColumnId === targetColumnId) return;

    // Optimistic update
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColumnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) };
        }
        if (col.id === targetColumnId) {
          return { ...col, tasks: [...col.tasks, { ...task, status: targetColumnId }] };
        }
        return col;
      }),
    );

    // Update on server
    try {
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumnId }),
      });

      if (!response.ok) {
        // Revert on error
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id === targetColumnId) {
              return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) };
            }
            if (col.id === sourceColumnId) {
              return { ...col, tasks: [...col.tasks, task] };
            }
            return col;
          }),
        );
        toast.error('Failed to update task status');
      } else {
        toast.success('Task status updated');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task status');
      // Revert on error
      fetchTasks();
    }
  };

  return (
    <>
      <SidebarConfig role="user" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Task Board</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleOpenManageBoard}
            >
              Manage Board Tasks
            </Button>
            <Button onClick={() => setCreateFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <div
                key={column.id}
                className="bg-white/20 dark:bg-neutral-900/20 backdrop-blur-xl rounded-3xl p-5 border border-border dark:border-neutral-700/50"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{column.title}</h3>
                    <Badge className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border-neutral-200/50 dark:border-neutral-600/50">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <button 
                    onClick={() => setCreateFormOpen(true)}
                    className="p-1 rounded-full bg-white/30 dark:bg-neutral-800/30 hover:bg-white/50 dark:hover:bg-neutral-700/50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                  </button>
                </div>

                <div className="space-y-4">
                  {column.tasks.map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-move transition-all duration-300 border bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-neutral-700/70"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task, column.id)}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setDetailModalOpen(true);
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                {task.task_number}
                              </p>
                              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                                {task.title}
                              </h4>
                            </div>
                            <GripVertical className="w-5 h-5 text-neutral-500 dark:text-neutral-400 cursor-move flex-shrink-0 ml-2" />
                          </div>

                          {task.description && (
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                              {task.priority}
                            </Badge>
                          </div>

                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {task.labels.map((label) => (
                                <Badge
                                  key={label.id}
                                  className="text-xs backdrop-blur-sm"
                                  style={{
                                    backgroundColor: label.color,
                                    color: '#fff',
                                  }}
                                >
                                  {label.name}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/30 dark:border-neutral-700/30">
                            <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-xs font-medium">
                                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              )}
                              {task._count && task._count.comments > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">{task._count.comments}</span>
                                </div>
                              )}
                              {task._count && task._count.attachments > 0 && (
                                <div className="flex items-center gap-1">
                                  <Paperclip className="w-4 h-4" />
                                  <span className="text-xs font-medium">{task._count.attachments}</span>
                                </div>
                              )}
                            </div>

                            {task.assigned_to && (
                              <Avatar className="w-8 h-8 ring-2 ring-white/50 dark:ring-neutral-700/50">
                                <AvatarFallback className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium text-xs">
                                  {(task.assigned_to.Full_name || task.assigned_to.email)
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <TaskCreateForm
          open={createFormOpen}
          onOpenChange={setCreateFormOpen}
          onSuccess={fetchTasks}
        />

        <TaskDetailModal
          taskId={selectedTaskId}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onUpdate={fetchTasks}
        />

        <AlertDialog open={manageBoardOpen} onOpenChange={setManageBoardOpen}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Manage Board Tasks</AlertDialogTitle>
              <AlertDialogDescription>
                Select which of your tasks should appear on this board. Changes are saved per user and device.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2">
              {manageLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : allTasks.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>No tasks found.</span>
                </div>
              ) : (
                allTasks.map(task => {
                  const isPinned = pinnedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 bg-background hover:bg-muted/70 transition-colors"
                    >
                      <div className="min-w-0 mr-3">
                        <div className="text-xs text-muted-foreground font-mono">{task.task_number}</div>
                        <div className="text-sm font-medium truncate">{task.title}</div>
                      </div>
                      <Button
                        type="button"
                        variant={isPinned ? 'outline' : 'default'}
                        size="icon"
                        onClick={() => togglePinnedFromManage(task.id)}
                      >
                        {isPinned ? (
                          <Minus className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
