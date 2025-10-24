import React from 'react'

interface AppointmentLetterProps {
  data: {
    salutation: string
    employeeName: string
    designation: string
    dateOfJoining: string
    dateOfIssue: string
    ctc: string
    probation: string
    location: string
    workingHours: string
  }
}

export const AppointmentLetter: React.FC<AppointmentLetterProps> = ({ data }) => {
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
  const joiningDate = formatDate(data.dateOfJoining)
  const issueDate = formatDate(data.dateOfIssue)

  // Calculate salary breakdown
  const ctcValue = parseFloat(data.ctc) || 0
  const basic = ctcValue * 0.40
  const hra = ctcValue * 0.20
  const conveyance = ctcValue * 0.10
  const medical = ctcValue * 0.05
  const specialAllowance = ctcValue * 0.25

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
        <p><strong>To,</strong><br />{data.salutation}. {capitalizedName}</p>
        <br />
        
        <p>Dear {data.salutation}. {capitalizedName},</p>
        <br />
        
        <p>
          We are pleased to offer you the position of <b>{capitalizedDesignation}</b> at Demandify 
          Media Private Limited, subject to the terms and conditions mentioned herein.
        </p>
        <br />
        
        <p><strong>1. Commencement of Employment:</strong></p>
        <p>Your employment with us will commence from <b>{joiningDate}</b>.</p>
        <br />
        
        <p><strong>2. Designation & Location:</strong></p>
        <p>
          You will be working as <b>{capitalizedDesignation}</b> at our <b>{capitalizedLocation}</b> office.
        </p>
        <br />
        
        <p><strong>3. Probation Period:</strong></p>
        <p>
          You will be on probation for a period of <b>{data.probation}</b> from the date of joining. 
          During this period, your performance will be evaluated, and upon satisfactory performance, 
          your services will be confirmed.
        </p>
        <br />
        
        <p><strong>4. Working Hours:</strong></p>
        <p>Your working hours will be <b>{data.workingHours}</b>, Monday to Friday.</p>
        <br />
        
        <p><strong>5. Compensation:</strong></p>
        <p>Your annual Cost to Company (CTC) will be <b>₹{data.ctc}</b>.</p>
        <br />
        
        <p>
          We welcome you again to our family and trust your association with us would be a long and 
          meaningful one.
        </p>
        <br />
        
        <p>
          Sincerely yours,<br />
          For, Demandify Media<br /><br />
          Sunny Ashpal<br />
          Chief Executive Officer
        </p>
        <br /><br />
        
        <h3 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600 }}>
          Annexure A - Salary Details
        </h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#b3b3b3' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Particular</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Monthly</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Annually</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Basic</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{basic.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(basic * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>HRA</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{hra.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(hra * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Conveyance</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{conveyance.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(conveyance * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Medical</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{medical.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(medical * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Special Allowance</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{specialAllowance.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(specialAllowance * 12).toFixed(2)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#e0e0e0' }}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Total CTC</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{ctcValue.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(ctcValue * 12).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
