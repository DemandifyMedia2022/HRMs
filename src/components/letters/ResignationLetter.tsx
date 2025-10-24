import React from 'react'

interface ResignationLetterProps {
  data: {
    salutation: string
    employeeName: string
    resignationDate: string
    lastWorkingDay: string
    managerName: string
    companyName: string
  }
}

export const ResignationLetter: React.FC<ResignationLetterProps> = ({ data }) => {
  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const capitalizedName = capitalizeWords(data.employeeName)
  const capitalizedManager = capitalizeWords(data.managerName)
  const capitalizedCompany = capitalizeWords(data.companyName)
  const resignationDate = formatDate(data.resignationDate)
  const lastWorkingDay = formatDate(data.lastWorkingDay)

  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000', fontSize: '14px' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <img src="/Demandify1.png" alt="Demandify Logo" style={{ width: '120px', height: 'auto' }} />
      </div>
      
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        opacity: 0.08, 
        zIndex: 0, 
        pointerEvents: 'none' 
      }}>
        <img src="/demandify.png" alt="Watermark" style={{ width: '400px', height: 'auto' }} />
      </div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '80px' }}>
          Resignation Acceptance Letter
        </h3>
        <br />
        
        <p>Dear <b>{data.salutation}. {capitalizedName}</b>,</p>
        <br />
        
        <p>
          We have received your resignation letter dated <b>{resignationDate}</b>, and we acknowledge 
          and accept your decision to resign from your position at <b>{capitalizedCompany}</b>.
        </p>
        <br />
        
        <p>
          Your last working day will be <b>{lastWorkingDay}</b>. We appreciate the professionalism you 
          have shown during your tenure and wish to thank you for your valuable contributions to the company.
        </p>
        <br />
        
        <p>
          We will process all the necessary paperwork related to your final settlement, including any 
          outstanding salary, unused leave encashment, and other benefits that you are entitled to. 
          Please make sure to return all company property, including your laptop, access cards, and 
          other belongings, before your last working day.
        </p>
        <br />
        
        <p>
          We truly appreciate your efforts and contributions during your time here, and we wish you 
          continued success in your future endeavors.
        </p>
        <br />
        
        <p>
          If you have any questions during this transition period, please feel free to reach out to 
          me or the HR department.
        </p>
        <br /><br />
        
        <p>
          Sincerely,<br />
          <b>{capitalizedManager}</b><br />
          Manager<br />
          <b>{capitalizedCompany}</b>
        </p>
      </div>
    </div>
  )
}
