import React from 'react';

interface LeaveApprovalLetterProps {
  data: {
    salutation: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    leaveDuration: string;
    approvedBy: string;
    companyName: string;
  };
}

export const LeaveApprovalLetter: React.FC<LeaveApprovalLetterProps> = ({ data }) => {
  const capitalizeWords = (str: string = '') => {
    return String(str)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const capitalizedName = capitalizeWords(data.employeeName);
  const capitalizedApprover = capitalizeWords(data.approvedBy);
  const capitalizedCompany = capitalizeWords(data.companyName);
  const startDate = formatDate(data.startDate);
  const endDate = formatDate(data.endDate);

  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000', fontSize: '14px' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <img src="/Demandify1.png" alt="Demandify Logo" style={{ width: '120px', height: 'auto' }} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.08,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      >
        <img src="/demandify.png" alt="Watermark" style={{ width: '400px', height: 'auto' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '80px' }}>
          Leave Approval Letter
        </h3>
        <br />

        <p>
          Dear{' '}
          <b>
            {data.salutation}. {capitalizedName}
          </b>
          ,
        </p>
        <br />

        <p>
          This is to inform you that your request for <b>{data.leaveType}</b> has been approved.
        </p>
        <br />

        <p>
          <strong>Leave Details:</strong>
        </p>
        <p>
          <strong>Leave Type:</strong> {data.leaveType}
          <br />
          <strong>Start Date:</strong> {startDate}
          <br />
          <strong>End Date:</strong> {endDate}
          <br />
          <strong>Duration:</strong> {data.leaveDuration} day(s)
          <br />
          <strong>Approved By:</strong> {capitalizedApprover}
        </p>
        <br />

        <p>
          Please ensure that all pending work is completed or delegated before your leave period. You are requested to
          hand over your responsibilities to your team members and brief them about any ongoing tasks.
        </p>
        <br />

        <p>
          If you need to extend your leave for any reason, please inform us in advance and obtain the necessary
          approval.
        </p>
        <br />

        <p>We wish you a pleasant time off.</p>
        <br />
        <br />

        <p>
          Sincerely,
          <br />
          <b>{capitalizedApprover}</b>
          <br />
          Manager
          <br />
          <b>{capitalizedCompany}</b>
        </p>
      </div>
    </div>
  );
};
