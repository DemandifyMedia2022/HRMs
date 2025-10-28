import React from 'react';

interface PromotionLetterProps {
  data: {
    salutation: string;
    employeeName: string;
    currentPosition: string;
    newPosition: string;
    effectiveDate: string;
    responsibilities: string;
    salaryIncrement: string;
    managerName: string;
    companyName: string;
  };
}

export const PromotionLetter: React.FC<PromotionLetterProps> = ({ data }) => {
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
  const capitalizedNewPosition = capitalizeWords(data.newPosition);
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
        <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '80px' }}>Promotion Letter</h3>
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
          Congratulations! We are pleased to inform you that you have been promoted to the position of{' '}
          <b>{capitalizedNewPosition}</b> at <b>{capitalizedCompany}</b>, effective <b>{effectiveDate}</b>. This
          promotion is a reflection of your hard work, dedication, and the positive contributions you have made to the
          company.
        </p>
        <br />

        <p>
          In your new role, you will report to <b>{capitalizedManager}</b> and will be responsible for{' '}
          {data.responsibilities}. Your new compensation package includes a salary increase of{' '}
          <b>{data.salaryIncrement}</b>, along with the benefits and perks you are currently entitled to.
        </p>
        <br />

        <p>
          We are confident that you will excel in your new role and continue to be a valuable asset to our team. We look
          forward to your continued success at <b>{capitalizedCompany}</b>.
        </p>
        <br />

        <p>Please feel free to reach out to me or your HR if you have any questions regarding your new role.</p>
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
