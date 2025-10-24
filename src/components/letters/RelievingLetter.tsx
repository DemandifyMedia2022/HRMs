import React from 'react'

interface RelievingLetterProps {
  data: {
    salutation: string
    employeeName: string
    designation: string
    location: string
    joiningDate: string
    relievingDate: string
    issueDate: string
  }
}

export const RelievingLetter: React.FC<RelievingLetterProps> = ({ data }) => {
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
  const capitalizedLocation = capitalizeWords(data.location)
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
        <p><strong>Name:</strong> {data.salutation}. {capitalizedName}</p>
        <p><strong>Designation:</strong> {capitalizedDesignation}</p>
        <p><strong>Location:</strong> {capitalizedLocation}</p>
        <br />
        
        <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600 }}>Relieving Letter</h2>
        <br />
        
        <p>
          This is to certify that <b>{capitalizedName}</b> has been relieved from {pronounPossessive} 
          duties as a <b>{capitalizedDesignation}</b> with Demandify Media Private Limited, effective 
          from <b>{relievingDate}</b>.
        </p>
        <br />
        
        <p>
          <b>{capitalizedName}</b> was associated with Demandify Media from <b>{joiningDate}</b> to{' '}
          <b>{relievingDate}</b>. During this period, {pronounSubject} has displayed dedication, 
          professionalism, and commitment to the responsibilities assigned.
        </p>
        <br />
        
        <p>
          We hereby relieve {pronounSubject} from all duties and responsibilities associated with 
          {pronounPossessive} position with us.
        </p>
        <br />
        
        <p>
          We wish {pronounSubject} all the best for future endeavors and success in {pronounPossessive} 
          career ahead.
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
