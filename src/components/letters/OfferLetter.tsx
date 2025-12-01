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
    salary?: string
    hra?: string
    otherAllowances?: string
    pt?: string
  }
}

const OfferLetter: React.FC<OfferLetterProps> = ({ data }) => {
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

  // Optional salary breakdown
  const basic = parseFloat(data.salary || '0') || 0
  const hra = parseFloat(data.hra || '0') || 0
  const other = parseFloat(data.otherAllowances || '0') || 0
  const pt = parseFloat(data.pt || '0') || 0
  const gross = basic + hra + other
  const inHand = gross - pt

  return (
    <div style={{ position: 'relative', lineHeight: 1.6, color: '#000', fontSize: '13px' }}>
      {/* Logo */}
     <div style={{display:'flex'}}>  
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
      </div> 
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 600, marginTop: '50px' }}>
          Offer Letter
        </h2>

        {/* Date and basic info */}
        <p><b>Date:</b> {offerDate}</p>
        <p><b>Name:</b> {capitalizedName}</p>
        <p><b>Location:</b> {capitalizedLocation}</p>
        <br />

        {/* Greeting */}
        <p>Dear {capitalizedName},</p>
        <br />

        {/* Main body per template */}
        <div>
          <p>
            We are pleased to offer you the role of <b>'{capitalizedRole}'</b> with our company reporting to <b>{data.manager}</b>. This offer must be accepted in writing and communication of such acceptance must be received by the company no later than <b>{acceptanceDate}</b>, failing which this offer will be deemed withdrawn.
          </p>
          <p>
            This offer is also subject to the submission of educational certificates, employment work-experience testimonials, and other documents required as per Company Policy and verification of all information provided by you to the satisfaction of the Company, including the Background Check Report, Previous Compensation, and Education credentials.
          </p>
          <p>
            Should you accept this Offer, your employment will be subject to the following conditions read with the terms and conditions contained in the Employment Agreement which you will be required to sign separately on the date of joining. Kindly go through the attached draft closely and let the undersigned know if you require any clarifications on the same.
          </p>
        </div>
        <br />

        {/* 1. Date of Appointment */}
        <div>
          <p><b>1. Date of Appointment:</b></p>
          <p>
            a. Your employment will be effective from your date of joining. You are required to report to the undersigned at <b>{formattedTime}</b> on <b>{joiningDate}</b> for joining employment, failing which it shall be presumed that you do not intend to join the employment of the company in breach of your acceptance of this offer.
          </p>
          <p>
            b. From the date of joining, you will be on probation for <b>{data.probation}</b>. Your employment may be confirmed based on your performance.
          </p>
          <p>
            c. Your employment is subject to successful completion of Training and On Job Training (OJT) assessment.
          </p>
        </div>
        <br />

        {/* 2. Terms and Conditions */}
        <div>
          <p><b>2. Terms and Conditions:</b></p>
          <p>a. All references to “Company” made in this offer letter shall be taken to mean “Demandify Media Private Limited.”</p>
          <p>b. You are expected to contribute positively to the growth of the company and devote your singular attention towards the same.</p>
          <p>c. You shall observe strict compliance with the work policies of the company and shall maintain the reputation of the company and refrain from making any statements that could discredit the company.</p>
          <p>d. During the course of employment, any data, content, leads, client details, or materials remain the company's property and must not be used outside authorized purposes.</p>
        </div>
        <br />

        {/* 3. Remuneration */}
        <div>
          <p><b>3. Remuneration:</b></p>
          <p>a. Your annual CTC (Cost to Company) will be <b>{data.ctc}</b>.</p>
          <p>b. You will also be eligible for performance-based bonuses of up to <b>{data.bonus}</b>.</p>
          <p>c. Your remuneration will be reviewed at periodic intervals as per company policy and based on performance.</p>
        </div>
        <br />

        {/* Annexure - A salary details (optional) */}
        {(basic || hra || other) ? (
          <div>
            <h3 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, marginTop: 10 }}>Annexure - A</h3>
            <h4 style={{ textAlign: 'center', fontSize: '12px', fontWeight: 400 }}>Company transport if availed, is charged at an additional cost as per Transport Policy.</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}><strong>SALARY COMPONENT</strong></th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}><strong>MONTHLY AMOUNT (INR)</strong></th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}><strong>ANNUAL AMOUNT (INR)</strong></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Basic</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{basic.toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{(basic * 12).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>House Rent Allowance</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{hra.toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{(hra * 12).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Other Allowances</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{other.toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{(other * 12).toFixed(2)}</td>
                </tr>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Gross Salary</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}><strong>₹{gross.toFixed(2)}</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}><strong>₹{(gross * 12).toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>Professional Tax (Deduction)</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{pt.toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>₹{(pt * 12).toFixed(2)}</td>
                </tr>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}><strong>In-Hand</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}><strong>₹{inHand.toFixed(2)}</strong></td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}><strong>₹{(inHand * 12).toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '12px' }}>
              **You will be eligible for other floor/process incentives announced from time to time. This extra incentive amount is not fixed & varies as per business plan.
              <br />***All payments are subject to TDS as per Income Tax Act.
              <br />****PT Deduction as applicable. Deduction of INR 200 / 175 per month as per PT Law. Other Statutory deductions may apply.
              <br />*****Employee Insurance Program is as per company policy. Coverage is subject to change or cessation at the discretion of Management without prior notice. The decision of the Management will be final and binding.
              <br />Note: You will receive salary and other benefits subject to, and after, deduction of tax at source, Professional tax, and any applicable ESI/PF as per law.
            </p>
          </div>
        ) : null}

        {/* Closing and signatures */}
        <div>
          <p>We welcome you aboard and wish you a successful career with Demandify Media Private Limited.</p>
          <br />
          <p>Sincerely,</p>
          <p>{data.manager}</p>
          <p><b>Demandify Media Private Limited</b></p>
          <br />
          <p><b>Date:</b> {offerDate}</p>
          <br />
          <p>Employee Signature: ___________________________</p>
          <p>({capitalizedName})</p>
        </div>
      </div>
    </div>
  )
}

export default OfferLetter
export { OfferLetter }