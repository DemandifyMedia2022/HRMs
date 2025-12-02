'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  CalendarIcon,
  X,
  Loader2,
  Send,
  Paperclip,
  Download,
  Trash2,
  Edit2,
  UserPlus,
  Tag,
  Clock,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface User {
  id: number;
  Full_name: string;
  email: string;
  department?: string;
}

interface Label {
  id: number;
  name: string;
  color: string;
}

interface Comment {
  id: number;
  comment_text: string;
  user: User;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
}

interface Attachment {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path?: string;
  uploaded_by: User;
  created_at: string;
}

interface ActivityLog {
  id: number;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  user: User;
  created_at: string;
}

interface TaskDetail {
  id: number;
  task_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  department?: string;
  created_by: User;
  assigned_to?: User;
  created_at: string;
  updated_at: string;
  labels: Label[];
  watchers: User[];
  comments: Comment[];
  attachments: Attachment[];
  activity_logs: ActivityLog[];
}

interface TaskDetailModalProps {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export function TaskDetailModal({ taskId, open, onOpenChange, onUpdate }: TaskDetailModalProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Attachment state
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      fetchTaskDetails();
      fetchCurrentUser();
    }
  }, [open, taskId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me');
      const data = await response.json();
      if (data.success) {
        setCurrentUserId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      
      if (data.success) {
        setTask(data.data);
        setTitle(data.data.title);
        setDescription(data.data.description || '');
        setStatus(data.data.status);
        setPriority(data.data.priority);
        
        // Safely parse due date
        if (data.data.due_date) {
          const parsedDate = new Date(data.data.due_date);
          setDueDate(isNaN(parsedDate.getTime()) ? undefined : parsedDate);
        } else {
          setDueDate(undefined);
        }
      } else {
        toast.error('Failed to load task details');
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (field: string, value: any) => {
    if (!taskId) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Task updated successfully');
        fetchTaskDetails();
        onUpdate?.();
      } else {
        toast.error(data.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await updateTask('status', newStatus);
  };

  const handlePriorityChange = async (newPriority: string) => {
    setPriority(newPriority);
    await updateTask('priority', newPriority);
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    setDueDate(date);
    await updateTask('due_date', date?.toISOString());
  };

  const handleTitleSave = async () => {
    if (title.trim() && title !== task?.title) {
      await updateTask('title', title.trim());
    }
    setEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (description !== task?.description) {
      await updateTask('description', description.trim() || null);
    }
    setEditingDescription(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !taskId) return;
    
    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: commentText }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCommentText('');
        fetchTaskDetails();
        toast.success('Comment added');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;
    
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTaskDetails();
        toast.success('File uploaded successfully');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!taskId) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTaskDetails();
        toast.success('Attachment deleted');
      } else {
        toast.error('Failed to delete attachment');
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment_text);
  };

  const handleSaveComment = async (commentId: number) => {
    if (!taskId || !editingCommentText.trim()) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: editingCommentText }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingCommentId(null);
        setEditingCommentText('');
        fetchTaskDetails();
        toast.success('Comment updated');
      } else {
        toast.error('Failed to update comment');
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!taskId) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTaskDetails();
        toast.success('Comment deleted');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatActivityMessage = (log: ActivityLog) => {
    const action = log.action.replace(/_/g, ' ');
    if (log.field_name) {
      return `${action} ${log.field_name} from "${log.old_value}" to "${log.new_value}"`;
    }
    return action;
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    const source = (name && name.trim()) || (email && email.trim()) || '';
    if (!source) return '?';
    return source
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const safeFormatDate = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, formatStr);
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!open || !taskId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingTitle ? (
                <div className="space-y-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') {
                        setTitle(task?.title || '');
                        setEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="text-xl font-semibold"
                  />
                </div>
              ) : (
                <DialogTitle
                  className="text-2xl cursor-pointer hover:text-primary"
                  onClick={() => setEditingTitle(true)}
                >
                  {task?.title}
                </DialogTitle>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {task?.task_number}
              </p>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : task ? (
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments {task.comments.length > 0 && `(${task.comments.length})`}
                </TabsTrigger>
                <TabsTrigger value="attachments">
                  Attachments {task.attachments.length > 0 && `(${task.attachments.length})`}
                </TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
                {/* Status and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <Badge className={statusColors[option.value]}>
                              {option.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={handlePriorityChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <Badge className={priorityColors[option.value]}>
                              {option.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate && !isNaN(dueDate.getTime()) ? format(dueDate, 'PPP') : 'No due date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={handleDueDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  {editingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        placeholder="Add a description..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleDescriptionSave}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDescription(task.description || '');
                            setEditingDescription(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-3 border rounded-md cursor-pointer hover:bg-accent min-h-[100px]"
                      onClick={() => setEditingDescription(true)}
                    >
                      {task.description || (
                        <span className="text-muted-foreground">Click to add description...</span>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Assigned To */}
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <div className="flex items-center gap-2">
                    {task.assigned_to ? (
                      <>
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(task.assigned_to.Full_name, task.assigned_to.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{task.assigned_to.Full_name}</p>
                          <p className="text-sm text-muted-foreground">{task.assigned_to.email}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Unassigned</p>
                    )}
                  </div>
                </div>

                {/* Created By */}
                <div className="space-y-2">
                  <Label>Created By</Label>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(task.created_by.Full_name, task.created_by.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{task.created_by.Full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {safeFormatDate(task.created_at, 'PPP')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Labels */}
                {task.labels.length > 0 && (
                  <div className="space-y-2">
                    <Label>Labels</Label>
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map((label) => (
                        <Badge
                          key={label.id}
                          style={{ backgroundColor: label.color, color: '#fff' }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Watchers */}
                {task.watchers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Watchers</Label>
                    <div className="flex flex-wrap gap-2">
                      {task.watchers.map((watcher) => (
                        <div key={watcher.id} className="flex items-center gap-2 p-2 border rounded-md">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(watcher.Full_name, watcher.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{watcher.Full_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comments" className="space-y-4 mt-4">
                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="space-y-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment... (you can type @username to mention someone)"
                    rows={3}
                  />
                  <Button type="submit" disabled={submittingComment || !commentText.trim()}>
                    {submittingComment ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Comment
                  </Button>
                </form>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {task.comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No comments yet</p>
                  ) : (
                    task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(comment.user.Full_name, comment.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{comment.user.Full_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {safeFormatDate(comment.created_at, 'PPp')}
                              </span>
                              {comment.is_edited && (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                              )}
                            </div>
                            {currentUserId === comment.user.id && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditComment(comment)}
                                  title="Edit comment"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveComment(comment.id)}>
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingCommentText('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4 mt-4">
                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4 mr-2" />
                    )}
                    Upload File
                  </Button>
                </div>

                <Separator />

                {/* Attachments List */}
                <div className="space-y-2">
                  {task.attachments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No attachments</p>
                  ) : (
                    task.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{attachment.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(attachment.file_size)} • Uploaded by{' '}
                              {attachment.uploaded_by.Full_name} •{' '}
                              {safeFormatDate(attachment.created_at, 'PPp')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Use the file_path directly which points to /api/files/...
                              window.open(attachment.file_path || `/api/tasks/${taskId}/attachments/${attachment.id}`, '_blank');
                            }}
                            title="Download attachment"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                {task.activity_logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity yet</p>
                ) : (
                  <div className="space-y-4">
                    {task.activity_logs.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {(log.user.Full_name || log.user.email)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.user.Full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {safeFormatDate(log.created_at, 'PPp')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatActivityMessage(log)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
