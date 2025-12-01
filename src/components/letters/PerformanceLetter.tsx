import React from 'react';

interface PerformanceLetterProps {
  data: {
    salutation: string;
    employeeName: string;
    reviewPeriod: string;
    reviewSummary: string;
    strengths: string;
    areasForImprovement: string;
    managerName: string;
    companyName: string;
  };
}

export const PerformanceLetter: React.FC<PerformanceLetterProps> = ({ data }) => {
  const capitalizeWords = (str: string = '') => {
    return String(str)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const capitalizedName = capitalizeWords(data.employeeName);
  const capitalizedManager = capitalizeWords(data.managerName);
  const capitalizedCompany = capitalizeWords(data.companyName);

  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000', fontSize: '14px' }}>
    <div style={{display:'flex' }}>
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
        <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '50px' }}>
          Performance Review Letter
        </h3>
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
          This letter serves to provide you with a formal review of your performance for the period{' '}
          <b>{data.reviewPeriod}</b>. We would like to take this opportunity to recognize your accomplishments and
          identify areas where further development would benefit both you and the company.
        </p>
        <br />

        <p>
          <strong>Overall Performance Summary:</strong>
        </p>
        <p>{data.reviewSummary}</p>
        <br />

        <p>
          <strong>Key Strengths:</strong>
        </p>
        <p>{data.strengths}</p>
        <br />

        <p>
          <strong>Areas for Improvement:</strong>
        </p>
        <p>{data.areasForImprovement}</p>
        <br />

        <p>
          We truly appreciate your hard work and contributions to <b>{capitalizedCompany}</b>. We encourage you to
          continue building on your strengths while addressing the areas for improvement noted in this review.
        </p>
        <br />

        <p>
          If you have any questions or would like to discuss your review in detail, please feel free to reach out to me.
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
