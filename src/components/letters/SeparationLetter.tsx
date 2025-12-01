import React from 'react';

interface SeparationLetterProps {
  data: {
    salutation: string;
    employeeName: string;
    terminationDate: string;
    terminationReason: string;
    confidentialityTerms: string;
    managerName: string;
    companyName: string;
  };
}

export const SeparationLetter: React.FC<SeparationLetterProps> = ({ data }) => {
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

  const capitalizedManager = capitalizeWords(data.managerName);
  const capitalizedCompany = capitalizeWords(data.companyName);
  const terminationDate = formatDate(data.terminationDate);

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
        <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '50px' }}>Separation Letter</h3>
        <br />

        <p>
          Dear{' '}
          <b>
            {data.salutation} {capitalizeWords(data.employeeName)}
          </b>
          ,
        </p>
        <br />

        <p>
          This letter is to formally notify you that your employment with <b>{capitalizedCompany}</b> will be terminated
          effective <b>{terminationDate}</b> due to <b>{data.terminationReason}</b>.
        </p>
        <br />

        <p>
          We would also like to remind you of the confidentiality agreement that you signed upon your employment, and
          reaffirm that you are expected to uphold the following terms: <b>{data.confidentialityTerms}</b>.
        </p>
        <br />

        <p>
          Please ensure that all company property, including your ID card, laptop, and any other company assets, are
          returned on or before your last working day.
        </p>
        <br />

        <p>
          We thank you for your contributions to the company and wish you the best in your future endeavors. Should you
          need any clarification or have further questions regarding the separation process, feel free to contact me.
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
