import React from 'react';

interface SalaryIncrementLetterProps {
  data: {
    salutation: string;
    employeeName: string;
    currentSalary: string;
    newSalary: string;
    effectiveDate: string;
    managerName: string;
    companyName: string;
  };
}

export const SalaryIncrementLetter: React.FC<SalaryIncrementLetterProps> = ({ data }) => {
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
  const capitalizedManager = capitalizeWords(data.managerName);
  const capitalizedCompany = capitalizeWords(data.companyName);
  const effectiveDate = formatDate(data.effectiveDate);

  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000', fontSize: '14px' }}>
      {/* Logo */}
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <img src="/Demandify1.png" alt="Demandify Logo" style={{ width: '120px', height: 'auto' }} />
      </div>

      {/* Watermark */}
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

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '80px' }}>
          Salary Increment Letter
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
          We are pleased to inform you that, effective <b>{effectiveDate}</b>, your salary will be increased from{' '}
          <b>₹{data.currentSalary}</b> to <b>₹{data.newSalary}</b>. This salary adjustment reflects our recognition of
          your hard work, dedication, and the contributions you have made to <b>{capitalizedCompany}</b>.
        </p>
        <br />

        <p>
          Your new salary will be effective from <b>{effectiveDate}</b>, and you will see this reflected in your
          paycheck on the following pay cycle.
        </p>
        <br />

        <p>
          We are confident that you will continue to excel in your role, and we look forward to your ongoing success
          with <b>{capitalizedCompany}</b>.
        </p>
        <br />

        <p>
          Should you have any questions regarding this adjustment, please feel free to reach out to your manager,{' '}
          <b>{capitalizedManager}</b>.
        </p>
        <br />
        <br />

        <p>
          Sincerely,
          <br />
          <b>{capitalizedManager}</b>
          <br />
          Manager
          <br />
          <b>{capitalizedCompany}</b>
        </p>
      </div>
    </div>
  );
};
