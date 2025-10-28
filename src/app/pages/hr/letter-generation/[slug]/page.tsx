'use client';

import { useMemo, useState, use, useRef } from 'react';
import Link from 'next/link';
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import {
  PromotionLetter,
  SalaryIncrementLetter,
  ResignationLetter,
  ReferenceLetter,
  RelievingLetter,
  WarningLetter,
  PerformanceLetter,
  OfferLetter,
  AppointmentLetter,
  ExperienceLetter,
  InterviewCallLetter,
  JoiningLetter,
  LeaveApprovalLetter,
  SeparationLetter,
  TransferLetter
} from '@/components/letters';

// Map slug -> title and component
const letterRegistry: Record<
  string,
  {
    title: string;
    Component: any;
    defaultData: Record<string, any>;
    fields: { name: string; label: string; type?: string }[];
  }
> = {
  'promotion-letter': {
    title: 'Promotion Letter',
    Component: PromotionLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'John Doe',
      currentPosition: 'Software Engineer',
      newPosition: 'Senior Software Engineer',
      effectiveDate: new Date().toISOString().slice(0, 10),
      responsibilities: 'leading project initiatives and mentoring team members',
      salaryIncrement: '15%',
      managerName: 'Jane Smith',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'currentPosition', label: 'Current Position' },
      { name: 'newPosition', label: 'New Position' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { name: 'responsibilities', label: 'Responsibilities' },
      { name: 'salaryIncrement', label: 'Salary Increment' },
      { name: 'managerName', label: 'Manager Name' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'salary-increment-letter': {
    title: 'Salary Increment Letter',
    Component: SalaryIncrementLetter,
    defaultData: {
      salutation: 'Ms',
      employeeName: 'Alex Johnson',
      currentSalary: '500000',
      newSalary: '600000',
      effectiveDate: new Date().toISOString().slice(0, 10),
      managerName: 'Priya Verma',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'currentSalary', label: 'Current Salary (₹)' },
      { name: 'newSalary', label: 'New Salary (₹)' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { name: 'managerName', label: 'Manager Name' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'resignation-letter': {
    title: 'Resignation Letter',
    Component: ResignationLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Rohit Sharma',
      resignationDate: new Date().toISOString().slice(0, 10),
      lastWorkingDay: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      reason: 'personal reasons',
      managerName: 'Reporting Manager',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'resignationDate', label: 'Resignation Date', type: 'date' },
      { name: 'lastWorkingDay', label: 'Last Working Day', type: 'date' },
      { name: 'reason', label: 'Reason' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'reference-letter': {
    title: 'Reference Letter',
    Component: ReferenceLetter,
    defaultData: {
      salutation: 'Ms',
      employeeName: 'Anita Rao',
      position: 'QA Engineer',
      employmentPeriod: 'Jan 2023 - Oct 2024',
      managerName: 'Reporting Manager',
      managerEmail: 'manager@example.com',
      managerContact: '+91-9999999999',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'position', label: 'Position' },
      { name: 'employmentPeriod', label: 'Employment Period' },
      { name: 'managerName', label: 'Manager Name' },
      { name: 'managerEmail', label: 'Manager Email' },
      { name: 'managerContact', label: 'Manager Contact' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'relieving-letter': {
    title: 'Relieving Letter',
    Component: RelievingLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Rahul Mehta',
      designation: 'UI Developer',
      location: 'Pune',
      joiningDate: '2023-02-01',
      relievingDate: new Date().toISOString().slice(0, 10),
      issueDate: new Date().toISOString().slice(0, 10)
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'designation', label: 'Designation' },
      { name: 'location', label: 'Location' },
      { name: 'joiningDate', label: 'Joining Date', type: 'date' },
      { name: 'relievingDate', label: 'Relieving Date', type: 'date' },
      { name: 'issueDate', label: 'Issue Date', type: 'date' }
    ]
  },
  'warning-letter': {
    title: 'Warning Letter',
    Component: WarningLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      issueDescription: 'violation of company policy',
      consequences: 'termination',
      warningDate: new Date().toISOString().slice(0, 10),
      managerName: 'Reporting Manager',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'issueDescription', label: 'Issue Description' },
      { name: 'consequences', label: 'Consequences' },
      { name: 'warningDate', label: 'Warning Date', type: 'date' },
      { name: 'managerName', label: 'Manager Name' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'performance-letter': {
    title: 'Performance Letter',
    Component: PerformanceLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      reviewPeriod: 'Q2 2025',
      reviewSummary: 'Overall very good performance',
      strengths: 'Teamwork, Communication',
      areasForImprovement: 'Time management',
      managerName: 'Reporting Manager',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'reviewPeriod', label: 'Review Period' },
      { name: 'reviewSummary', label: 'Review Summary' },
      { name: 'strengths', label: 'Strengths' },
      { name: 'areasForImprovement', label: 'Areas for Improvement' },
      { name: 'managerName', label: 'Manager Name' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'offer-letter': {
    title: 'Offer Letter',
    Component: OfferLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Candidate Name',
      location: 'Pune',
      role: 'Software Engineer',
      manager: 'Reporting Manager',
      offerDate: new Date().toISOString().slice(0, 10),
      joiningDate: new Date().toISOString().slice(0, 10),
      joiningTime: '10:00',
      acceptanceDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      ctc: '1000000',
      bonus: '10%',
      probation: '3 months'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'location', label: 'Location' },
      { name: 'role', label: 'Role' },
      { name: 'manager', label: 'Manager' },
      { name: 'offerDate', label: 'Offer Date', type: 'date' },
      { name: 'joiningDate', label: 'Joining Date', type: 'date' },
      { name: 'joiningTime', label: 'Joining Time (HH:mm)' },
      { name: 'acceptanceDate', label: 'Acceptance Date', type: 'date' },
      { name: 'ctc', label: 'CTC (Annual)' },
      { name: 'bonus', label: 'Bonus' },
      { name: 'probation', label: 'Probation' }
    ]
  },
  'appointment-letter': {
    title: 'Appointment Letter',
    Component: AppointmentLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      designation: 'Software Engineer',
      dateOfJoining: new Date().toISOString().slice(0, 10),
      dateOfIssue: new Date().toISOString().slice(0, 10),
      ctc: '1200000',
      probation: '3 months',
      location: 'Pune',
      workingHours: '10:00 AM - 6:00 PM'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'designation', label: 'Designation' },
      { name: 'dateOfJoining', label: 'Date of Joining', type: 'date' },
      { name: 'dateOfIssue', label: 'Date of Issue', type: 'date' },
      { name: 'ctc', label: 'CTC (Annual)' },
      { name: 'probation', label: 'Probation' },
      { name: 'location', label: 'Location' },
      { name: 'workingHours', label: 'Working Hours' }
    ]
  },
  'experience-letter': {
    title: 'Experience Letter',
    Component: ExperienceLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      designation: 'Software Engineer',
      department: 'Engineering',
      joiningDate: '2023-01-01',
      relievingDate: new Date().toISOString().slice(0, 10),
      issueDate: new Date().toISOString().slice(0, 10)
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'designation', label: 'Designation' },
      { name: 'department', label: 'Department' },
      { name: 'joiningDate', label: 'Joining Date', type: 'date' },
      { name: 'relievingDate', label: 'Relieving Date', type: 'date' },
      { name: 'issueDate', label: 'Issue Date', type: 'date' }
    ]
  },
  'interview-call-letter': {
    title: 'Interview Call Letter',
    Component: InterviewCallLetter,
    defaultData: {
      salutation: 'Mr',
      candidateName: 'Candidate Name',
      position: 'Software Engineer',
      interviewDate: new Date().toISOString().slice(0, 10),
      interviewTime: '10:00',
      interviewLocation: 'Demandify Pvt Ltd, 2nd Floor, Tech Park, Pune',
      contactPerson: 'HR Panel',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'candidateName', label: 'Candidate Name' },
      { name: 'position', label: 'Position' },
      { name: 'interviewDate', label: 'Interview Date', type: 'date' },
      { name: 'interviewTime', label: 'Interview Time (HH:mm)' },
      { name: 'interviewLocation', label: 'Interview Location' },
      { name: 'contactPerson', label: 'Contact Person' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'joining-letter': {
    title: 'Joining Letter',
    Component: JoiningLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      designation: 'Software Engineer',
      department: 'Engineering',
      joiningDate: new Date().toISOString().slice(0, 10),
      joiningTime: '10:00',
      reportingManager: 'Reporting Manager',
      location: 'Pune'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'designation', label: 'Designation' },
      { name: 'department', label: 'Department' },
      { name: 'joiningDate', label: 'Joining Date', type: 'date' },
      { name: 'joiningTime', label: 'Joining Time (HH:mm)' },
      { name: 'reportingManager', label: 'Reporting Manager' },
      { name: 'location', label: 'Location' }
    ]
  },
  'leave-approval-letter': {
    title: 'Leave Approval Letter',
    Component: LeaveApprovalLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      leaveType: 'Annual Leave',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      leaveDuration: '3',
      approvedBy: 'Reporting Manager',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'leaveType', label: 'Leave Type' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'leaveDuration', label: 'Duration (days)' },
      { name: 'approvedBy', label: 'Approved By' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'separation-letter': {
    title: 'Separation Letter',
    Component: SeparationLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      terminationDate: new Date().toISOString().slice(0, 10),
      terminationReason: 'end of contract',
      confidentialityTerms: 'Non-disclosure of company information',
      managerName: 'Reporting Manager',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'terminationDate', label: 'Termination Date', type: 'date' },
      { name: 'terminationReason', label: 'Termination Reason' },
      { name: 'confidentialityTerms', label: 'Confidentiality Terms' },
      { name: 'managerName', label: 'Manager Name' },
      { name: 'companyName', label: 'Company Name' }
    ]
  },
  'transfer-letter': {
    title: 'Transfer Letter',
    Component: TransferLetter,
    defaultData: {
      salutation: 'Mr',
      employeeName: 'Employee Name',
      currentDepartment: 'Engineering',
      newDepartment: 'Product',
      newLocation: 'Bengaluru',
      effectiveDate: new Date().toISOString().slice(0, 10),
      managerName: 'Reporting Manager',
      companyName: 'Demandify Pvt Ltd'
    },
    fields: [
      { name: 'salutation', label: 'Salutation' },
      { name: 'employeeName', label: 'Employee Name' },
      { name: 'currentDepartment', label: 'Current Department' },
      { name: 'newDepartment', label: 'New Department' },
      { name: 'newLocation', label: 'New Location' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { name: 'managerName', label: 'Manager Name' },
      { name: 'companyName', label: 'Company Name' }
    ]
  }
};

export default function LetterFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const cfg = letterRegistry[slug];

  const [formData, setFormData] = useState<Record<string, any>>(() => ({}));
  const [previewData, setPreviewData] = useState<Record<string, any>>(() => ({}));
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const COMPANY_NAME = 'Demandify Media Pvt. Ltd.';

  const handleChange = (name: string, value: string) => {
    setFormData(p => ({ ...p, [name]: value }));
  };

  // Simple, guaranteed React-PDF download using buildPdf output
  const handleDownloadSimple = async () => {
    try {
      if (!cfg) return;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const getName = () => previewData.employeeName || previewData.candidateName || 'Recipient';
      const safe = (s: string) => String(s).replace(/[^a-z0-9_-]+/gi, '');
      const titlePart = safe((cfg.title || slug).replace(/\s+/g, ''));
      const namePart = safe(getName().replace(/\s+/g, ''));
      const filename = `${titlePart}_${namePart}_${dateStr}.pdf`;

      const instance = pdf(buildPdfForSlug(slug, cfg.title, previewData));
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ message: `Downloaded ${filename}`, type: 'success' });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to generate Simple PDF', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Merge defaults with user input so components never see undefined
    const merged = { ...(cfg?.defaultData ?? {}), ...formData };
    // Force static company name when present in this letter
    if (cfg?.fields?.some(f => f.name === 'companyName')) {
      merged.companyName = COMPANY_NAME;
    }
    const sanitizeStrings = (obj: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = v === undefined || v === null ? '' : v;
      }
      return out;
    };
    setPreviewData(sanitizeStrings(merged));
    setShowPreview(true);
  };

  const Component = cfg?.Component;

  // ---------- PDF Generation (two modes) ----------
  const styles = StyleSheet.create({
    page: { padding: 32, fontSize: 12, lineHeight: 1.5 },
    header: { position: 'absolute', top: 4, right: 16 },
    title: { textAlign: 'center', fontSize: 16, marginTop: 48, marginBottom: 12 },
    section: { marginBottom: 8 },
    label: { fontWeight: 700 },
    watermarkWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    watermark: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: 0.08,
      width: 300
    },
    paragraph: { fontSize: 12, lineHeight: 1.6, color: '#111', marginBottom: 6 },
    sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 10, marginBottom: 4 },
    bold: { fontWeight: 700 },
    spacerSm: { height: 6 },
    spacerMd: { height: 10 }
  });

  const getPublicUrl = (path: string) => {
    if (typeof window === 'undefined') return path;
    return `${window.location.origin}${path}`;
  };

  const buildPdf = (title: string, data: Record<string, any>) => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo */}
        <View style={styles.header}>
          {/* @ts-ignore react-pdf type width string acceptable */}
          <Image src={getPublicUrl('/Demandify1.png')} style={{ width: 120 }} />
        </View>
        {/* Watermark */}
        <View style={styles.watermarkWrap}>
          {/* @ts-ignore */}
          <Image src={getPublicUrl('/demandify.png')} style={styles.watermark} />
        </View>
        <Text style={styles.title}>{title}</Text>

        {/* Render key-value pairs for the filled form */}
        {Object.entries(data).map(([k, v]) => (
          <View key={k} style={styles.section}>
            <Text>
              <Text style={styles.label}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}: </Text>
              {String(v ?? '-')}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  // Rich React-PDF templates per slug where available
  const buildPdfForSlug = (slug: string, title: string, data: Record<string, any>) => {
    if (slug === 'performance-letter') {
      const nice = (s: any) => String(s ?? '');
      return (
        <Document>
          <Page size="A4" style={styles.page}>
            {/* Logo */}
            <View style={styles.header}>
              {/* @ts-ignore */}
              <Image src={getPublicUrl('/Demandify1.png')} style={{ width: 120 }} />
            </View>
            {/* Watermark */}
            <View style={styles.watermarkWrap}>
              {/* @ts-ignore */}
              <Image src={getPublicUrl('/demandify.png')} style={styles.watermark} />
            </View>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.paragraph}>
              Dear{' '}
              <Text style={styles.bold}>
                {nice(data.salutation)}. {nice(data.employeeName)}
              </Text>
              ,
            </Text>
            <Text style={styles.paragraph}>
              This letter summarizes your performance for the period{' '}
              <Text style={styles.bold}>{nice(data.reviewPeriod)}</Text>. Below is an overview of your key achievements
              and areas of focus.
            </Text>

            <Text style={styles.sectionTitle}>Review Summary</Text>
            <Text style={styles.paragraph}>{nice(data.reviewSummary)}</Text>

            <Text style={styles.sectionTitle}>Strengths</Text>
            <Text style={styles.paragraph}>{nice(data.strengths)}</Text>

            <Text style={styles.sectionTitle}>Areas for Improvement</Text>
            <Text style={styles.paragraph}>{nice(data.areasForImprovement)}</Text>

            <View style={styles.spacerMd} />
            <Text style={styles.paragraph}>
              Manager: <Text style={styles.bold}>{nice(data.managerName)}</Text>
            </Text>
            <Text style={styles.paragraph}>
              Company: <Text style={styles.bold}>{nice(data.companyName)}</Text>
            </Text>
          </Page>
        </Document>
      );
    }
    // Default generic fallback
    return buildPdf(title, data);
  };

  // DOM-to-PDF using html2pdf.js with isolated container (payslip approach)
  const previewRef = useRef<HTMLDivElement | null>(null);
  const handleDownload = async () => {
    try {
      if (!showPreview || !previewRef.current || !cfg) return;
      const monthSafeName = (s: string) => String(s || '').replace(/[^a-z0-9_-]+/gi, '');
      const getName = () => previewData.employeeName || previewData.candidateName || 'Recipient';
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const titlePart = monthSafeName((cfg.title || slug).replace(/\s+/g, ''));
      const namePart = monthSafeName(getName().replace(/\s+/g, ''));
      const filename = `${titlePart}_${namePart}_${dateStr}.pdf`;

      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed !important;
        left: -9999px !important;
        top: 0 !important;
        width: 800px !important;
        background: #ffffff !important;
        z-index: -1 !important;
        isolation: isolate !important;
      `;
      container.className = '';

      const element = document.createElement('div');
      element.style.cssText = `
        all: initial;
        display: block;
        width: 750px;
        font-family: Arial, sans-serif;
        background-color: #ffffff;
        padding: 25px;
        color: #000000;
        line-height: 1.5;
        box-sizing: border-box;
      `;
      element.className = '';

      // clone preview HTML into isolated element
      const source = previewRef.current;
      element.innerHTML = source.innerHTML;

      container.appendChild(element);
      document.body.appendChild(container);

      const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 750,
          windowHeight: 1200,
          scrollY: 0,
          scrollX: 0,
          allowTaint: true,
          foreignObjectRendering: false,
          ignoreElements: (element: any) => element.tagName === 'STYLE' || element.tagName === 'LINK',
          onclone: (clonedDoc: Document) => {
            const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(link => link.remove());
            const styles = clonedDoc.querySelectorAll('style');
            styles.forEach(style => {
              if (
                style.textContent &&
                (style.textContent.includes('lab(') ||
                  style.textContent.includes('lch(') ||
                  style.textContent.includes('oklch('))
              ) {
                style.remove();
              }
            });
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      setTimeout(() => {
        // @ts-ignore
        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            if (container.parentNode) document.body.removeChild(container);
            setToast({ message: `Downloaded ${filename}`, type: 'success' });
            setTimeout(() => setToast(null), 2500);
          })
          .catch((error: any) => {
            console.error('PDF generation error', error);
            if (container.parentNode) document.body.removeChild(container);
            setToast({ message: 'Failed to generate PDF', type: 'error' });
            setTimeout(() => setToast(null), 3000);
          });
      }, 120);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to generate PDF', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (!cfg) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Link href="/pages/hr/letter-generation" className="text-blue-600 hover:underline">
              ← Back to Letters
            </Link>
          </div>
          <h1 className="text-xl font-semibold mb-2">Unknown Letter</h1>
          <p className="text-slate-600">No configuration found for slug: {slug}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6">
            <div className="flex items-center justify-between text-white">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{cfg.title}</h1>
                <p className="mt-1 text-white/80 text-xs sm:text-sm">
                  Fill the form to preview the letter. Use <strong>Download PDF</strong> for a reliable export.
                </p>
              </div>
              <Link
                href="/pages/hr/letter-generation"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
              >
                <span>← Back</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm"
          >
            {cfg.fields.map(f => (
              <div key={f.name} className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{f.label}</label>
                {f.name === 'salutation' ? (
                  <select
                    value={formData[f.name] ?? cfg?.defaultData?.[f.name] ?? 'Mr'}
                    onChange={e => handleChange(f.name, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                    required
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Ms">Ms</option>
                  </select>
                ) : f.name === 'companyName' ? (
                  <input
                    type="text"
                    value={COMPANY_NAME}
                    readOnly
                    disabled
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700"
                  />
                ) : (
                  <input
                    type={f.type ?? 'text'}
                    value={formData[f.name] ?? ''}
                    placeholder={
                      cfg?.defaultData && f.name in cfg.defaultData ? String(cfg.defaultData[f.name] ?? '') : ''
                    }
                    onChange={e => handleChange(f.name, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
                    required
                  />
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition"
              >
                Generate Letter
              </button>
              <button
                type="button"
                onClick={handleDownloadSimple}
                disabled={!showPreview}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium shadow-sm transition"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!showPreview}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium shadow-sm transition"
              >
                Download HTML Snapshot (beta)
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition"
                onClick={() => setShowPreview(false)}
              >
                Clear Preview
              </button>
            </div>
          </form>

          {/* Preview */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 overflow-auto shadow-sm">
            {showPreview ? (
              <div
                className="min-h-[600px] mx-auto max-w-[800px] bg-white border border-slate-200 rounded-xl shadow-sm ring-1 ring-slate-100 p-6 sm:p-8"
                ref={previewRef}
                data-pdf-root
              >
                <Component data={previewData} />
              </div>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p className="font-medium">No preview yet</p>
                <p className="text-slate-500 dark:text-slate-400">
                  Fill the form and click <span className="font-semibold">Generate Letter</span> to see a live preview
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-md text-sm ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
