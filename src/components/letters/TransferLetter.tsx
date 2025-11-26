import React from 'react';

interface TransferLetterProps {
  data: {
    salutation: string;
    employeeName: string;
    currentDepartment: string;
    newDepartment: string;
    newLocation: string;
    effectiveDate: string;
    managerName: string;
    companyName: string;
  };
}

export const TransferLetter: React.FC<TransferLetterProps> = ({ data }) => {
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
  const capitalizedNewDept = capitalizeWords(data.newDepartment);
  const capitalizedNewLocation = capitalizeWords(data.newLocation);
  const capitalizedManager = capitalizeWords(data.managerName);
  const capitalizedCompany = capitalizeWords(data.companyName);
  const effectiveDate = formatDate(data.effectiveDate);

  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000', fontSize: '14px' }}>
    
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
        <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '50px' }}>Transfer Letter</h3>
        <br />

        <p>
          Dear{' '}
          <b>
            {data.salutation} {capitalizedName}
          </b>
          ,
        </p>
        <br />

        <p>
          We are writing to inform you of your transfer to the <b>{capitalizedNewDept}</b> department at{' '}
          <b>{capitalizedNewLocation}</b>, effective from <b>{effectiveDate}</b>. This decision has been made
          considering your skills and the requirements of the new department.
        </p>
        <br />

        <p>
          In your new role, you will continue to report to <b>{capitalizedManager}</b> and be expected to meet the
          objectives outlined for your new department. Your compensation and benefits will remain unchanged during this
          transition.
        </p>
        <br />

        <p>
          We are confident that your experience and expertise will be a great fit for the <b>{capitalizedNewDept}</b>.
          Should you have any questions or concerns, please feel free to reach out to us.
        </p>
        <br />

        <p>
          We wish you success in your new role at <b>{capitalizedCompany}</b>.
        </p>
        <br />
        <br />

        <p>
          Sincerely,
          <br />
          <b>{capitalizedManager}</b>
          <br />
          Head Of Opeartion
          <br />
          <b>{capitalizedCompany}</b>
        </p>
      </div>
    </div>
  );
};
