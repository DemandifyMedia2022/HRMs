import React from 'react';

interface JoiningLetterProps {
  data: {
    salutation: string;
    employeeName: string;
    designation: string;
    department: string;
    joiningDate: string;
    joiningTime: string;
    reportingManager: string;
    location: string;
  };
}

export const JoiningLetter: React.FC<JoiningLetterProps> = ({ data }) => {
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

  const formatTimeTo12Hour = (time: string = '') => {
    if (!time) return '';
    const [hours, minutes] = String(time).split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const capitalizedName = capitalizeWords(data.employeeName);
  const capitalizedDesignation = capitalizeWords(data.designation);
  const capitalizedDepartment = capitalizeWords(data.department);
  const capitalizedManager = capitalizeWords(data.reportingManager);
  const capitalizedLocation = capitalizeWords(data.location);
  const joiningDate = formatDate(data.joiningDate);
  const formattedTime = formatTimeTo12Hour(data.joiningTime);

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
        <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '80px' }}>Joining Letter</h2>
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
          We are pleased to welcome you to Demandify Media Private Limited as a <b>{capitalizedDesignation}</b> in the{' '}
          <b>{capitalizedDepartment}</b> department.
        </p>
        <br />

        <p>
          <strong>Joining Details:</strong>
        </p>
        <p>
          <strong>Date:</strong> {joiningDate}
          <br />
          <strong>Time:</strong> {formattedTime}
          <br />
          <strong>Location:</strong> {capitalizedLocation}
          <br />
          <strong>Reporting Manager:</strong> {capitalizedManager}
        </p>
        <br />

        <p>
          <strong>Documents to Bring:</strong>
        </p>
        <ul>
          <li>Government-issued ID proof (Aadhar Card/PAN Card)</li>
          <li>Educational certificates and mark sheets</li>
          <li>Previous employment documents (if applicable)</li>
          <li>Passport size photographs (2 copies)</li>
          <li>Bank account details for salary transfer</li>
        </ul>
        <br />

        <p>
          Please report to the HR department on your first day. Our HR team will guide you through the onboarding
          process and help you settle in.
        </p>
        <br />

        <p>We look forward to having you as part of our team and wish you a successful career with us.</p>
        <br />
        <br />

        <p>
          <strong>With Best Wishes,</strong>
          <br />
          Sincerely yours,
          <br />
          <br />
          <br />
          <strong>Co-Founder</strong>
          <br />
          <strong>Sunny Ashpal</strong>
          <br />
          Demandify Media Private Limited
        </p>
      </div>
    </div>
  );
};
