"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarConfig } from "@/components/sidebar-config"

interface Employee {
  id: string
  Full_name: string | null
  emp_code: string | null
  job_role: string | null
  salary_pay_mode: string | null
  reimbursement_pay_mode: string | null
  Is_employees_Aadhar_and_PAN_number_linked: string | null
  PF_Number: string | null
  UAN: string | null
  Employee_PF_Contribution_limit: string | null
  Salary_revision_month: string | null
  Arrear_with_effect_from: string | null
  Paygroup: string | null
  CTC: string | null
  Basic_Monthly_Remuneration: string | null
  Basic_Annual_Remuneration: string | null
  HRA_Monthly_Remuneration: string | null
  HRA_Annual_Remuneration: string | null
  OTHER_ALLOWANCE_Monthly_Remuneration: string | null
  OTHER_ALLOWANCE_Annual_Remuneration: string | null
  PF_Monthly_Contribution: string | null
  PF_Annual_Contribution: string | null
  Employee_Esic_Monthly: string | null
  Employee_Esic_Annual: string | null
  Employer_Esic_Monthly: string | null
  Employer_Esic_Annual: string | null
  gross_salary: string | null
  netSalary: string | null
}

export default function MySalaryStructurePage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployeeData()
  }, [])

  const fetchEmployeeData = async () => {
    try {
      setLoading(true)
      // Fetch logged-in user's salary structure
      const response = await fetch('/api/payroll/salary-structure', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEmployee(data.data)
      } else {
        console.error('Failed to fetch salary structure:', data.error)
        // If not authenticated, redirect to login
        if (response.status === 401) {
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div style={{ display: 'flex' }}>
          <div style={{ width: '95%', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', margin: 0, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
              <div style={{ color: '#666' }}>Loading employee data...</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!employee) {
    return (
      <>
        <SidebarConfig role="hr" />
        <div style={{ display: 'flex' }}>
          <div style={{ width: '95%', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', margin: 0, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
              <div style={{ color: '#666' }}>Employee not found</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SidebarConfig role="hr" />
      <div style={{ display: 'flex', width: '100%' }}>
        <div style={{ width: '95%' }}>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#f5f5f5',
            margin: 0,
            padding: '20px'
          }}>
            <div style={{
              maxWidth: '900px',
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              margin: 'auto',
              marginLeft: '9%'
            }}>
              <center>
                <h2>Employee Salary Structure</h2>
              </center>

              {/* Payment Details */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>Payment Details</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  width: '92%',
                  margin: '20px auto'
                }}>
                  <input 
                    type="text" 
                    value={employee.salary_pay_mode || ''} 
                    readOnly 
                    style={{
                      display: 'block',
                      width: '100%',
                      marginBottom: '10px',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      fontSize: '14px',
                      textAlign: 'center',
                      background: 'transparent',
                      outline: 'none'
                    }}
                  />
                  <input 
                    type="text" 
                    value={employee.reimbursement_pay_mode || ''} 
                    readOnly 
                    style={{
                      display: 'block',
                      width: '100%',
                      marginBottom: '10px',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      fontSize: '14px',
                      textAlign: 'center',
                      background: 'transparent',
                      outline: 'none'
                    }}
                  />
                  <input 
                    type="text" 
                    value="NEW" 
                    readOnly 
                    style={{
                      display: 'block',
                      width: '100%',
                      marginBottom: '10px',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      fontSize: '14px',
                      textAlign: 'center',
                      background: 'transparent',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Statutory Details */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>Statutory Details</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  width: '92%',
                  margin: '20px auto'
                }}>
                  <span style={{ fontSize: '14px' }}>Is Employee's Aadhar and PAN Number Linked?</span>
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {employee.Is_employees_Aadhar_and_PAN_number_linked || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provident Fund */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>Provident Fund</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  width: '92%',
                  margin: '20px auto'
                }}>
                  <input 
                    type="text" 
                    value={employee.PF_Number || ''} 
                    placeholder="PF Number" 
                    readOnly 
                    style={{
                      display: 'block',
                      width: '100%',
                      marginBottom: '10px',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      fontSize: '14px',
                      textAlign: 'center',
                      background: 'transparent',
                      outline: 'none'
                    }}
                  />
                  <input 
                    type="text" 
                    value={employee.UAN || ''} 
                    placeholder="UAN Number" 
                    readOnly 
                    style={{
                      display: 'block',
                      width: '100%',
                      marginBottom: '10px',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '5px',
                      fontSize: '14px',
                      textAlign: 'center',
                      background: 'transparent',
                      outline: 'none'
                    }}
                  />
                  <div style={{ width: '100%', marginTop: '-20px' }}>
                    <label style={{ marginTop: '-10px', marginBottom: '0px', border: 'none', fontSize: '12px' }}>
                      Employee PF Contribution limit
                    </label>
                    <input 
                      type="text" 
                      value={employee.Employee_PF_Contribution_limit || ''} 
                      readOnly 
                      style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '10px',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px',
                        textAlign: 'center',
                        background: 'transparent',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* CTC Details */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '5px' }}>CTC Details</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  width: '92%',
                  margin: '20px auto'
                }}>
                  <div style={{ width: '100%', marginTop: '0px' }}>
                    <label style={{ border: 'none', fontSize: '12px' }}>Salary Revision Month</label>
                    <input 
                      type="text" 
                      value={formatDate(employee.Salary_revision_month)} 
                      readOnly 
                      style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '10px',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px',
                        textAlign: 'center',
                        background: 'transparent',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ width: '100%', marginTop: '0px', marginLeft: '15px' }}>
                    <label style={{ border: 'none', fontSize: '12px' }}>Arrear with effect from</label>
                    <input 
                      type="text" 
                      value={formatDate(employee.Arrear_with_effect_from)} 
                      readOnly 
                      style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '10px',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px',
                        textAlign: 'center',
                        background: 'transparent',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ width: '100%', marginTop: '0px', marginLeft: '15px' }}>
                    <label style={{ border: 'none', fontSize: '12px' }}>Pay Group</label>
                    <select style={{
                      display: 'block',
                      width: '100%',
                      marginBottom: '10px',
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '5px'
                    }}>
                      <option>{employee.Paygroup || 'Paygroup'}</option>
                    </select>
                  </div>
                  <div style={{ width: '100%', marginTop: '0px' }}>
                    <label style={{ border: 'none', fontSize: '12px' }}>CTC</label>
                    <input 
                      type="text" 
                      value={employee.CTC || ''} 
                      readOnly 
                      style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '10px',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        fontSize: '14px',
                        textAlign: 'center',
                        background: 'transparent',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* (A) Salary Details */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    padding: '5px 10px',
                    borderBottom: '2px solid transparent',
                    color: 'black'
                  }}>
                    (A) Salary Details
                  </div>
                </div>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '10px'
                }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', backgroundColor: '#f1f1f1' }}>Component</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', backgroundColor: '#f1f1f1' }}>Fixed</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', backgroundColor: '#f1f1f1' }}>Monthly Remuneration</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', backgroundColor: '#f1f1f1' }}>Annual Remuneration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>BASIC</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Fixed</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.Basic_Monthly_Remuneration || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.Basic_Annual_Remuneration || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>HRA</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Fixed</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.HRA_Monthly_Remuneration || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.HRA_Annual_Remuneration || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>OTHER ALLOWANCE</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Fixed</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.OTHER_ALLOWANCE_Monthly_Remuneration || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.OTHER_ALLOWANCE_Annual_Remuneration || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              {/* (C) Other benefits */}
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: '#fff'
              }}>
                <h3 style={{ margin: 0, paddingBottom: '10px' }}>(C) - Other benefits</h3>
              </div>

              {/* (D) Contributions / Retrials */}
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: '#fff'
              }}>
                <h3 style={{ margin: 0, paddingBottom: '10px' }}>(D) - Contributions / Retrials</h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', background: '#f1f1f1' }}>Component Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', background: '#f1f1f1' }}>Monthly Contribution</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', background: '#f1f1f1' }}>Annual Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>PF</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.PF_Monthly_Contribution || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <input 
                        type="number" 
                        value={employee.PF_Annual_Contribution || ''} 
                        readOnly 
                        style={{
                          width: '100px',
                          textAlign: 'center',
                          fontSize: '14px',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          padding: '5px',
                          overflow: 'hidden'
                        }}
                      />
                    </td>
                  </tr>
                  </tbody>
                </table>
                <div style={{
                  padding: '10px',
                  background: '#f8f8f8',
                  borderLeft: '4px solid #ff9800',
                  marginTop: '10px',
                  fontSize: '14px'
                }}>
                  ⚠ Note: Retrials will not be paid with salary. The contribution will be either made on your respective fund accounts or you will be entitled for them on retirement/separation from organisation.
                </div>
              </div>

              {/* (E) Recurring Deductions */}
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: '#fff'
              }}>
                <h3 style={{ margin: 0, paddingBottom: '10px' }}>(E) - Recurring Deductions</h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', background: '#f1f1f1' }}>Component Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', background: '#f1f1f1' }}>Nature of Component</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', background: '#f1f1f1' }}>Monthly Remuneration</th>
                      <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left', background: '#f1f1f1' }}>Annual Remuneration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Employee PF</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>-</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{employee.PF_Monthly_Contribution || ''}</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>{employee.PF_Annual_Contribution || ''}</td>
                  </tr>
                  </tbody>
                </table>
              </div>

              {/* Gross (B) */}
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: '#fff'
              }}>
                <h3 style={{ margin: 0, paddingBottom: '10px' }}>Gross (B)</h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>{employee.gross_salary || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Salary */}
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                background: '#fff'
              }}>
                <h3 style={{ margin: 0, paddingBottom: '10px' }}>Net Salary</h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>{employee.netSalary || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
