import React from 'react'

interface ReferenceLetterProps {
  data: {
    salutation: string
    employeeName: string
    position: string
    employmentPeriod: string
    managerName: string
    managerEmail: string
    managerContact: string
    companyName: string
  }
}

export const ReferenceLetter: React.FC<ReferenceLetterProps> = ({ data }) => {
  const capitalizeWords = (str: string = "") => {
    return String(str).split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const capitalizedName = capitalizeWords(data.employeeName)
  const capitalizedPosition = capitalizeWords(data.position)
  const capitalizedCompany = capitalizeWords(data.companyName)
  const capitalizedManager = capitalizeWords(data.managerName)

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
          Reference Letter
        </h3>
        <br />
        
        <p><strong>To Whom It May Concern,</strong></p>
        <br />
        
        <p>
          I am writing to provide a reference for <b>{data.salutation}. {capitalizedName}</b>, who has 
          worked with us at <b>{capitalizedCompany}</b> as a <b>{capitalizedPosition}</b> for{' '}
          <b>{data.employmentPeriod}</b>. During this time, <b>{capitalizedName}</b> has consistently 
          demonstrated professionalism, dedication, and excellent skills in their role.
        </p>
        <br />
        
        <p>
          {capitalizedName} has been an integral part of our team, contributing significantly to our 
          projects. Their ability to collaborate, solve problems, and take initiative has been 
          commendable, and they have proven to be a valuable asset to our organization.
        </p>
        <br />
        
        <p>
          I have no doubt that <b>{capitalizedName}</b> will continue to excel in their future endeavors. 
          If you require further information, please feel free to contact me at {data.managerEmail} or{' '}
          {data.managerContact}.
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
