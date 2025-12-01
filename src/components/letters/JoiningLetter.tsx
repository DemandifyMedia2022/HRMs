import React from 'react'
 
interface JoiningLetterProps {
  data: {
    salutation: string
    employeeName: string
    designation: string
    department: string
    joiningDate: string
    joiningTime: string
    reportingManager: string
    location: string
  }
}
 
export const JoiningLetter: React.FC<JoiningLetterProps> = ({ data }) => {
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
 
  const formatTimeTo12Hour = (time: string = "") => {
    if (!time) return ''
    const [hours, minutes] = String(time).split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }
 
  const capitalizedName = capitalizeWords(data.employeeName)
  const capitalizedDesignation = capitalizeWords(data.designation)
  const capitalizedDepartment = capitalizeWords(data.department)
  const capitalizedManager = capitalizeWords(data.reportingManager)
  const capitalizedLocation = capitalizeWords(data.location)
  const joiningDate = formatDate(data.joiningDate)
  const formattedTime = formatTimeTo12Hour(data.joiningTime)
 
  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000', fontSize: '14px' }}>
     <div style={{display:'flex'}}> 
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
    </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '50px' }}>
          Joining Letter
        </h2>
        <br />
 
        {/* Date */}
        <p><strong>Date:</strong> {joiningDate}</p>
        <br />
 
        {/* To block */}
        <div>
          <p><strong>To:</strong></p>
          <p><b>{data.salutation} {capitalizedName}</b></p>
          <p>{capitalizedDesignation}</p>
          <p>{capitalizedDepartment}</p>
        </div>
        <br />
 
        {/* Greeting */}
        <p style={{marginBottom:'5px'}}>Dear <b>{capitalizedName}</b>,</p>
     
 
        {/* Main body matching template */}
        <div>
          <p>
            We are pleased to offer you the position of <b>{capitalizedDesignation}</b> at <b>Demandify Media Private Limited</b>.
            You are required to report to the undersigned at <b>{formattedTime}</b> on <b>{joiningDate}</b> for joining employment,
            failing which it shall be presumed that you do not intend to join the employment of the company in breach of your acceptance of this offer.
          </p>
          <p>
            You will be reporting to <b>{capitalizedManager}</b>, who will guide you through your responsibilities and expectations in the <b>{capitalizedDepartment}</b> department.
          </p>
          <p>
            We are confident that your skills and experience will be valuable to our team, and we look forward to your contributions. Please report to the HR department on <b>{joiningDate}</b> to complete the necessary formalities.
          </p>
          <p>
            We welcome you aboard and wish you a successful career with <b>Demandify Media Private Limited</b>.
          </p>
        </div>
        <br />
 
        {/* Closing */}
        <div>
          <p>Sincerely,</p>
          <p>{capitalizedManager}</p>
          <p><b>Demandify Media Private Limited</b></p>
        </div>
      </div>
    </div>
  )
}