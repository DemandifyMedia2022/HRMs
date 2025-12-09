import React from 'react'

interface AppointmentLetterProps {
  data: {
    number?: string
    salutation: string
    employeeName: string
    designation: string
    dateOfJoining: string
    dateOfIssue: string
    pfActivationDate?: string
    grossSalary: string
    basicSalary: string
    hra: string
    otherAllowances: string
    pf: string
    employeeEsic: string
    employerEsic: string
    pt: string
    location: string
    manager?: string
  }
}

const AppointmentLetter: React.FC<AppointmentLetterProps> = ({ data }) => {
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
  const pfActivationDate = formatDate(data.pfActivationDate || data.dateOfIssue)

  // Parse salary values
  const grossSalary = parseFloat(data.grossSalary) || 0
  const basicSalary = parseFloat(data.basicSalary) || 0
  const hra = parseFloat(data.hra) || 0
  const otherAllowances = parseFloat(data.otherAllowances) || 0
  const pf = parseFloat(data.pf) || 0
  const employeeEsic = parseFloat(data.employeeEsic) || 0
  const employerEsic = parseFloat(data.employerEsic) || 0
  const pt = parseFloat(data.pt) || 0

  // Calculate totals
  const totalDeductions = pf + employeeEsic + pt
  const employerContribution = pf + employerEsic
  const ctc = grossSalary + employerContribution
  const inHandSalary = grossSalary - totalDeductions

  return (
    <div style={{ position: 'relative', lineHeight: 1.6, color: '#000', fontSize: '14px' }}>
      {/* Logo */}
      <div style={{display:'flex'}} > 
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <img src="/Demandify1.png" alt="Demandify Logo" style={{ width: '120px', height: 'auto' }} />
      </div>
      {/* Watermark */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.08, zIndex: 0, pointerEvents: 'none' }}>
        <img src="/demandify.png" alt="Watermark" style={{ width: '400px', height: 'auto' }} />
      </div>
</div>
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header info */}
        <p style={{ marginTop: '80px' }}>
          <b>Demandify Media Pvt Ltd/25-26 /APTL/{data.number || '____'}</b>
        </p>
        <p><b>{issueDate}</b></p>
        <br/>
        <p><b>To,</b><br />
          <b>{data.salutation} {capitalizedName}</b>
        </p>
        <br/>
        <div style={{ textAlign: 'center' }}><b>Subject: Appointment Letter - {capitalizedDesignation}</b></div>
        <br/>
        <p><b>Dear {capitalizedName}</b>,</p>

        <p>Your joining date will be <b>{joiningDate}</b>. After completing three months in the organization, your PF and ESIC will start from <b>{pfActivationDate}</b> on, the following terms & conditions:</p>

        <p><b>1) Designation:</b><br />
          You will be designated as {capitalizedDesignation}.
        </p>

        <p><b>2) Place of Posting:</b><br />
          You will be posted at DEMANDIFY MEDIA PRIVATE LIMITED, {capitalizedLocation}. You may be transferred to any department or location where the company or its subsidiaries have a presence. Transfer-related rules of the new post will apply. Refusing a transfer will be treated as misconduct.
        </p>

        <p><b>3) Remuneration:</b><br />
          Your monthly compensation details and benefits are enclosed in Annexure – A.
        </p>

        <p><b>4) Probation:</b><br />
          Your appointment shall be on probation for an initial period of three months from the date of joining, post which confirmation may be communicated.
        </p>

        <p><b>5) Separation:</b><br />
          During probation or extended period(s), your service is liable to be terminated without assigning any reason or payment in lieu thereof. If you leave employment during probation, a notice of 30 working days is required. Without giving requisite notice, no relieving order will be issued, and settlement of dues will be at the discretion of the Management.
        </p>

        <p>Full & Final settlement of dues will be processed in ~45 days (if applicable). If an employee is on their notice period and is observed to be non-performing or not following assigned work, disciplinary action may be taken. Withholding FnF without due process can raise legal/ethical concerns. Deduct notice pay if employee absconds or fails to serve full notice (as per contract).
        </p>

        <p><b>6) Retirement:</b><br />
          You shall retire from service upon attaining the age of 58, subject to continued medical fitness.
        </p>

        <div>
          <p><b>7) Duties and Responsibilities:</b></p>
          <p>Your target would be reviewed at the end of each month. The Company will expect you to work with a high standard of initiative, efficiency and economy. You will perform, observe and confirm such duties, directions and instructions assigned or communicated to you by the company and those in authority over you.</p>
          <p>You will devote your entire time to the work of the Company and will not undertake any direct/indirect business or work, honorary or remunerator except with the written permission of the Management in each case. Contravention of this your services would be liable for termination with immediate effect, notwithstanding any other terms and conditions mentioned in the letter of appointment.</p>
          <p>You shall neither divulge nor give out to any unauthorised person during the period of your service or even afterwards by word of mouth or otherwise, particulars or details of Demandify Media’s and its clients business and operating processes, technical know-how, administrative and/or organisational matters of a confidential/secret nature, which may be your privilege to know by virtue of you being our employee. To this effect, you will be required to sign a non-disclosure agreement when you join the Company.</p>
        </div>

        <p><b>8) Confidentiality:</b><br />
As an employee of Demandify Media, you are required to maintain strict confidentiality regarding all client data, lead generation campaigns, and third-party information accessed during your employment. This includes client contact details, campaign strategies, performance metrics, and any proprietary or third-party data. Unauthorized sharing, use, or discussion of such information—whether internally or externally—is strictly prohibited and considered a serious breach of company policy. Any suspected or actual data breaches must be reported immediately to your supervisor or the Data Protection Officer. Your obligation to protect confidential information continues even after your employment ends. Violations of this policy may result in disciplinary action, including immediate termination and potential legal consequences.        </p>

        <p><b>9) Terms and Conditions:</b><br />
All references to “Company” made in this appointment letter shall be taken to mean “Demandify Media Private Limited.” You are expected to contribute positively to the company’s growth and devote your 
full professional attention to achieving business goals. You shall strictly comply with company policies and uphold its reputation, refraining from any statements that could harm the company’s image. If you cause damage to any company assets (such as laptops, mobile devices, etc.), you will be liable to pay for the damage incurred.        </p>

        <p><b>10) Rules & Regulations:</b><br />
          Your employment with the company is subject to compliance with all applicable company policies, procedures, and code of conduct. Continuation of employment is also contingent upon successful medical fitness clearance and the verification of all documents and credentials submitted during the recruitment process. Any discrepancies, misrepresentation, or falsification of information provided will be considered a serious breach of trust and may lead to immediate termination without prior notice.
        </p>

        <div style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 6 }}><b>11) Leave Policy:</b><br />
            All full-time employees of Demandify Media Private Limited are entitled to 18 leaves per year. Leaves can be availed only after successful completion of the probation period and will otherwise accumulate on a pro‑rata basis since the date of joining. The distribution is as mentioned below:

          </p>
          <table style={{ width: '80%', borderCollapse: 'collapse', margin: '5px auto', fontSize: '12px' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', color: '#000' }}><b>Eligibility</b></th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', color: '#000' }}>Nature of leaves</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', color: '#000' }}>Monthly</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', color: '#000' }}>Yearly</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>17 Days of work in a month*</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>1 Paid Leave (PL)</td>
                <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>1.5</td>
                <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px' }}>
                  18<br />
                  <span style={{ fontSize: '11px', color: '#000' }}>(1.5 x 12 Months)</span>
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>13 Days of work in a month*</td>
                <td style={{ border: '1px solid #000', padding: '6px' }}>0.5 Sick Leave (SL)</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '12px', marginTop: 4 }}>*includes weekends. No of days indicates minimum days of work required to qualify for the leave.</p>
          <p>If an employee wishes to avail paid leave, a prior request/application should be sent to the reporting manager 30 days in advance.</p>
          <p>In case of Sick leaves an employee is required to submit a medical certificate/documentation detailing the reason for the leave. In case of any kind of prolonged illness (accident/stroke/operation/any chronic condition), it is mandatory to produce a fitness certificate from a recognized hospital stating that the employee is fit to join work (Whether fit or if any special assistance would be required during office hours.</p>
          <p>You are allowed only one leave per month for a valid reason. If more than one leave is taken in the same month without a valid reason, it will be subject to penalty under the sandwich leave deduction policy.</p>
        </div>

        <div>
          <p><b>12) Governing Law:</b></p>
          <p>This agreement shall be governed by the Laws of India and the Courts at PUNE will have the jurisdiction to try all / any dispute/ that may arise out of this contract.</p>
          <p>If you find that the terms are favorable, please indicate your acceptance within five(5) days from the date of this letter.</p>
          <p>We welcome you again to our family and trust your association with us would be a long and meaningful one.</p>
          <p>Your salary details are strictly private and confidential and details in this letter must not be disclosed and discussed with others. Any breach of this confidentiality will be treated with seriousness</p>
          <p>Please sign a duplicate copy of this letter confirming your acceptance of the above terms and conditions of appointment and return it to us for office records.</p>
        </div>

        {/* Acknowledgment & Acceptance */}
        <div style={{ marginTop: 14 }}>
          <p style={{ fontWeight: 600 }}>
            Acknowledgment & Acceptance
          </p>
          <p style={{ marginBottom: 2 }}>Name</p>
          <p style={{ marginTop: 0 }}>{capitalizedName}</p>
          <p>I have read and understood the terms and conditions mentioned above and hereby signify my acceptance of the same.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <div style={{ textAlign: 'left' }}>
              <div>----------</div>
              <div>Signature</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>{issueDate}</div>
              <div>Date</div>
            </div>
          </div>
        </div>

        {/* Annexure A - Salary Details */}
        <h3 style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, marginTop: 20 }}>Annexure A</h3>
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
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{basicSalary.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(basicSalary * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>HRA</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{hra.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(hra * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Other Allowance</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{otherAllowances.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(otherAllowances * 12).toFixed(2)}</td>
            </tr>
            <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Gross Salary (A)</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{grossSalary.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(grossSalary * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Employee's PF contribution</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{pf.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(pf * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Employee's ESIC contribution</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{employeeEsic.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(employeeEsic * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Professional Tax</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{pt.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(pt * 12).toFixed(2)}</td>
            </tr>
            <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Deduction (B)</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{totalDeductions.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(totalDeductions * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Employer's PF contribution</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{pf.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(pf * 12).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Employer's ESIC contribution</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{employerEsic.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(employerEsic * 12).toFixed(2)}</td>
            </tr>
            <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Employer’s Contribution (C)</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{employerContribution.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(employerContribution * 12).toFixed(2)}</td>
            </tr>
            <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>CTC (A + C)</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{ctc.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(ctc * 12).toFixed(2)}</td>
            </tr>
            <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #000', padding: '8px' }}>Inhand Salary (A - B)</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{inHandSalary.toFixed(2)}</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}>₹{(inHandSalary * 12).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature block - Structured table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#b3b3b3', fontWeight: 600, width: '35%' }}>For</td>
              <td style={{ border: '1px solid #000', padding: '8px', width: '15%' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px', width: '15%' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#b3b3b3', fontWeight: 600 }}>
                Demandify Media<br />Private<br />Limited
              </td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>Accepted By:</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#b3b3b3', fontWeight: 600 }}>Sunny Ashpal</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '8px', backgroundColor: '#b3b3b3', fontWeight: 600 }}>CEO</td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>Signature:</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AppointmentLetter
export { AppointmentLetter }