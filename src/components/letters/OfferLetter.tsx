import React from 'react'

interface OfferLetterProps {
  data: {
    salutation: string
    employeeName: string
    location: string
    role: string
    manager: string
    offerDate: string
    joiningDate: string
    joiningTime: string
    acceptanceDate: string
    ctc: string
    bonus: string
    probation: string
  }
}

export const OfferLetter: React.FC<OfferLetterProps> = ({ data }) => {
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
  const capitalizedLocation = capitalizeWords(data.location)
  const capitalizedRole = capitalizeWords(data.role)
  const offerDate = formatDate(data.offerDate)
  const joiningDate = formatDate(data.joiningDate)
  const acceptanceDate = formatDate(data.acceptanceDate)
  const formattedTime = formatTimeTo12Hour(data.joiningTime)

  return (
    <div style={{ position: 'relative', lineHeight: 1.6, color: '#000', fontSize: '13px' }}>
      {/* Logo */}
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <img src="/Demandify1.png" alt="Demandify Logo" style={{ width: '120px', height: 'auto' }} />
      </div>
      
      {/* Watermark */}
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
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '80px' }}>
          Subject: Offer Letter
        </h2>
        
        <p><b>Date:</b> {offerDate}</p>
        <p><b>Name:</b> {capitalizedName}</p>
        <p><b>Location:</b> {capitalizedLocation}</p>
        <br />
        
        <p>Dear <b>{capitalizedName}</b>,</p>
        <br />
        
        <p>
          We are pleased to offer you the role of <b>'{capitalizedRole}'</b> with our company reporting to{' '}
          <b>{data.manager}</b>. This offer must be accepted in writing and communication of such acceptance 
          must be received by the company no later than <b>{acceptanceDate}</b>, failing which this offer 
          will be deemed withdrawn.
        </p>
        <br />
        
        <p>
          This offer is also subject to the submission of educational certificates, employment work-experience 
          testimonials, and other documents required as per Company Policy and verification of all information 
          provided by you to the satisfaction of the Company, including the Background Check Report, Previous 
          Compensation, and Education credentials.
        </p>
        <br />
        
        <p>Your joining date is <b>{joiningDate}</b> at <b>{formattedTime}</b>.</p>
        <br />
        
        <p><b>Compensation:</b></p>
        <p>Your annual CTC (Cost to Company) will be <b>{data.ctc}</b>.</p>
        <p>You will also be eligible for performance-based bonuses of up to <b>{data.bonus}</b>.</p>
        <br />
        
        <p><b>Probation Period:</b></p>
        <p>
          You will be on probation for a period of <b>{data.probation}</b> from the date of joining. 
          During this period, your performance will be reviewed, and based on satisfactory performance, 
          your employment will be confirmed.
        </p>
        <br />
        
        <p><b>Notice Period:</b></p>
        <p>
          Either party may terminate the employment with a notice period of 30 days or payment in lieu thereof.
        </p>
        <br />
        
        <p><b>Confidentiality:</b></p>
        <p>
          You will be required to sign a confidentiality agreement and adhere to the company's policies 
          regarding the protection of sensitive information.
        </p>
        <br />
        
        <p>
          We are excited to have you join our team and look forward to a long and successful working relationship.
        </p>
        <br /><br /><br />
        
        <p>
          <b>With Best wishes,</b><br />
          Sincerely yours,<br /><br /><br />
          <b>Co-Founder</b><br />
          <b>Sunny Ashpal</b><br />
          Demandify Media Private Limited<br /><br />
          Date: {offerDate}
        </p>
        <br /><br />
        
        <p>Employee Signature: ___________________________</p>
        <p>({capitalizedName})</p>
      </div>
    </div>
  )
}
