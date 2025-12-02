'use client';

import { useState, useEffect } from 'react';
import { SidebarConfig } from '@/components/sidebar-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Calendar, Search, Filter, Loader2, ArrowUpDown, Plus, Minus } from 'lucide-react';
import { TaskCreateForm } from '@/components/tasks/TaskCreateForm';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  };
  created_by?: {
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

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Tasks</h1>
            <p className="text-muted-foreground">Tasks assigned to you or created by you</p>
          </div>
          <Button onClick={() => setCreateFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card
            className={`cursor-pointer transition-all ${
              quickFilter === 'all' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setQuickFilter('all')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{taskCounts.all}</div>
              <div className="text-sm text-muted-foreground">All Tasks</div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              quickFilter === 'today' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setQuickFilter('today')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{taskCounts.today}</div>
              <div className="text-sm text-muted-foreground">Due Today</div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              quickFilter === 'week' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setQuickFilter('week')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{taskCounts.week}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${
              quickFilter === 'overdue' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setQuickFilter('overdue')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{taskCounts.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
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
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
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
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setQuickFilter('all');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({sortedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No tasks found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('task_number')}>
                        <div className="flex items-center">
                          Task #
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('title')}>
                        <div className="flex items-center">
                          Title
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                        <div className="flex items-center">
                          Priority
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Board</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('due_date')}>
                        <div className="flex items-center">
                          Due Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Labels</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTasks.map((task) => (
                      <TableRow 
                        key={task.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setDetailModalOpen(true);
                        }}
                      >
                        <TableCell className="font-mono text-sm">{task.task_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[task.status]}>
                            {statusLabels[task.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinned(task.id);
                            }}
                          >
                            {pinnedTaskIds.includes(task.id) ? (
                              <Minus className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {task.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {task.assigned_to.Full_name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{task.assigned_to.Full_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.due_date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span
                                className={`text-sm ${
                                  isOverdue(task.due_date) ? 'text-red-600 font-semibold' : ''
                                }`}
                              >
                                {format(new Date(task.due_date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No due date</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {task.labels?.map((label) => (
                              <Badge
                                key={label.id}
                                className="text-xs"
                                style={{
                                  backgroundColor: label.color,
                                  color: '#fff',
                                }}
                              >
                                {label.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
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
