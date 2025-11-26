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
      {/* Logo */}
     <div style={{display:'flex'}}>
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
          pointerEvents: 'none',
        }}
      >
        <img src="/demandify.png" alt="Watermark" style={{ width: '400px', height: 'auto' }} />
      </div>
 </div>
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top details block */}
        <p style={{ marginTop: '50px', marginBottom: '4px' }}><strong>Date:</strong> {issueDate}</p>
        <p style={{ margin: '0 0 4px 0' }}><strong>Name:</strong> {data.salutation} {capitalizedName}</p>
        <p style={{ margin: '0 0 4px 0' }}><strong>Designation:</strong> {capitalizedDesignation}</p>
        <p style={{ margin: '0 0 4px 0' }}><strong>Department:</strong> {capitalizedDepartment}</p>

        <br />

        {/* Main heading */}
        <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600 }}>TO WHOM IT MAY CONCERN</h2>
        <br />

        {/* Subject line */}
        <p><strong>Subject: Work experience certificate</strong></p>
        <br />

        {/* Body paragraphs */}
        <p>
          This is to certify that <b>{capitalizedName}</b> has worked as a <b>{capitalizedDesignation}</b> with
          Demandify Media Private Limited from <b>{joiningDate}</b> to <b>{relievingDate}</b>.
        </p>
        <br />

        <p>
          During {pronounPossessive} tenure, <b>{capitalizedName}</b> services were found to be exceptional.
          {" "}{pronounSubject.charAt(0).toUpperCase() + pronounSubject.slice(1)} has shown strong technical skills,
          problem-solving abilities, and has been dedicated towards {pronounPossessive} work throughout.
        </p>
        <br />

        <p>
          <b>{capitalizedName}</b> will be an asset to any company.
        </p>
        <br />

        <p>
          Demandify Media wishes <b>{capitalizedName}</b> the best in {pronounPossessive} future endeavors.
        </p>
        <br />

        {/* Closing & signature */}
        <p>
          <strong>With Best wishes,</strong>
          <br />
          Sincerely yours,
        </p>
        <br /><br />

        <p>
          <strong>Co-Founder</strong>
          <br />
          <strong>Sunny Ashpal</strong>
          <br />
          Demandify Media Private Limited
          <br />
          Date: {issueDate}
        </p>
      </div>
    </div>
  )
}