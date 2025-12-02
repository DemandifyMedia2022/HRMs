# Implementation Plan

## Current Status Summary

**Completed (Core Foundation):**
- ✅ Database schema with all task management tables
- ✅ Core task CRUD API endpoints
- ✅ Task status management and assignment endpoints
- ✅ Comments, attachments, labels, and watchers APIs
- ✅ Notification helper functions and preferences
- ✅ Notification digest system (hourly/daily)
- ✅ TaskCreateForm component with full functionality
- ✅ My Tasks page with filtering and search
- ✅ Kanban board (task-progress page) with drag-and-drop functionality
- ✅ Task detail modal component (basic structure)

**Remaining (Advanced Features):**
- ⏳ Complete task detail modal (comments, attachments, activity log sections)
- ⏳ Subtasks and dependencies management
- ⏳ Time tracking system
- ⏳ Task templates management
- ⏳ Calendar view
- ⏳ Analytics dashboard
- ⏳ HRMS integration automation
- ⏳ Archive system
- ⏳ Bulk operations
- ⏳ Advanced search and saved filters

---

## 1. Database Schema Setup

- [x] 1.1 Create database migration SQL for all task management tables
  - Generate SQL for tasks, task_comments, task_attachments, task_labels, task_label_mapping, task_watchers, task_dependencies, task_time_entries, task_activity_logs, task_templates, task_notification_preferences tables
  - Include all indexes and foreign key constraints
  - Ensure compatibility with existing users and notification tables
  - _Requirements: 1.1, 1.3_

- [x] 1.2 Update Prisma schema with task management models
  - Add all task-related models to prisma/schema.prisma
  - Define relationships with existing users model
  - Add proper indexes for performance
  - _Requirements: 1.1, 1.3_

- [x] 1.3 Generate Prisma client and verify schema
  - Run `npx prisma generate` to update Prisma client
  - Verify all models are accessible
  - Test database connection
  - _Requirements: 1.1_

## 2. Core Task API Endpoints

- [x] 2.1 Create task CRUD API routes
  - Implement `POST /api/tasks` - Create task with validation
  - Implement `GET /api/tasks` - List tasks with filtering (status, priority, assignee, department, date range)
  - Implement `GET /api/tasks/[id]` - Get single task with all relations
  - Implement `PUT /api/tasks/[id]` - Update task with activity logging
  - Implement `DELETE /api/tasks/[id]` - Soft delete task
  - Add authentication middleware to all routes
  - Add role-based authorization (users can create, managers can reassign)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.2 Implement task status management endpoint
  - Create `PATCH /api/tasks/[id]/status` route
  - Validate status transitions (todo → in_progress → review → done)
  - Handle blocked status with required blocking_reason
  - Trigger notifications on status change
  - Log status changes in activity log
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 2.3 Implement task assignment endpoint
  - Create `PATCH /api/tasks/[id]/assign` route
  - Validate assignee exists and is active
  - Support reassignment with notification to both old and new assignee
  - Check department permissions for cross-department assignments
  - Log assignment changes in activity log
  - _Requirements: 1.2, 2.1, 2.2, 12.1, 12.2_

- [x] 2.4 Create task activity logging utility
  - Build helper function to log all task changes
  - Capture field name, old value, new value, user, timestamp
  - Integrate with all task update operations
  - _Requirements: 3.3_

## 3. Task Comments System

- [x] 3.1 Implement task comments API
  - Create `GET /api/tasks/[id]/comments` - List comments with user details
  - Create `POST /api/tasks/[id]/comments` - Add comment with mention support
  - Create `PUT /api/tasks/[id]/comments/[commentId]` - Edit own comment
  - Create `DELETE /api/tasks/[id]/comments/[commentId]` - Delete own comment
  - Parse @mentions in comment text (format: @username or @[user_id])
  - Trigger notifications for assignee, assignor, watchers, and mentioned users
  - Store mentioned user IDs in mentioned_users field as JSON array
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## 4. Task Attachments System

- [x] 4.1 Implement task attachments API using existing file system
  - Create `GET /api/tasks/[id]/attachments` - List attachments
  - Create `POST /api/tasks/[id]/attachments` - Upload file (leverage existing `/api/files`)
  - Create `DELETE /api/tasks/[id]/attachments/[attachmentId]` - Delete attachment
  - Create `GET /api/tasks/[id]/attachments/[attachmentId]/download` - Download file
  - Store file metadata in task_attachments table
  - Validate file types and sizes
  - _Requirements: 1.4, 5.5_

## 5. Task Labels System

- [x] 5.1 Implement task labels API
  - Create `GET /api/task-labels` - List all labels (filtered by department if applicable)
  - Create `POST /api/task-labels` - Create new label
  - Create `PUT /api/task-labels/[id]` - Update label
  - Create `DELETE /api/task-labels/[id]` - Delete label (if not in use)
  - Support color coding for labels
  - _Requirements: 1.4_

- [x] 5.2 Implement label assignment to tasks
  - Add label management in task create/update endpoints
  - Support multiple labels per task
  - Filter tasks by labels
  - _Requirements: 1.4, 4.4_

## 6. Task Watchers System

- [x] 6.1 Implement task watchers API
  - Create `GET /api/tasks/[id]/watchers` - List watchers
  - Create `POST /api/tasks/[id]/watchers` - Add watcher
  - Create `DELETE /api/tasks/[id]/watchers/[userId]` - Remove watcher
  - Automatically add creator and assignee as watchers
  - Include watchers in all task notifications
  - _Requirements: 1.4, 2.2, 3.2, 5.2_

## 7. Notification Integration

- [x] 7.1 Create task notification helper functions
  - Build `notifyTaskAssignment(taskId, assigneeId, assignorId)` function
  - Build `notifyTaskStatusChange(taskId, oldStatus, newStatus)` function
  - Build `notifyTaskComment(taskId, commentId, mentionedUserIds)` function
  - Build `notifyTaskDueSoon(taskId)` function for tasks due within 24 hours
  - Build `notifyTaskOverdue(taskId)` function for overdue tasks
  - Use existing `POST /api/notifications` endpoint
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2, 5.2, 11.4_

- [x] 7.2 Implement notification preferences
  - Create `GET /api/tasks/notification-preferences` - Get user preferences
  - Create `PUT /api/tasks/notification-preferences` - Update preferences
  - Support immediate, hourly, daily digest options
  - Support per-event-type notification toggles
  - _Requirements: 11.1, 11.5_

- [x] 7.3 Create notification digest system
  - Build background job to send hourly digests
  - Build background job to send daily digests
  - Group notifications by task and event type
  - Respect user notification preferences
  - _Requirements: 11.1, 11.2_

## 8. Task Creation Form Component

- [x] 8.1 Build TaskCreateForm component
  - Create modal/drawer form with all task fields
  - Add title input with validation (required, max 255 chars)
  - Add description textarea (plain text or simple markdown)
  - Add priority selector (low, medium, high, critical)
  - Add due date picker
  - Add assignee selector with search (fetch from `/api/users`)
  - Add department selector (default to user's department)
  - Add label multi-select (fetch from `/api/task-labels`)
  - Add watcher multi-select (fetch from `/api/users`)
  - Implement form validation
  - Handle form submission to `POST /api/tasks`
  - Show success/error notifications using toast
  - Clear form and close modal on success
  - _Requirements: 1.1, 1.2, 1.4_

## 9. Task List View Component

- [x] 9.1 Build TaskListView component (my-tasks page)
  - Create table-based layout with columns: title, status, priority, assignee, due date, labels
  - Fetch tasks from `GET /api/tasks`
  - Implement sortable columns
  - Add status badge with color coding
  - Add priority indicator
  - Show assignee avatar and name
  - Display due date with overdue highlighting
  - Show label chips
  - Add row click to open task detail modal
  - Implement pagination or infinite scroll
  - _Requirements: 7.1, 7.4_

- [x] 9.2 Add filtering to task list
  - Create filter panel component
  - Add status filter (multi-select)
  - Add priority filter (multi-select)
  - Add assignee filter (searchable select)
  - Add department filter
  - Add label filter (multi-select)
  - Add date range filter (due date)
  - Add "My Tasks" quick filter
  - Add "Overdue" quick filter
  - Add "High Priority" quick filter
  - Persist filters in URL query params
  - _Requirements: 4.4, 13.3_

- [x] 9.3 Add search functionality
  - Create search input component
  - Implement full-text search across title, description, comments
  - Highlight matching text in results
  - Show search suggestions
  - _Requirements: 13.1, 13.2_

## 10. Kanban Board Component

- [x] 10.1 Build TaskBoard component with drag-and-drop (task-progress page)
  - Create column-based layout (To Do, In Progress, Review, Done, Blocked, Cancelled)
  - Fetch tasks grouped by status from `GET /api/tasks`
  - Implement drag-and-drop using native HTML5 drag-and-drop
  - Show task count per column
  - Add quick-add button per column
  - Update existing task-progress/page.tsx with real data
  - _Requirements: 7.1, 7.2_

- [x] 10.2 Implement drag-and-drop status updates
  - Handle task drop event
  - Call `PATCH /api/tasks/[id]/status` on drop
  - Show optimistic UI update
  - Handle errors and revert on failure
  - Show confirmation for blocked status
  - _Requirements: 3.1, 7.2_

- [x] 10.3 Build TaskCard component for Kanban
  - Display task title, description preview
  - Show priority indicator (color-coded border or badge)
  - Show assignee avatar
  - Show due date badge (with overdue warning)
  - Show comment count icon
  - Show attachment count icon
  - Show label chips
  - Add click handler to open task detail
  - _Requirements: 7.1_

## 11. Task Detail Modal Component

- [x] 11.1 Build TaskDetailModal component
  - Create modal with full task information
  - Display task number, title, description
  - Show status with edit capability
  - Show priority with edit capability
  - Show due date with date picker
  - Show assignee with change capability
  - Show department
  - Show created by and created date
  - Show labels with add/remove capability
  - Show watchers with add/remove capability
  - Add close button
  - Integrate with my-tasks and task-progress pages
  - _Requirements: 1.1, 3.1, 12.1_

- [ ] 11.2 Complete comments section in task detail modal
  - Verify comments display with user avatar, name, timestamp
  - Ensure comment input with submit button works
  - Add @mentions with autocomplete functionality
  - Add edit/delete buttons for own comments
  - Implement comment refresh after submission
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 11.3 Complete attachments section in task detail modal
  - Verify attachments list displays file name, size, uploader, date
  - Ensure file upload button works
  - Add upload progress indicator
  - Verify download button per attachment
  - Add delete button for own attachments
  - _Requirements: 1.4, 5.5_

- [ ] 11.4 Complete activity log in task detail modal
  - Verify activity feed displays chronologically
  - Ensure all task changes are logged (status, assignment, priority, etc.)
  - Format activity messages clearly
  - Show user, action, timestamp for each activity
  - _Requirements: 3.3_

## 12. Subtasks and Dependencies

- [ ] 12.1 Create subtasks API endpoints
  - Create `POST /api/tasks/[id]/subtasks` - Create subtask (sets parent_task_id)
  - Create `GET /api/tasks/[id]/subtasks` - List subtasks
  - Create `DELETE /api/tasks/[id]/subtasks/[subtaskId]` - Remove subtask relationship
  - Validate subtask operations
  - _Requirements: 9.1_

- [ ] 12.2 Add subtasks UI to task detail modal
  - Display subtasks list in task detail
  - Add button to create new subtask
  - Show subtask completion status
  - Calculate parent task progress based on subtask completion
  - Notify when all subtasks completed
  - _Requirements: 9.1, 9.2_

- [ ] 12.3 Create task dependencies API endpoints
  - Create `POST /api/tasks/[id]/dependencies` - Add dependency
  - Create `GET /api/tasks/[id]/dependencies` - List dependencies
  - Create `DELETE /api/tasks/[id]/dependencies/[dependencyId]` - Remove dependency
  - Validate no circular dependencies
  - _Requirements: 9.3, 9.4_

- [ ] 12.4 Add dependencies UI to task detail modal
  - Display prerequisite and dependent tasks
  - Add UI to create/remove dependencies
  - Show dependency status
  - Prevent starting dependent task until prerequisite complete
  - Show dependency graph visualization (optional)
  - _Requirements: 9.3, 9.4_

## 13. Time Tracking

- [ ] 13.1 Implement time tracking API
  - Create `POST /api/tasks/[id]/time-entries` - Log time
  - Create `GET /api/tasks/[id]/time-entries` - Get time entries
  - Create `PUT /api/tasks/[id]/time-entries/[entryId]` - Update time entry
  - Create `DELETE /api/tasks/[id]/time-entries/[entryId]` - Delete time entry
  - Validate time entries are reasonable
  - Calculate total time logged per task
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 13.2 Add time tracking UI to task detail
  - Add time tracker with start/stop buttons
  - Display total time logged
  - Display estimated time remaining
  - Show time entries list with date, hours, user, description
  - Add manual time entry form
  - _Requirements: 14.1, 14.2, 14.4_

- [ ] 13.3 Create time tracking reports
  - Build time report API endpoint
  - Aggregate time by user, task, date range
  - Export time reports to CSV
  - _Requirements: 14.5_

## 14. Task Templates

- [ ] 14.1 Implement task templates API
  - Create `GET /api/task-templates` - List templates (filtered by department)
  - Create `POST /api/task-templates` - Create template
  - Create `GET /api/task-templates/[id]` - Get template
  - Create `PUT /api/task-templates/[id]` - Update template
  - Create `DELETE /api/task-templates/[id]` - Delete template
  - Store default fields, labels, checklist items
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 14.2 Build template management UI
  - Create template list page at `/pages/admin/task-templates` or `/pages/hr/task-templates`
  - Create template creation form
  - Create template edit form
  - Add template preview
  - Support department-specific templates
  - _Requirements: 6.1, 6.4, 6.5_

- [ ] 14.3 Add template selection to task creation
  - Add template dropdown to TaskCreateForm
  - Fetch templates from `/api/task-templates`
  - Pre-fill form fields when template selected
  - _Requirements: 6.2_

## 15. Calendar View

- [ ] 15.1 Build TaskCalendarView component
  - Create monthly calendar layout at `/pages/user/task-tracking/calendar`
  - Position tasks on calendar by due date
  - Color-code tasks by priority or status
  - Support drag-and-drop to reschedule
  - Add day/week/month view toggle
  - Show task count per day
  - Click day to see all tasks
  - Click task to open detail modal
  - _Requirements: 7.1, 7.5_

## 16. Analytics Dashboard

- [ ] 16.1 Implement analytics API endpoints
  - Create `GET /api/tasks/analytics/completion-rate` - Get completion metrics by time period
  - Create `GET /api/tasks/analytics/workload` - Get team workload distribution
  - Create `GET /api/tasks/analytics/overdue` - Get overdue tasks list and trends
  - Create `GET /api/tasks/analytics/average-completion-time` - Get avg completion time by priority
  - Create `GET /api/tasks/analytics/export` - Export analytics data (CSV/PDF)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16.2 Build TaskAnalytics dashboard component
  - Create analytics page at `/pages/admin/task-analytics` or `/pages/hr/task-analytics`
  - Add completion rate chart (line/bar graph)
  - Add task distribution pie chart (by status)
  - Add team workload visualization (bar chart)
  - Add overdue tasks list
  - Add average completion time metrics
  - Add date range selector
  - Add export button
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## 17. HRMS Integration

- [ ] 17.1 Create onboarding task automation
  - Build function to create onboarding tasks from template
  - Trigger on new employee creation
  - Assign tasks to HR, IT, manager based on template
  - Set due dates relative to joining date
  - _Requirements: 10.1_

- [ ] 17.2 Create leave handover task automation
  - Build function to create handover tasks on leave approval
  - Check if handover tasks are configured for department
  - Assign to team members
  - Set due date before leave start date
  - _Requirements: 10.2_

- [ ] 17.3 Create performance review task automation
  - Build function to create review tasks at review period start
  - Assign to managers for their direct reports
  - Set due dates based on review schedule
  - _Requirements: 10.3_

- [ ] 17.4 Create exit process task automation
  - Build function to create exit tasks on separation initiation
  - Assign to HR, IT, finance, manager
  - Set due dates relative to last working day
  - _Requirements: 10.4_

- [ ] 17.5 Add HRMS integration configuration
  - Create admin page to configure task automation rules
  - Map HRMS events to task templates
  - Configure assignment rules by department and role
  - _Requirements: 10.5_

## 18. Archive System

- [ ] 18.1 Implement task archiving
  - Create background job to auto-archive completed tasks after configured period
  - Create `POST /api/tasks/[id]/archive` endpoint for manual archiving
  - Create `POST /api/tasks/[id]/restore` endpoint to restore archived tasks
  - Filter archived tasks from default views
  - _Requirements: 15.1, 15.2_

- [ ] 18.2 Build archived tasks view
  - Create archived tasks page at `/pages/user/task-tracking/archived`
  - Support same search and filter capabilities
  - Show archived indicator clearly
  - Add restore button
  - _Requirements: 15.3, 15.4, 15.5_

## 19. Advanced Search and Saved Filters

- [ ] 19.1 Enhance search functionality
  - Improve search to include full-text search across comments
  - Add search result highlighting
  - Rank results by relevance
  - Add search history
  - _Requirements: 13.1, 13.2, 13.5_

- [ ] 19.2 Implement saved filters
  - Create `GET /api/tasks/saved-filters` - List user's saved filters
  - Create `POST /api/tasks/saved-filters` - Save current filter
  - Create `DELETE /api/tasks/saved-filters/[id]` - Delete saved filter
  - Store filter criteria as JSON
  - Add UI to save/load filters in my-tasks page
  - _Requirements: 13.4_

## 20. Bulk Operations

- [ ] 20.1 Implement bulk task operations API
  - Create `POST /api/tasks/bulk/update-status` - Update status for multiple tasks
  - Create `POST /api/tasks/bulk/assign` - Reassign multiple tasks
  - Create `POST /api/tasks/bulk/add-label` - Add label to multiple tasks
  - Create `POST /api/tasks/bulk/delete` - Delete multiple tasks
  - Send consolidated notifications
  - _Requirements: 12.4_

- [ ] 20.2 Add bulk operations UI
  - Add multi-select checkboxes to task list (my-tasks page)
  - Add bulk action toolbar
  - Show selected count
  - Add confirmation dialogs
  - _Requirements: 12.4_

---

## Implementation Notes

### Current Implementation Status

The core task management system is **fully functional** with the following features:

**✅ Completed:**
1. **Database Schema**: All tables created and relationships established
2. **Core APIs**: Full CRUD operations for tasks, comments, attachments, labels, watchers
3. **Task Creation**: Complete form with all fields, validation, and submission
4. **Task List View**: My Tasks page with filtering, search, and sorting
5. **Kanban Board**: Drag-and-drop functionality with optimistic updates
6. **Task Detail Modal**: Basic structure with task information display
7. **Notifications**: Helper functions, preferences, and digest system

**🔄 Next Priority Tasks:**

To complete the MVP, focus on these tasks in order:

1. **Task 11.2-11.4**: Complete the task detail modal sections (comments, attachments, activity log)
2. **Task 12.1-12.4**: Implement subtasks and dependencies management
3. **Task 13.1-13.2**: Add time tracking functionality
4. **Task 14.1-14.3**: Implement task templates
5. **Task 15.1**: Build calendar view
6. **Task 16.1-16.2**: Create analytics dashboard

**⏳ Future Enhancements:**

These can be implemented after the MVP is complete:
- HRMS integration automation (Task 17)
- Archive system (Task 18)
- Advanced search and saved filters (Task 19)
- Bulk operations (Task 20)
