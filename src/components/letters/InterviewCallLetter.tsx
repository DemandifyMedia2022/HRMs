import React from 'react';

interface InterviewCallLetterProps {
  data: {
    salutation: string;
    candidateName: string;
    position: string;
    interviewDate: string;
    interviewTime: string;
    interviewLocation: string;
    contactPerson: string;
    managerName: string;
    companyName: string;
  };
}

export const InterviewCallLetter: React.FC<InterviewCallLetterProps> = ({ data }) => {
  const capitalizeWords = (str: string = '') => {
    return String(str)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatTimeTo12Hour = (time: string = '') => {
    if (!time) return '';
    const [hours, minutes] = String(time).split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const capitalizedName = capitalizeWords(data.candidateName);
  const capitalizedPosition = capitalizeWords(data.position);
  const capitalizedContact = capitalizeWords(data.contactPerson);
  const capitalizedManager = capitalizeWords(data.managerName);
  const formattedTime = formatTimeTo12Hour(data.interviewTime);

  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000' }}>
     
     <div style={{display:'flex'}}>
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
    </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ textAlign: 'center', fontSize: '16px', marginTop: '50px', fontWeight: 600 }}>
          Confirmation of Interview Schedule – Demandify Media Pvt. Ltd
        </h3>
        <br />

        <p style={{ marginTop: '10px' }}>
          <strong>Date:</strong> {data.interviewDate}
        </p>
        <br />

        <p>
          <strong>To:</strong>
          <br />
          <b>
            {data.salutation} {capitalizedName}
          </b>
        </p>
        <br />

        <p>
          Dear {capitalizedName},
        </p>
        

        <p>
          We are pleased to inform you that you have been shortlisted for an interview for the position of{' '}
          <b>{capitalizedPosition}</b> at <b>{data.companyName}</b>. Your interview is scheduled for{' '}
          <b>{data.interviewDate}</b> at <b>{formattedTime}</b>.
        </p>
        <br />

        <p>
          The interview will be held at the following address:
          <br />
          <b>{data.interviewLocation}</b>
        </p>
        <br />

        <p>
          You are requested to bring a copy of your resume and any other relevant documents. You will be meeting with{' '}
          <b>{capitalizedContact}</b>, who will guide you through the process.
        </p>
        <br />

        <p>We look forward to meeting you and discussing how your skills and experiences align with our needs.</p>
        <br />

        <p>
          Best regards,
          <br />
          {capitalizedManager}
          <br />
          HR Manager
          <br />
          <b>{data.companyName}</b>
        </p>
      </div>
    </div>
  );
};
