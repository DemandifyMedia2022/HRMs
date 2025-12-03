"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarConfig } from "@/components/sidebar-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Loader2, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouteGuard } from "@/hooks/useRouteGuard";

interface UserOption {
  id: number;
  Full_name: string;
  email: string;
  department?: string | null;
}

interface Task {
  id: number;
  task_number: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done" | string;
  priority: "low" | "medium" | "high" | "critical" | string;
  due_date?: string | null;
  created_at?: string;
  department?: string | null;
  assigned_to?: {
    id: number;
    Full_name: string;
    email: string;
    department?: string | null;
  } | null;
  created_by?: {
    id: number;
    Full_name: string;
    email: string;
    department?: string | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

interface TaskMonitoringDashboardProps {
  role: "admin" | "hr";
}

export function TaskMonitoringDashboard({ role }: TaskMonitoringDashboardProps) {
  const { user, loading: authLoading } = useRouteGuard(role);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"all" | "today" | "week" | "overdue">("all");

  // Sorting
  const [sortField, setSortField] = useState<string>("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!authLoading && user) {
      void fetchInitialData();
    }
  }, [authLoading, user, statusFilter, priorityFilter, assigneeFilter, departmentFilter]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "200",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (assigneeFilter !== "all") params.append("assignee_id", assigneeFilter);
      if (departmentFilter !== "all") params.append("department", departmentFilter);

      const [tasksRes, usersRes] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`),
        fetch("/api/tasks/users"),
      ]);

      if (!tasksRes.ok) {
        toast.error("Failed to load tasks");
      } else {
        const tasksJson = await tasksRes.json();
        setTasks(tasksJson.data || []);
      }

      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.success) setUsers(usersJson.data || []);
      }
    } catch (error) {
      console.error("Failed to load task monitoring data", error);
      toast.error("Failed to load task monitoring data");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredTasks = useMemo(() => {
    let data = [...tasks];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.task_number.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assigned_to?.Full_name?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q)
      );
    }

    // Apply quick due-date based filters for handy views
    if (quickFilter !== "all") {
      const now = new Date();
      const todayYmd = now.toISOString().split("T")[0];
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);

      data = data.filter(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        const dueYmd = due.toISOString().split("T")[0];

        if (quickFilter === "today") {
          return dueYmd === todayYmd;
        }
        if (quickFilter === "week") {
          return due >= now && due <= weekEnd;
        }
        if (quickFilter === "overdue") {
          return due < now && t.status !== "done";
        }
        return true;
      });
    }

    data.sort((a, b) => {
      let aValue: any = (a as any)[sortField];
      let bValue: any = (b as any)[sortField];

      if (sortField === "due_date" || sortField === "created_at") {
        aValue = aValue ? new Date(aValue).getTime() : Infinity;
        bValue = bValue ? new Date(bValue).getTime() : Infinity;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [tasks, searchQuery, sortField, sortOrder, quickFilter]);

  const analytics = useMemo(() => {
    const total = tasks.length;
    const byStatus: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byAssignee: Record<string, number> = {};

    const now = new Date();
    let overdue = 0;
    let dueThisWeek = 0;

    for (const t of tasks) {
      const s = t.status || "";
      const p = t.priority || "";
      if (byStatus[s] !== undefined) byStatus[s]++;
      if (byPriority[p] !== undefined) byPriority[p]++;

      const assigneeName = t.assigned_to?.Full_name || "Unassigned";
      byAssignee[assigneeName] = (byAssignee[assigneeName] || 0) + 1;

      if (t.due_date && t.status !== "done") {
        const due = new Date(t.due_date);
        if (due < now) overdue++;
        const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) dueThisWeek++;
      }
    }

    return { total, byStatus, byPriority, byAssignee, overdue, dueThisWeek };
  }, [tasks]);

  if (authLoading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const uniqueDepartments = Array.from(
    new Set(tasks.map((t) => t.department).filter((d): d is string => !!d))
  );

  return (
    <>
      <SidebarConfig role={role} />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold">
              {role === "admin" ? "Organization Tasks" : "Department Tasks"}
            </h1>
            <p className="text-muted-foreground">
              Monitor all tasks, workload, and status across users.
            </p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Tasks</CardDescription>
              <CardTitle className="text-3xl">{analytics.total}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              All tasks matching current filters
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">{analytics.byStatus.in_progress}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Active execution
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Review</CardDescription>
              <CardTitle className="text-3xl">{analytics.byStatus.review}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Waiting for review/QA
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-3xl text-red-600">{analytics.overdue}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Due date passed, not done
              {analytics.dueThisWeek > 0 && (
                <div className="mt-1 text-xs text-amber-600 font-medium">
                  {analytics.dueThisWeek} due in next 7 days
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick time-based filters */}
        <div className="flex flex-wrap gap-2 mt-2">
          {([
            { key: "all", label: "All" },
            { key: "today", label: "Due Today" },
            { key: "week", label: "This Week" },
            { key: "overdue", label: "Overdue" },
          ] as const).map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setQuickFilter(item.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                quickFilter === item.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Input
                  placeholder="Search by title, task #, assignee, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-8"
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

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.Full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="w-full md:w-auto">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setAssigneeFilter("all");
                  setDepartmentFilter("all");
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workload by Assignee */}
        <Card>
          <CardHeader>
            <CardTitle>Workload by Assignee</CardTitle>
            <CardDescription>Number of tasks per assignee (all statuses)</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.byAssignee).length === 0 ? (
              <div className="text-sm text-muted-foreground">No tasks found.</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Object.entries(analytics.byAssignee).map(([name, count]) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-background"
                  >
                    <span className="font-medium">{name}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No tasks found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("task_number")}>
                        <div className="flex items-center">
                          Task #
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                        <div className="flex items-center">
                          Title
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("created_at")}>
                        <div className="flex items-center">
                          Created At
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("due_date")}>
                        <div className="flex items-center">
                          Due Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
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
                          <Badge className={statusColors[task.status] || statusColors.todo}>
                            {statusLabels[task.status] || task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[task.priority] || priorityColors.medium}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.assigned_to ? (
                            <span className="text-sm">{task.assigned_to.Full_name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {task.department || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.created_at ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(task.created_at), "MMM dd, yyyy HH:mm")}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.due_date ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">
                                {format(new Date(task.due_date), "MMM dd, yyyy")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No due date</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
