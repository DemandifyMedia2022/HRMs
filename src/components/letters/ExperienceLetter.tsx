import React from 'react'

interface ExperienceLetterProps {
  data: {
    salutation: string
    employeeName: string
    designation: string
    department: string
    joiningDate: string
    relievingDate: string
    issueDate: string
  }
}

export const ExperienceLetter: React.FC<ExperienceLetterProps> = ({ data }) => {
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
  const capitalizedDesignation = capitalizeWords(data.designation)
  const capitalizedDepartment = capitalizeWords(data.department)
  const joiningDate = formatDate(data.joiningDate)
  const relievingDate = formatDate(data.relievingDate)
  const issueDate = formatDate(data.issueDate)

  let pronounSubject = "he"
  let pronounPossessive = "his"
  if (data.salutation === "Mrs" || data.salutation === "Miss") {
    pronounSubject = "she"
    pronounPossessive = "her"
  }

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
        <p style={{ marginTop: '80px' }}><strong>Date:</strong> {issueDate}</p>
        <br />
        
        <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600 }}>
          To Whom It May Concern
        </h2>
        <br />
        
        <p>
          This is to certify that <b>{data.salutation}. {capitalizedName}</b> was employed with 
          Demandify Media Private Limited as a <b>{capitalizedDesignation}</b> in the{' '}
          <b>{capitalizedDepartment}</b> department.
        </p>
        <br />
        
        <p>
          {pronounSubject.charAt(0).toUpperCase() + pronounSubject.slice(1)} joined our organization 
          on <b>{joiningDate}</b> and worked with us till <b>{relievingDate}</b>.
        </p>
        <br />
        
        <p>
          During {pronounPossessive} tenure with us, {pronounSubject} has shown dedication, 
          professionalism, and commitment to {pronounPossessive} work. {pronounSubject.charAt(0).toUpperCase() + pronounSubject.slice(1)}{' '}
          has been a valuable asset to our team.
        </p>
        <br />
        
        <p>
          We wish {pronounSubject} all the best for {pronounPossessive} future endeavors.
        </p>
        <br /><br /><br />
        
        <p>
          <strong>With Best Wishes,</strong><br />
          Sincerely yours,<br /><br /><br />
          <strong>Co-Founder</strong><br />
          <strong>Sunny Ashpal</strong><br />
          Demandify Media Private Limited<br /><br />
          Date: {issueDate}
        </p>
      </div>
    </div>
  )
}
