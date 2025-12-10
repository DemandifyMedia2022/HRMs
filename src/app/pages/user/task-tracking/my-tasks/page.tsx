'use client';

import { useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Search, Filter, Loader2, ArrowUpDown, Plus, Minus, ListFilter } from 'lucide-react';
import { TaskCreateForm } from '@/components/tasks/TaskCreateForm';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface Task {
  id: number;
  task_number: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  created_at: string;
  assigned_to?: {
    id: number;
    Full_name: string;
    email: string;
    profile_image?: string;
  };
  created_by?: {
    id: number;
    Full_name: string;
    email: string;
    profile_image?: string;
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

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const statusColors: Record<string, string> = {
  todo: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  high: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [pinnedTaskIds, setPinnedTaskIds] = useState<number[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('kanbanPinnedTaskIds') : null;
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        if (Array.isArray(parsed)) {
          setPinnedTaskIds(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load pinned tasks from storage', e);
    }
  }, []);

  useEffect(() => {
    fetchMyTasks();
  }, [statusFilter, priorityFilter, quickFilter]);

  const togglePinned = (taskId: number) => {
    setPinnedTaskIds(prev => {
      const exists = prev.includes(taskId);
      const next = exists ? prev.filter(id => id !== taskId) : [...prev, taskId];
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('kanbanPinnedTaskIds', JSON.stringify(next));
        }
      } catch (e) {
        console.error('Failed to persist pinned tasks', e);
      }
      toast.success(exists ? 'Removed from board' : 'Added to board');
      return next;
    });
  };

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        my_tasks: 'true',
        limit: '100',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }

      // Quick filters
      if (quickFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('due_date_from', today);
        params.append('due_date_to', today);
      } else if (quickFilter === 'week') {
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        params.append('due_date_from', today.toISOString().split('T')[0]);
        params.append('due_date_to', weekEnd.toISOString().split('T')[0]);
      } else if (quickFilter === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        params.append('due_date_to', today);
        params.append('status', 'todo,in_progress,review');
      }

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedTasks = () => {
    let filtered = [...tasks];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.task_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Task];
      let bValue: any = b[sortField as keyof Task];

      if (sortField === 'due_date') {
        aValue = aValue ? new Date(aValue).getTime() : Infinity;
        bValue = bValue ? new Date(bValue).getTime() : Infinity;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && tasks.find(t => t.due_date === dueDate)?.status !== 'done';
  };

  const taskCounts = {
    all: tasks.length,
    today: tasks.filter(t => {
      if (!t.due_date) return false;
      const today = new Date().toISOString().split('T')[0];
      return t.due_date.split('T')[0] === today;
    }).length,
    week: tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      return dueDate >= today && dueDate <= weekEnd;
    }).length,
    overdue: tasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length,
  };

  const sortedTasks = getSortedTasks();

  return (
    <>
      <SidebarConfig role="user" />
      {/* 
          Main Container:
          - flex-col: Stacks header, stats, and table vertically.
          - max-w-full: Prevents the container from exceeding the viewport width (critical for preventing sidebar scroll issues).
          - min-w-0: Allows flex items to shrink below their content size (also critical).
          - gap-6: Consistent spacing.
          - p-4 md:p-6: Responsive padding.
      */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-full min-w-0">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">My Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage tasks assigned to you or created by you.</p>
          </div>
          <Button onClick={() => setCreateFormOpen(true)} className="w-full sm:w-auto shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Create New Task
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${quickFilter === 'all' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setQuickFilter('all')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-4xl font-bold text-neutral-900 dark:text-white">{taskCounts.all}</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">Total Tasks</span>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${quickFilter === 'today' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setQuickFilter('today')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-4xl font-bold text-blue-600">{taskCounts.today}</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">Due Today</span>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${quickFilter === 'week' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setQuickFilter('week')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-4xl font-bold text-amber-600">{taskCounts.week}</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">This Week</span>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${quickFilter === 'overdue' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setQuickFilter('overdue')}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <span className="text-4xl font-bold text-red-600">{taskCounts.overdue}</span>
              <span className="text-sm font-medium text-muted-foreground mt-1">Overdue</span>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setQuickFilter('all');
                  }}
                  title="Clear Filters"
                >
                  <ListFilter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Table Container */}
        {/* max-w-full and overflow-hidden here ensure the card itself doesn't cause page scroll */}
        <Card className="w-full max-w-full overflow-hidden flex flex-col">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Tasks List</CardTitle>
              <Badge variant="outline" className="ml-2 font-mono">
                {sortedTasks.length} items
              </Badge>
            </div>
          </CardHeader>
          <div className="relative w-full overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <ListFilter className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No tasks found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Try adjusting your filters or search query, or create a new task to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('task_number')}>
                      <span className="flex items-center gap-1">
                        ID <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </TableHead>
                    <TableHead className="min-w-[200px] cursor-pointer" onClick={() => handleSort('title')}>
                      <span className="flex items-center gap-1">
                        Title <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[110px]">Priority</TableHead>
                    <TableHead className="w-[80px] text-center">Board</TableHead>
                    <TableHead className="min-w-[150px]">Assigned To</TableHead>
                    <TableHead className="min-w-[130px] cursor-pointer" onClick={() => handleSort('due_date')}>
                      <span className="flex items-center gap-1">
                        Due Date <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </TableHead>
                    <TableHead className="min-w-[150px]">Labels</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setDetailModalOpen(true);
                      }}
                    >
                      <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                        {task.task_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium line-clamp-1">{task.title}</span>
                          {task.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${statusColors[task.status]} border-0 font-normal`}>
                          {statusLabels[task.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${priorityColors[task.priority]} border-transparent font-normal`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinned(task.id);
                          }}
                        >
                          {pinnedTaskIds.includes(task.id) ? (
                            <Minus className="w-4 h-4 text-primary" />
                          ) : (
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {task.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border">
                              {task.assigned_to.profile_image && (
                                <AvatarImage
                                  src={task.assigned_to.profile_image.startsWith('http')
                                    ? task.assigned_to.profile_image
                                    : `/api/files/${task.assigned_to.profile_image}`}
                                  alt={task.assigned_to.Full_name}
                                />
                              )}
                              <AvatarFallback className="text-[10px]">
                                {task.assigned_to.Full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]" title={task.assigned_to.Full_name}>
                              {task.assigned_to.Full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.due_date ? (
                          <div className={`flex items-center gap-1.5 text-sm ${isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(task.due_date), 'MMM dd, yyyy')}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {task.labels?.slice(0, 3).map((label) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 border-0"
                              style={{
                                backgroundColor: label.color,
                                color: '#fff',
                              }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                          {(task.labels?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                              +{task.labels!.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        <TaskCreateForm
          open={createFormOpen}
          onOpenChange={setCreateFormOpen}
          onSuccess={fetchMyTasks}
        />

        <TaskDetailModal
          taskId={selectedTaskId}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onUpdate={fetchMyTasks}
        />
      </div>
    </>
  );
}
