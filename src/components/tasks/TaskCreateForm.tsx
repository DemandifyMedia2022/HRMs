'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface User {
  id: number;
  Full_name: string;
  email: string;
  department: string;
}

interface Label {
  id: number;
  name: string;
  color: string;
  department: string | null;
}

interface TaskCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TaskCreateForm({ open, onOpenChange, onSuccess }: TaskCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assigneeId, setAssigneeId] = useState<string>('unassigned');
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [selectedWatchers, setSelectedWatchers] = useState<number[]>([]);
  const [watcherSearch, setWatcherSearch] = useState('');

  // Fetch users and labels when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened, fetching users and labels...');
      if (!usersLoaded) {
        fetchUsers();
      }
      fetchLabels();
    }
  }, [open, usersLoaded]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch('/api/tasks/users');
      const data = await response.json();
      console.log('Fetched users for assignment:', data);
      if (data.success) {
        setUsers(data.data || []);
      } else {
        console.error('Failed to fetch users:', data);
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
      setUsersLoaded(true);
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/task-labels');
      const data = await response.json();
      if (data.success) {
        setLabels(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch labels:', error);
      toast.error('Failed to load labels');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (title.length > 255) {
      toast.error('Task title must be 255 characters or less');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate?.toISOString(),
          assigned_to_id: assigneeId && assigneeId !== 'unassigned' ? parseInt(assigneeId) : undefined,
          label_ids: selectedLabels,
          watcher_ids: selectedWatchers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Task created successfully');
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate(undefined);
    setAssigneeId('unassigned');
    setSelectedLabels([]);
    setSelectedWatchers([]);
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const filteredWatchers = users.filter((user) => {
    if (!watcherSearch.trim()) return true;
    const term = watcherSearch.toLowerCase();
    return (
      (user.Full_name && user.Full_name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term))
    );
  });

  const toggleWatcher = (userId: number) => {
    setSelectedWatchers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new task
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={255}
              required
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/255 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
            />
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To {users.length > 0 && `(${users.length} users)`}</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select assignee (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {usersLoading && (
                  <SelectItem value="loading" disabled>Loading users...</SelectItem>
                )}
                {!usersLoading && users.length === 0 && usersLoaded && (
                  <SelectItem value="no-users" disabled>No users available</SelectItem>
                )}
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.Full_name || user.email} {user.department && `(${user.department})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
              {labels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No labels available</p>
              ) : (
                labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={{
                      backgroundColor: selectedLabels.includes(label.id) ? label.color : 'transparent',
                      borderColor: label.color,
                      color: selectedLabels.includes(label.id) ? '#fff' : label.color,
                    }}
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Watchers */}
          <div className="space-y-2">
            <Label>Watchers</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users available</p>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Search watchers..."
                    value={watcherSearch}
                    onChange={(e) => setWatcherSearch(e.target.value)}
                    className="mb-2"
                  />
                  {filteredWatchers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No matching users</p>
                  )}
                  {filteredWatchers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`watcher-${user.id}`}
                        checked={selectedWatchers.includes(user.id)}
                        onChange={() => toggleWatcher(user.id)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`watcher-${user.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {user.Full_name || user.email}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Creator and assignee are automatically added as watchers
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
