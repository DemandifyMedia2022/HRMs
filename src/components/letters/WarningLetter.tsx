import React from 'react'

interface WarningLetterProps {
  data: {
    salutation: string
    employeeName: string
    issueDescription: string
    consequences: string
    warningDate: string
    managerName: string
    companyName: string
  }
}

export const WarningLetter: React.FC<WarningLetterProps> = ({ data }) => {
  const capitalizeWords = (str: string = "") => {
    return String(str).split(' ').map(word => 
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
  const warningDate = formatDate(data.warningDate)

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
          Warning Letter
        </h3>
        <br />
        
        <p>Dear <b>{data.salutation}. {capitalizedName}</b>,</p>
        <br />
        
        <p>
          This letter serves as a formal warning regarding your actions related to{' '}
          <b>{data.issueDescription}</b>. This behavior violates company policies, and it has been 
          noted in your employee record as of <b>{warningDate}</b>.
        </p>
        <br />
        
        <p>
          We expect all employees to adhere to our company's code of conduct and performance standards. 
          Failure to correct this behavior will result in further disciplinary actions, including but 
          not limited to <b>{data.consequences}</b>.
        </p>
        <br />
        
        <p>
          If you have any questions regarding this matter or need clarification on company policies, 
          feel free to reach out to me or the HR department.
        </p>
        <br />
        
        <p>We hope to see an improvement in your performance and behavior going forward.</p>
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
