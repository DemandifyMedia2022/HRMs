export type HelpUserRole = 'admin' | 'hr' | 'user';

export type HelpTopic = {
  id: string;
  title: string;
  description: string;
  url: string;
  role: HelpUserRole | 'all';
};

export const helpTopics: HelpTopic[] = [
  {
    id: 'admin-dashboard',
    title: 'Admin dashboard overview',
    description: 'View summary of attendance, leaves, tickets and campaigns for all employees.',
    url: '/pages/admin',
    role: 'admin'
  },
  {
    id: 'admin-attendance-list',
    title: 'View employee attendance (admin)',
    description: 'See attendance for all employees for a selected period.',
    url: '/pages/admin/attendance',
    role: 'admin'
  },
  {
    id: 'admin-attendance-update',
    title: 'Update employee attendance (admin)',
    description: 'Update attendance records like Present, Absent, Half-day etc.',
    url: '/pages/admin/attendance/update',
    role: 'admin'
  },
  {
    id: 'admin-attendance-requests',
    title: 'Review attendance requests (admin)',
    description: 'Approve or reject employee attendance correction requests.',
    url: '/pages/admin/attendance/requests',
    role: 'admin'
  },
  {
    id: 'admin-assign-shift',
    title: 'Assign shift (admin)',
    description: 'Allocate shifts to employees.',
    url: '/pages/admin/attendance/assign-shift',
    role: 'admin'
  },
  {
    id: 'admin-leaves',
    title: 'Manage leaves (admin)',
    description: 'Review and manage leave applications for employees.',
    url: '/pages/admin/leaves',
    role: 'admin'
  },
  {
    id: 'admin-raise-ticket',
    title: 'Raise ticket (admin)',
    description: 'Create a new support ticket.',
    url: '/pages/admin/tickets/raise',
    role: 'admin'
  },
  {
    id: 'admin-ticket-status',
    title: 'Check ticket status (admin)',
    description: 'Track status of raised tickets.',
    url: '/pages/admin/tickets/status',
    role: 'admin'
  },
  {
    id: 'admin-payslip',
    title: 'View payslip (admin)',
    description: 'View payslip details for employees.',
    url: '/pages/admin/payroll/payslip',
    role: 'admin'
  },
  {
    id: 'admin-my-salary-structure',
    title: 'My salary structure (admin)',
    description: 'View your own salary structure as an admin.',
    url: '/pages/admin/payroll/my-salary-structure',
    role: 'admin'
  },
  {
    id: 'admin-employee-salary-structure',
    title: 'Employee salary structure (admin)',
    description: 'View and manage salary structure of employees.',
    url: '/pages/admin/payroll/employee-salary-structure',
    role: 'admin'
  },
  {
    id: 'admin-tax',
    title: 'Tax details (admin)',
    description: 'View tax related information for employees.',
    url: '/pages/admin/payroll/tax',
    role: 'admin'
  },
  {
    id: 'admin-all-employees',
    title: 'All employees list (admin)',
    description: 'View list of all employees in the organization.',
    url: '/pages/admin/employees/employee-details',
    role: 'admin'
  },
  {
    id: 'admin-add-employee',
    title: 'Add new employee (admin)',
    description: 'Create a new employee record.',
    url: '/pages/admin/employees/new',
    role: 'admin'
  },
  {
    id: 'admin-employee-settlement',
    title: 'Employee settlement (admin)',
    description: 'Process full and final settlement for employees.',
    url: '/pages/admin/employees/settlement',
    role: 'admin'
  },
  {
    id: 'admin-settlement-history',
    title: 'Settlement history (admin)',
    description: 'View settlement history for employees.',
    url: '/pages/admin/employees/history',
    role: 'admin'
  },
  {
    id: 'user-dashboard',
    title: 'User dashboard overview',
    description: 'View your personal HR summary: attendance, leaves, payroll and tickets.',
    url: '/pages/user',
    role: 'user'
  },
  {
    id: 'user-monthly-attendance',
    title: 'View my attendance (user)',
    description: 'Check your monthly attendance summary.',
    url: '/pages/user/attendance',
    role: 'user'
  },
  {
    id: 'user-request-attendance-update',
    title: 'Request attendance update (user)',
    description: 'Raise a request to correct your attendance.',
    url: '/pages/user/attendance/request-update',
    role: 'user'
  },
  {
    id: 'user-attendance-status',
    title: 'Attendance request status (user)',
    description: 'Track status of your attendance correction requests.',
    url: '/pages/user/attendance/status',
    role: 'user'
  },
  {
    id: 'user-new-leave',
    title: 'Apply for leave (user)',
    description: 'Submit a new leave application.',
    url: '/pages/user/leaves/new',
    role: 'user'
  },
  {
    id: 'user-available-leaves',
    title: 'Check leave balance (user)',
    description: 'View your available leave balance.',
    url: '/pages/user/leaves/available',
    role: 'user'
  },
  {
    id: 'user-payslip',
    title: 'View my payslip (user)',
    description: 'Download or view your monthly payslip.',
    url: '/pages/user/payroll/payslip',
    role: 'user'
  },
  {
    id: 'user-salary-structure',
    title: 'View my salary structure (user)',
    description: 'See the breakdown of your salary components.',
    url: '/pages/user/payroll/salary-structure',
    role: 'user'
  },
  {
    id: 'user-raise-ticket',
    title: 'Raise ticket (user)',
    description: 'Create a ticket for HR, IT or admin support.',
    url: '/pages/user/tickets/raise',
    role: 'user'
  },
  {
    id: 'user-ticket-status',
    title: 'Check my ticket status (user)',
    description: 'Track the status of tickets you have raised.',
    url: '/pages/user/tickets/status',
    role: 'user'
  },
  {
    id: 'hr-dashboard',
    title: 'HR dashboard overview',
    description: 'View HR level summary for attendance, leaves, payroll and tickets.',
    url: '/pages/hr',
    role: 'hr'
  },
  {
    id: 'hr-monthly-attendance',
    title: 'View attendance (HR)',
    description: 'View monthly attendance summary for employees.',
    url: '/pages/hr/attendance',
    role: 'hr'
  },
  {
    id: 'hr-attendance-update',
    title: 'Update attendance (HR)',
    description: 'Update or correct attendance entries.',
    url: '/pages/hr/attendance/update',
    role: 'hr'
  },
  {
    id: 'hr-assign-shift',
    title: 'Assign shift (HR)',
    description: 'Assign shifts to employees.',
    url: '/pages/hr/attendance/assign-shift',
    role: 'hr'
  },
  {
    id: 'hr-request-attendance-update',
    title: 'Request attendance update (HR)',
    description: 'Raise an attendance update request as HR user.',
    url: '/pages/hr/attendance/request-update',
    role: 'hr'
  },
  {
    id: 'hr-attendance-status',
    title: 'Attendance update status (HR)',
    description: 'View status of attendance update requests.',
    url: '/pages/hr/attendance/status',
    role: 'hr'
  },
  {
    id: 'hr-new-leave',
    title: 'Apply for leave (HR)',
    description: 'Submit a new leave request as HR user.',
    url: '/pages/hr/leaves/new',
    role: 'hr'
  },
  {
    id: 'hr-available-leaves',
    title: 'Check leave balance (HR)',
    description: 'View available leave balance for HR user.',
    url: '/pages/hr/leaves/available',
    role: 'hr'
  },
  {
    id: 'hr-all-leaves',
    title: 'View all leaves (HR)',
    description: 'View all employee leave applications.',
    url: '/pages/hr/leaves',
    role: 'hr'
  },
  {
    id: 'hr-payslip',
    title: 'View payslip (HR)',
    description: 'View payslip related data for HR.',
    url: '/pages/hr/payroll/payslip',
    role: 'hr'
  },
  {
    id: 'hr-my-salary-structure',
    title: 'My salary structure (HR)',
    description: 'View your own salary structure.',
    url: '/pages/hr/payroll/my-salary-structure',
    role: 'hr'
  },
  {
    id: 'hr-employee-salary-structure',
    title: 'Employee salary structure (HR)',
    description: 'View and manage salary structure of employees as HR.',
    url: '/pages/hr/payroll/employee-salary-structure',
    role: 'hr'
  },
  {
    id: 'hr-employee-expenses',
    title: 'Employee expenses / tax (HR)',
    description: 'View employee expenses and tax related information.',
    url: '/pages/hr/payroll/tax',
    role: 'hr'
  },
  {
    id: 'hr-raise-ticket',
    title: 'Raise ticket (HR)',
    description: 'Create a new ticket from HR view.',
    url: '/pages/hr/tickets/raise',
    role: 'hr'
  },
  {
    id: 'hr-ticket-status',
    title: 'Ticket status (HR)',
    description: 'Check status of tickets raised from HR.',
    url: '/pages/hr/tickets/status',
    role: 'hr'
  },
  {
    id: 'hr-bank-challan',
    title: 'Bank challan (HR)',
    description: 'Access payroll bank challan generation and data.',
    url: '/pages/hr/bank-challan',
    role: 'hr'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'View system wide notifications.',
    url: '/pages/notifications',
    role: 'all'
  },
  {
    id: 'survey-form',
    title: 'Survey form',
    description: 'Open the employee survey form.',
    url: '/pages/survey-form',
    role: 'all'
  }
];
