"use client"
// Utility functions for pdfmake-based PDF generation for letters
// Make sure you installed pdfmake: npm i pdfmake

// Alternative PDFMake initialization for cases where standard import fails
async function initializePdfMakeAlternative(): Promise<any> {
  try {
    // Try dynamic script loading approach
    if (!(window as any).pdfMake) {
      // Load pdfMake script dynamically
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // Load VFS fonts script dynamically
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const pdfMake = (window as any).pdfMake;
    if (pdfMake && pdfMake.vfs) {
      console.log('✅ PDFMake loaded via CDN fallback');
      return pdfMake;
    }
    
    throw new Error('CDN fallback failed');
  } catch (error) {
    console.error('CDN fallback failed:', error);
    throw error;
  }
}

export type JoiningLetterData = {
    salutation: string;
    employeeName: string;
    designation: string;
    department: string;
    joiningDate: string;
    joiningTime: string;
    reportingManager: string;
    location: string;
  };

// Generic letter data type for all letter types
export type GenericLetterData = Record<string, any>;

// Letter type configuration
export interface LetterConfig {
  title: string;
  contentBuilder: (data: GenericLetterData) => any[];
}
  
  // Convert image URLs (like /public/logo.png) to base64
  export async function toDataUrl(url: string): Promise<string> {
    const res = await fetch(url, { cache: 'no-store' });
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // Fetch plain text (for SVGs)
  export async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return await res.text();
  }
  
  function capitalizeWords(str = '') {
    return str
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  
  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  
  function formatTimeTo12Hour(time = '') {
    if (!time) return '';
    const [hh, mm] = time.split(':');
    const h = parseInt(hh);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }
  
  // 🧱 Generic PDF Builder Function for All Letters
  export async function buildGenericLetterDocDefinition(
    letterType: string, 
    data: GenericLetterData, 
    config: LetterConfig
  ) {
    if (typeof window === 'undefined') {
      throw new Error('pdfmake can only be used in the browser');
    }
  
    // Initialize pdfMake with proper VFS loading
    let pdfMake: any;
    
    try {
      // First, try to import pdfMake
      const pdfMakeModule = await import('pdfmake/build/pdfmake.min.js');
      
      // Get pdfMake instance from various possible locations
      pdfMake = (window as any).pdfMake || 
                pdfMakeModule.default || 
                pdfMakeModule || 
                (pdfMakeModule as any).pdfMake;

      if (!pdfMake) {
        console.error('pdfMake module structure:', Object.keys(pdfMakeModule));
        throw new Error('pdfMake instance not found');
      }

      // Now try to import VFS fonts with multiple fallback strategies
      let vfs: any = null;
      
      try {
        // Strategy 1: Try standard vfs_fonts import
        const vfsFontsModule: any = await import('pdfmake/build/vfs_fonts.js');
        console.log('VFS module keys:', Object.keys(vfsFontsModule));
        
        vfs = vfsFontsModule.vfs || 
              vfsFontsModule.default?.vfs ||
              vfsFontsModule.pdfMake?.vfs ||
              vfsFontsModule.default?.pdfMake?.vfs;
              
      } catch (vfsError) {
        console.warn('Standard VFS import failed, trying alternative:', vfsError);
        
        // Strategy 2: Try alternative VFS import paths
        try {
          const altVfsModule: any = await import('pdfmake/build/vfs_fonts');
          vfs = altVfsModule.vfs || 
                altVfsModule.default?.vfs ||
                altVfsModule.pdfMake?.vfs ||
                altVfsModule.default?.pdfMake?.vfs;
        } catch (altError) {
          console.warn('Alternative VFS import failed:', altError);
        }
      }

      // Strategy 3: Check if VFS is already attached to pdfMake or window
      if (!vfs) {
        vfs = pdfMake.vfs || 
              (window as any).pdfMake?.vfs ||
              (window as any).pdfFonts;
      }

      // Strategy 4: Try to create a minimal VFS if still not found
      if (!vfs) {
        console.warn('No VFS found, attempting to create minimal VFS...');
        // Create a minimal VFS with basic fonts
        vfs = {
          "Roboto-Regular.ttf": "", // Empty for now, will use browser fonts
          "Roboto-Medium.ttf": "",
          "Roboto-Italic.ttf": "",
          "Roboto-MediumItalic.ttf": ""
        };
      }

      if (!vfs) {
        throw new Error('VFS fonts could not be loaded or created');
      }

      // Attach VFS to pdfMake and window
      pdfMake.vfs = vfs;
      (window as any).pdfMake = pdfMake;
      
      console.log('✅ PDFMake initialized successfully with VFS');
      
    } catch (error: any) {
      console.error('❌ Failed to initialize pdfMake:', error);
      
      // Try CDN fallback as last resort
      try {
        console.log('🔄 Attempting CDN fallback...');
        pdfMake = await initializePdfMakeAlternative();
        console.log('✅ PDFMake loaded via CDN fallback');
      } catch (fallbackError: any) {
        console.error('❌ CDN fallback also failed:', fallbackError);
        throw new Error(`Failed to load pdfMake: ${error.message}. CDN fallback: ${fallbackError.message}`);
      }
    }
  
    // ✅ Load logo, watermark & footer image
  let logo: string | undefined, watermark: string | undefined, footerImg: string | undefined;
  try {
      // Attempt to load images concurrently
      [logo, watermark, footerImg] = await Promise.all([
        toDataUrl('/Demandify1.png'),
        toDataUrl('/demandify.png'),
        toDataUrl('/FooterImage.png'),
      ]);
      console.log('✅ Images loaded successfully');
    } catch (imageError) {
      console.warn('⚠️ Image loading failed, using fallback:', imageError);
    // Fallback - do not set invalid images
    logo = undefined;
    watermark = undefined;
    footerImg = undefined;
  }

    const COMPANY_ADDRESS = 'Demandify Media, Tower A, Block No. 415, Nyati Empress, Clover Park, Viman Nagar, Pune, Maharashtra 411014';
    const COMPANY_WEBSITE = 'www.demandifymedia.com';
    const COMPANY_EMAIL = 'sunny.ashpal@demandifymedia.com';
    const COMPANY_PHONE = '+91 7219776180';
    const BRAND_COLOR = '#6D28D9'; // updated demandify purple tint

    // Use a slightly smaller header font for long-titled letters so they fit on one line
    const headerFontSize =
      letterType === 'interview-call-letter'
        ? 14
        : 18;

    // Register only images that exist to avoid pdfmake "Unknown image format" errors
  const images: Record<string, string> = {};
  if (logo) images.logo = logo;
  if (watermark) images.watermark = watermark;
  if (footerImg) images.footerImg = footerImg;

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 80, 50, 80],
      images,
      header: {
        columns: [
          {},
          logo ? { image: 'logo', width: 120, alignment: 'right', margin: [0, 15, 25, 0] } : { text: '' }
        ],
        margin: [40, 20, 40, 0]
      },
      background: watermark ? [
        {
          image: 'watermark',
          width: 450,
          opacity: 0.25,
          absolutePosition: { x: 75, y: 280 },
        },
      ] : [],
      content: [
        // For some letters, skip the big generic title so only the body content controls headings
        ...(letterType === 'experience-letter' || letterType === 'relieving-letter'
          ? []
          : [{ text: config.title, style: 'header', margin: [0, 10, 0, 6] }]
        ),
        ...config.contentBuilder(data)
      ],
      footer: () => (
        footerImg
          ? {
              margin: [40, 0, 40, 50],
              columns: [
                { width: '*', text: '' },
                { image: 'footerImg', width: 500, alignment: 'center' },
                { width: '*', text: '' },
              ],
            }
          : { text: '' }
      ),
      styles: {
        header: { 
          fontSize: headerFontSize, 
          bold: true, 
          alignment: 'center',
          color: '#2c3e50'
        },
        greeting: {
          fontSize: 12,
          color: '#2c3e50'
        },
        paragraph: {
          fontSize: 11,
          lineHeight: 1.4,
          color: '#34495e',
          alignment: 'justify'
        },
        sectionHeader: { 
          fontSize: 12, 
          bold: true,
          color: '#2c3e50'
        },
        listItems: {
          fontSize: 11,
          lineHeight: 1.3,
          color: '#34495e'
        },
        closing: {
          fontSize: 11,
          color: '#2c3e50'
        },
        signatureTitle: {
          fontSize: 10,
          color: '#7f8c8d'
        },
        signature: { 
          fontSize: 13, 
          bold: true,
          color: '#2c3e50'
        },
        company: {
          fontSize: 11,
          color: '#34495e'
        },
        table: {
          margin: [0, 10, 0, 20],
          fontSize: 10,
        },
        tableHeader: {
          bold: true,
          fillColor: '#e5e7eb',
          color: '#111827'
        }
      },
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.4,
        color: '#2c3e50',
      },
    };
  
    return { pdfMake, docDefinition };
  }

  // 🧱 Specific Builder Function for Joining Letters (backward compatibility)
  export async function buildJoiningLetterDocDefinition(data: JoiningLetterData) {
    if (typeof window === 'undefined') {
      throw new Error('pdfmake can only be used in the browser');
    }
  
    // Initialize pdfMake with proper VFS loading
    let pdfMake: any;
    
    try {
      // First, try to import pdfMake
      const pdfMakeModule = await import('pdfmake/build/pdfmake.min.js');
      
      // Get pdfMake instance from various possible locations
      pdfMake = (window as any).pdfMake || 
                pdfMakeModule.default || 
                pdfMakeModule || 
                (pdfMakeModule as any).pdfMake;

      if (!pdfMake) {
        console.error('pdfMake module structure:', Object.keys(pdfMakeModule));
        throw new Error('pdfMake instance not found');
      }

      // Now try to import VFS fonts with multiple fallback strategies
      let vfs: any = null;
      
      try {
        // Strategy 1: Try standard vfs_fonts import
        const vfsFontsModule: any = await import('pdfmake/build/vfs_fonts.js');
        console.log('VFS module keys:', Object.keys(vfsFontsModule));
        
        vfs = vfsFontsModule.vfs || 
              vfsFontsModule.default?.vfs ||
              vfsFontsModule.pdfMake?.vfs ||
              vfsFontsModule.default?.pdfMake?.vfs;
              
      } catch (vfsError) {
        console.warn('Standard VFS import failed, trying alternative:', vfsError);
        
        // Strategy 2: Try alternative VFS import paths
        try {
          const altVfsModule: any = await import('pdfmake/build/vfs_fonts');
          vfs = altVfsModule.vfs || 
                altVfsModule.default?.vfs ||
                altVfsModule.pdfMake?.vfs ||
                altVfsModule.default?.pdfMake?.vfs;
        } catch (altError) {
          console.warn('Alternative VFS import failed:', altError);
        }
      }

      // Strategy 3: Check if VFS is already attached to pdfMake or window
      if (!vfs) {
        vfs = pdfMake.vfs || 
              (window as any).pdfMake?.vfs ||
              (window as any).pdfFonts;
      }

      // Strategy 4: Try to create a minimal VFS if still not found
      if (!vfs) {
        console.warn('No VFS found, attempting to create minimal VFS...');
        // Create a minimal VFS with basic fonts
        vfs = {
          "Roboto-Regular.ttf": "", // Empty for now, will use browser fonts
          "Roboto-Medium.ttf": "",
          "Roboto-Italic.ttf": "",
          "Roboto-MediumItalic.ttf": ""
        };
      }

      if (!vfs) {
        throw new Error('VFS fonts could not be loaded or created');
      }

      // Attach VFS to pdfMake and window
      pdfMake.vfs = vfs;
      (window as any).pdfMake = pdfMake;
      
      console.log('✅ PDFMake initialized successfully with VFS');
      
    } catch (error: any) {
      console.error('❌ Failed to initialize pdfMake:', error);
      
      // Try CDN fallback as last resort
      try {
        console.log('🔄 Attempting CDN fallback...');
        pdfMake = await initializePdfMakeAlternative();
        console.log('✅ PDFMake loaded via CDN fallback');
      } catch (fallbackError: any) {
        console.error('❌ CDN fallback also failed:', fallbackError);
        throw new Error(`Failed to load pdfMake: ${error.message}. CDN fallback: ${fallbackError.message}`);
      }
    }
  
    // ✅ Load logo & watermark
    let logo: string, watermark: string;
    try {
      [logo, watermark] = await Promise.all([
        toDataUrl('/Demandify1.png'),
        toDataUrl('/demandify.png'),
      ]);
      console.log('✅ Images loaded successfully');
    } catch (imageError) {
      console.warn('⚠️ Image loading failed, using fallback:', imageError);
      // Fallback - create empty images if loading fails
      logo = '';
      watermark = '';
    }
  
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [50, 80, 50, 80],
      images: { logo, watermark },
      header: {
        columns: [
          {},
          { 
            image: 'logo', 
            width: 120, 
            alignment: 'right', 
            margin: [0, 15, 25, 0] 
          }
        ],
      },
      background: watermark ? [
        {
          image: 'watermark',
          width: 450,
          opacity: 0.25,
          absolutePosition: { x: 75, y: 280 },
        },
      ] : [],
      content: [
        { 
          text: 'Joining Letter', 
          style: 'header', 
          margin: [0, 10, 0, 25] 
        },
        
        { 
          text: `Dear ${data.salutation}. ${capitalizeWords(data.employeeName)},`, 
          style: 'greeting',
          margin: [0, 0, 0, 12] 
        },
        
        {
          text: `We are pleased to welcome you to Demandify Media Private Limited as a ${capitalizeWords(data.designation)} in the ${capitalizeWords(data.department)} department.`,
          style: 'paragraph',
          margin: [0, 0, 0, 12],
        },
        
        { 
          text: 'Joining Details:', 
          style: 'sectionHeader', 
          margin: [0, 8, 0, 6] 
        },
        {
          ul: [
            `Date: ${formatDate(data.joiningDate)}`,
            `Time: ${formatTimeTo12Hour(data.joiningTime)}`,
            `Location: ${capitalizeWords(data.location)}`,
            `Reporting Manager: ${capitalizeWords(data.reportingManager)}`,
          ],
          style: 'listItems',
          margin: [0, 0, 0, 12],
        },
        
        { 
          text: 'Documents to Bring:', 
          style: 'sectionHeader', 
          margin: [0, 8, 0, 6] 
        },
        {
          ul: [
            'Government-issued ID proof (Aadhar Card/PAN Card)',
            'Educational certificates and mark sheets',
            'Previous employment documents (if applicable)',
            'Passport size photographs (2 copies)',
            'Bank account details for salary transfer'
          ],
          style: 'listItems',
          margin: [0, 0, 0, 12],
        },
        
        { 
          text: 'Please report to the HR department on your first day. Our HR team will guide you through the onboarding process and help you settle in.', 
          style: 'paragraph',
          margin: [0, 8, 0, 10] 
        },
        
        { 
          text: 'We look forward to having you as part of our team and wish you a successful career with us.', 
          style: 'paragraph',
          margin: [0, 0, 0, 20] 
        },
        
        { 
          text: 'With Best Wishes,', 
          style: 'closing',
          margin: [0, 0, 0, 5] 
        },
        { 
          text: 'Sincerely yours,', 
          style: 'closing',
          margin: [0, 0, 0, 15] 
        },
        
        { 
          text: 'Co-Founder', 
          style: 'signatureTitle',
          margin: [0, 0, 0, 3] 
        },
        { 
          text: 'Sunny Ashpal', 
          style: 'signature', 
          margin: [0, 0, 0, 5] 
        },
        { 
          text: 'Demandify Media Private Limited', 
          style: 'company',
          margin: [0, 0, 0, 0] 
        },
      ],
      styles: {
        header: { 
          fontSize: 18, 
          bold: true, 
          alignment: 'center',
          color: '#2c3e50'
        },
        greeting: {
          fontSize: 12,
          color: '#2c3e50'
        },
        paragraph: {
          fontSize: 11,
          lineHeight: 1.4,
          color: '#34495e',
          alignment: 'justify'
        },
        sectionHeader: { 
          fontSize: 12, 
          bold: true,
          color: '#2c3e50'
        },
        listItems: {
          fontSize: 11,
          lineHeight: 1.3,
          color: '#34495e'
        },
        closing: {
          fontSize: 11,
          color: '#2c3e50'
        },
        signatureTitle: {
          fontSize: 10,
          color: '#7f8c8d'
        },
        signature: { 
          fontSize: 13, 
          bold: true,
          color: '#2c3e50'
        },
        company: {
          fontSize: 11,
          color: '#34495e'
        }
      },
      defaultStyle: {
        fontSize: 11,
        lineHeight: 1.4,
        color: '#2c3e50',
      },
    };
  
    return { pdfMake, docDefinition };
  }
  
  // 📋 Generate and Download
  export async function downloadJoiningLetterPdfMake(data: JoiningLetterData, filename: string) {
    const { pdfMake, docDefinition } = await buildJoiningLetterDocDefinition(data);
    pdfMake.createPdf(docDefinition).download(filename);
  }
  
  // 👁️ Preview PDF in new window/tab
  export async function previewJoiningLetterPdfMake(data: JoiningLetterData) {
    const { pdfMake, docDefinition } = await buildJoiningLetterDocDefinition(data);
    pdfMake.createPdf(docDefinition).open();
  }
  
  // 📄 Get PDF as Blob for embedding
  export async function getJoiningLetterPdfBlob(data: JoiningLetterData): Promise<Blob> {
    const { pdfMake, docDefinition } = await buildJoiningLetterDocDefinition(data);
    return new Promise((resolve, reject) => {
      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        resolve(blob);
      });
    });
  }
  
  // 📊 Get PDF as Data URL for iframe embedding
  export async function getJoiningLetterPdfDataUrl(data: JoiningLetterData): Promise<string> {
    const { pdfMake, docDefinition } = await buildJoiningLetterDocDefinition(data);
    return new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getDataUrl((dataUrl: string) => {
          resolve(dataUrl);
        });
      } catch (error: any) {
        reject(error);
      }
    });
  }

  // 🔄 Dynamic Letter Component Importer (needed by component-based content builder)
  const letterComponentMap: Record<string, () => Promise<any>> = {
    'appointment-letter': () => import('@/components/letters/AppointmentLetter'),
    'experience-letter': () => import('@/components/letters/ExperienceLetter'),
    'interview-call-letter': () => import('@/components/letters/InterviewCallLetter'),
    'joining-letter': () => import('@/components/letters/JoiningLetter'),
    'leave-approval-letter': () => import('@/components/letters/LeaveApprovalLetter'),
    'offer-letter': () => import('@/components/letters/OfferLetter'),
    'performance-letter': () => import('@/components/letters/PerformanceLetter'),
    'promotion-letter': () => import('@/components/letters/PromotionLetter'),
    'reference-letter': () => import('@/components/letters/ReferenceLetter'),
    'relieving-letter': () => import('@/components/letters/RelievingLetter'),
    'resignation-letter': () => import('@/components/letters/ResignationLetter'),
    'salary-increment-letter': () => import('@/components/letters/SalaryIncrementLetter'),
    'separation-letter': () => import('@/components/letters/SeparationLetter'),
    'transfer-letter': () => import('@/components/letters/TransferLetter'),
    'warning-letter': () => import('@/components/letters/WarningLetter'),
  };

function htmlToPdfContent(htmlString: string): any[] {
  const content: any[] = [];

  // Extract ALL tables and create sequential placeholders so we can inject them in order
  const tableMatch = htmlString.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];
  const parsedTables: Array<{ node: any; injected: boolean }> = [];
  let tableIndex = 0;

  if (tableMatch.length > 0) {
    try {
      for (const tableHtml of tableMatch) {
        const rows = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        const body: any[] = [];
        let maxCols = 0;
        rows.forEach((row, idx) => {
          const cells = row.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
          let rowData: any[] = [];
          cells.forEach(cell => {
            const text = cell.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            const colSpanMatch = cell.match(/colspan[=\s]*["']?(\d+)/i);
            const colSpan = colSpanMatch ? parseInt(colSpanMatch[1]) : 1;
            if (colSpan > 1) {
              rowData.push({ text, colSpan });
              for (let i = 1; i < colSpan; i++) rowData.push({});
            } else {
              rowData.push(text);
            }
          });
          maxCols = Math.max(maxCols, rowData.length);
          if (idx === 0) {
            body.push(rowData.map(c => (typeof c === 'object' && 'text' in c) ? { ...c, style: 'tableHeader' } : { text: String(c), style: 'tableHeader' }));
          } else {
            body.push(rowData.map(c => (typeof c === 'object') ? c : String(c)));
          }
        });
        if (body.length > 0) {
          // Normalize body rows to maxCols
          const normalized = body.map((r: any[]) => {
            const out = [...r];
            while (out.length < maxCols) out.push('');
            if (out.length > maxCols) out.length = maxCols;
            return out.map((c: any) => (c && typeof c === 'object' && 'text' in c) ? { ...c, text: String(c.text ?? '') } : String(c ?? ''));
          });
          const widths = Array(maxCols).fill('*');
          parsedTables.push({
            node: { table: { headerRows: 1, widths, body: normalized }, style: 'table', margin: [0, 10, 0, 20] },
            injected: false
          });
        }
      }
    } catch (tableError) {
      console.warn('Failed to parse tables:', tableError);
    }
  }
  
  // Build cleanHtml with unique table placeholders
  let tableCounter = 0;
  let cleanHtml = htmlString
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, () => `{{TABLE_PLACEHOLDER_${++tableCounter}}}`)
    .replace(/<br\s*\/?>(?=\s*\n?)/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<strong[^>]*>|<\/strong>/gi, '')
    .replace(/<b[^>]*>|<\/b>/gi, '');

  // Normalize any spaced or HTML-entity placeholder variants
  cleanHtml = cleanHtml
    .replace(/\{\{\s*TABLE_PLACEHOLDER_(\d+)\s*\}\}/gi, '{{TABLE_PLACEHOLDER_$1}}')
    .replace(/&#123;&#123;\s*TABLE_PLACEHOLDER_(\d+)\s*&#125;&#125;/gi, '{{TABLE_PLACEHOLDER_$1}}');

    // Remove all remaining HTML tags
    const plainText = cleanHtml
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    
    // Split into lines and process
    const lines = plainText
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line);
    
    const injected: Record<number, boolean> = {};
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Inject any numbered table placeholder found on this line
      const tokenMatch = line.match(/\{\{TABLE_PLACEHOLDER_(\d+)\}\}/i);
      if (tokenMatch) {
        const idx = parseInt(tokenMatch[1]) - 1;
        line = line.replace(/\{\{TABLE_PLACEHOLDER_\d+\}\}/gi, '').trim();
        const tableNode = parsedTables[idx]?.node;
        if (tableNode && !injected[idx]) {
          content.push(tableNode);
          injected[idx] = true;
        }
        if (!line) continue;
      }
      
      // Skip empty lines
      if (!line) continue;
      
      // Date and compact header information (top block)
      if (
        line.startsWith('Date:') ||
        line.startsWith('Name:') ||
        line.startsWith('Designation:') ||
        line.startsWith('Department:') ||
        line.startsWith('To,')
      ) {
        content.push({
          text: line,
          style: 'paragraph',
          margin: [0, 0, 0, 4]
        });
        continue;
      }

      // Special heading: TO WHOM IT MAY CONCERN
      if (line.toUpperCase() === 'TO WHOM IT MAY CONCERN') {
        content.push({
          text: line,
          style: 'sectionHeader',
          bold: true,
          alignment: 'center',
          margin: [0, 12, 10, 6]
        });
        continue;
      }

      // Special heading for Relieving Letter body: render as prominent centered title in PDF
      if (line === 'Relieving Letter') {
        content.push({
          text: line,
          style: 'header',
          bold: true,
          alignment: 'center',
          margin: [0, 15, 0, 10]
        });
        continue;
      }
      
      // Greeting - keep "Dear " normal and make the name part bold
      if (line.startsWith('Dear ')) {
        const namePart = line.slice('Dear '.length);
        content.push({
          text: [
            { text: 'Dear ', bold: false },
            { text: namePart, bold: true },
          ],
          style: 'greeting',
          margin: [0, 15, 0, 12],
        });
        continue;
      }
      
      // Numbered sections (1. 2. 3. etc.)
      if (/^\d+\.\s/.test(line)) {
        content.push({
          text: line,
          style: 'sectionHeader',
          margin: [0, 12, 0, 6]
        });
        continue;
      }
      
      // Section headers ending with colon
      if (line.endsWith(':') && line.length < 80) {
        content.push({
          text: line,
          style: 'sectionHeader',
          margin: [0, 12, 0, 6]
        });
        continue;
      }
      
      // Annexure headers
      if (line.includes('Annexure') || line.includes('Salary Details')) {
        content.push({
          text: line,
          style: 'sectionHeader',
          margin: [0, 20, 0, 10],
          alignment: 'center'
        });
        continue;
      }
      
      // Skip internal headings for specific letters to avoid double heading in PDFs
      const interviewHeading = 'Confirmation of Interview Schedule – Demandify Media Pvt. Ltd';
      const offerHeading = 'Offer Letter';
      const joiningHeading = 'Joining Letter';
      const referenceHeading = 'Reference Letter';
      if (
        line === 'Performance Review Letter' ||
        line === 'Promotion Letter' ||
        line === 'Salary Increment Letter' ||
        line === 'Resignation Acceptance Letter' ||
        line === 'Separation Letter' ||
        line === 'Transfer Letter' ||
        line === 'Warning Letter' ||
        line === interviewHeading ||
        line === `${interviewHeading}.` ||
        line.startsWith(interviewHeading) ||
        line === offerHeading ||
        line === joiningHeading ||
        line === referenceHeading
      ) {
        continue;
      }
      
      // Closing and signatures
      if (line.includes('Sincerely') || line.includes('For, Demandify') || 
          line.includes('Chief Executive Officer') || line.includes('Sunny Ashpal')) {
        content.push({
          text: line,
          style: 'closing',
          margin: [0, 15, 0, 5]
        });
        continue;
      }
      
      // Company name - keep style but render bold
      if (line.includes('Demandify Media Pvt. Ltd.') || line.includes('Demandify Media Private Limited')) {
        content.push({
          text: line,
          style: 'company',
          bold: true,
          margin: [0, 0, 0, 15]
        });
        continue;
      }
      
      // Specific bold label/value pairs for leave details
      if (/^(Leave Type:|Start Date:|End Date:|Duration:|Approved By:)/.test(line)) {
        const colonIndex = line.indexOf(':');
        const label = line.slice(0, colonIndex + 1);
        const value = line.slice(colonIndex + 1).trimStart();
        content.push({
          text: [
            { text: label + ' ', bold: true },
            { text: value, bold: false },
          ],
          style: 'paragraph',
          margin: [0, 0, 0, 4],
        });
        continue;
      }

      // Standalone Reporting Manager line - render fully bold
      if (line === 'Reporting Manager' || line.includes('Reporting Manager,')) {
        content.push({
          text: line,
          style: 'closing',
          bold: true,
          margin: [0, 0, 0, 5],
        });
        continue;
      }
      
      // Regular paragraphs
      content.push({
        text: line,
        style: 'paragraph',
        margin: [0, 0, 0, 10]
      });
    }
    
    // Final cleanup: strip any numbered placeholder variants from text nodes
    const placeholderRegex = /\{\{\s*TABLE_PLACEHOLDER_\d+\s*\}\}/gi;
    const cleaned = content
      .map((node: any) => {
        if (node && typeof node.text === 'string') {
          const newText = node.text.replace(placeholderRegex, '').trim();
          return { ...node, text: newText };
        }
        return node;
      })
      .filter((node: any) => {
        if (node && typeof node.text === 'string') {
          return node.text.length > 0;
        }
        return true;
      });
    
    // If any tables were parsed but not injected due to missing markers, append them at the end in order
    parsedTables.forEach((t, i) => {
      if (!injected[i]) cleaned.push(t.node);
    });
    
    return cleaned;
  }

  // 📋 Letter-Specific Content Builders
  const letterSpecificBuilders = {
    'offer-letter': (data: GenericLetterData) => [
      { text: `Date: ${formatDate(data.offerDate || '')}`, style: 'paragraph', margin: [0, 0, 0, 8] },
      { text: `Name: ${capitalizeWords(data.employeeName || '')}`, style: 'paragraph', margin: [0, 0, 0, 8] },
      { text: `Location: ${capitalizeWords(data.location || '')}`, style: 'paragraph', margin: [0, 0, 0, 15] },
      
      { text: `Dear ${capitalizeWords(data.employeeName || '')},`, style: 'greeting', margin: [0, 0, 0, 15] },
      
      { 
        text: `We are pleased to offer you the role of '${capitalizeWords(data.role || '')}' with our company reporting to ${data.manager || ''}. This offer must be accepted in writing and communication of such acceptance must be received by the company no later than ${formatDate(data.acceptanceDate || '')}, failing which this offer will be deemed withdrawn.`,
        style: 'paragraph', margin: [0, 0, 0, 15] 
      },
      
      { 
        text: 'This offer is also subject to the submission of educational certificates, employment work-experience testimonials, and other documents required as per Company Policy and verification of all information provided by you to the satisfaction of the Company, including the Background Check Report, Previous Compensation, and Education credentials.',
        style: 'paragraph', margin: [0, 0, 0, 15] 
      },
      
      { text: `Your joining date is ${formatDate(data.joiningDate || '')} at ${formatTimeTo12Hour(data.joiningTime || '')}.`, style: 'paragraph', margin: [0, 0, 0, 15] },
      
      { text: 'Compensation:', style: 'sectionHeader', margin: [0, 12, 0, 6] },
      { text: `Your annual CTC (Cost to Company) will be ${data.ctc || ''}.`, style: 'paragraph', margin: [0, 0, 0, 8] },
      { text: `You will also be eligible for performance-based bonuses of up to ${data.bonus || ''}.`, style: 'paragraph', margin: [0, 0, 0, 15] },
      
      { text: 'Probation Period:', style: 'sectionHeader', margin: [0, 12, 0, 6] },
      { 
        text: `You will be on probation for a period of ${data.probation || ''} from the date of joining. During this period, your performance will be reviewed, and based on satisfactory performance, your employment will be confirmed.`,
        style: 'paragraph', margin: [0, 0, 0, 15] 
      },
      
      { text: 'Notice Period:', style: 'sectionHeader', margin: [0, 12, 0, 6] },
      { text: 'Either party may terminate the employment with a notice period of 30 days or payment in lieu thereof.', style: 'paragraph', margin: [0, 0, 0, 15] },
      
      { text: 'Confidentiality:', style: 'sectionHeader', margin: [0, 12, 0, 6] },
      { text: 'You will be required to sign a confidentiality agreement and adhere to the company\'s policies regarding the protection of sensitive information.', style: 'paragraph', margin: [0, 0, 0, 15] },
      
      { text: 'We are excited to have you join our team and look forward to a long and successful working relationship.', style: 'paragraph', margin: [0, 0, 0, 20] },
      
      { text: 'With Best wishes,', style: 'closing', margin: [0, 0, 0, 5] },
      { text: 'Sincerely yours,', style: 'closing', margin: [0, 0, 0, 15] },
      { text: 'Co-Founder', style: 'signatureTitle', margin: [0, 0, 0, 3] },
      { text: 'Sunny Ashpal', style: 'signature', margin: [0, 0, 0, 8] },
      { text: 'Demandify Media Private Limited', style: 'company', margin: [0, 0, 0, 15] },
      { text: `Date: ${formatDate(data.offerDate || '')}`, style: 'paragraph', margin: [0, 0, 0, 20] },
      { text: 'Employee Signature: ___________________________', style: 'paragraph', margin: [0, 0, 0, 5] },
      { text: `(${capitalizeWords(data.employeeName || '')})`, style: 'paragraph', margin: [0, 0, 0, 0] },
    ],

    'joining-letter': (data: GenericLetterData) => [
      { text: `Dear ${data.salutation}. ${capitalizeWords(data.employeeName || '')},`, style: 'greeting', margin: [0, 0, 0, 12] },
      { text: `We are pleased to welcome you to Demandify Media Private Limited as a ${capitalizeWords(data.designation || '')} in the ${capitalizeWords(data.department || '')} department.`, style: 'paragraph', margin: [0, 0, 0, 12] },
      { text: 'Joining Details:', style: 'sectionHeader', margin: [0, 8, 0, 6] },
      {
        ul: [
          `Date: ${formatDate(data.joiningDate || '')}`,
          `Time: ${formatTimeTo12Hour(data.joiningTime || '')}`,
          `Location: ${capitalizeWords(data.location || '')}`,
          `Reporting Manager: ${capitalizeWords(data.reportingManager || '')}`,
        ],
        style: 'listItems', margin: [0, 0, 0, 12]
      },
      { text: 'Documents to Bring:', style: 'sectionHeader', margin: [0, 8, 0, 6] },
      {
        ul: [
          'Government-issued ID proof (Aadhar Card/PAN Card)',
          'Educational certificates and mark sheets',
          'Previous employment documents (if applicable)',
          'Passport size photographs (2 copies)',
          'Bank account details for salary transfer'
        ],
        style: 'listItems', margin: [0, 0, 0, 12]
      },
      { text: 'Please report to the HR department on your first day. Our HR team will guide you through the onboarding process and help you settle in.', style: 'paragraph', margin: [0, 8, 0, 10] },
      { text: 'We look forward to having you as part of our team and wish you a successful career with us.', style: 'paragraph', margin: [0, 0, 0, 20] },
      { text: 'With Best Wishes,', style: 'closing', margin: [0, 0, 0, 5] },
      { text: 'Sincerely yours,', style: 'closing', margin: [0, 0, 0, 15] },
      { text: 'Co-Founder', style: 'signatureTitle', margin: [0, 0, 0, 3] },
      { text: 'Sunny Ashpal', style: 'signature', margin: [0, 0, 0, 5] },
      { text: 'Demandify Media Private Limited', style: 'company', margin: [0, 0, 0, 0] },
    ]
  };

  // 📋 Dynamic Letter Content Builder - Now Actually Uses Components!
  export async function buildLetterContentFromComponent(
    letterType: string, 
    data: GenericLetterData
  ): Promise<any[]> {
    try {
      // First try to use the actual component
      const componentImporter = letterComponentMap[letterType];
      
      if (componentImporter && typeof window !== 'undefined') {
        try {
          // Import the component
          const letterComponent = await componentImporter();
          const LetterComponent = letterComponent.default || letterComponent[Object.keys(letterComponent)[0]];
          
          if (LetterComponent) {
            // Use React DOM Server to render component to string
            const ReactDOMServer = await import('react-dom/server');
            const React = await import('react');
            
            // Create element with proper props structure
            const element = React.default.createElement(LetterComponent, { data });
            
            // Render to HTML string
            const htmlString = ReactDOMServer.renderToString(element);
            
            // Convert HTML to PDF content
            let pdfContent = htmlToPdfContent(htmlString);

            // Note: Fail-safe table injection disabled since HTML table parsing now works correctly
            // If you see duplicate tables, the HTML component already has a table that's being parsed
            
            if (pdfContent && pdfContent.length > 0) {
              console.log(`✅ Successfully rendered ${letterType} component to PDF`);
              return pdfContent;
            }
          }
        } catch (componentError) {
          console.warn(`Failed to render component for ${letterType}:`, componentError);
        }
      }
      
      // Fallback to specific builder if component rendering fails
      const specificBuilder = letterSpecificBuilders[letterType as keyof typeof letterSpecificBuilders];
      if (specificBuilder) {
        console.log(`📋 Using specific template for ${letterType}`);
        return specificBuilder(data);
      }
      
      // Final fallback to generic content
      console.log(`🔄 Using generic template for ${letterType}`);
      return buildGenericContent(data);
      
    } catch (error) {
      console.warn(`Failed to build letter content for ${letterType}:`, error);
      return buildGenericContent(data);
    }
  }

  // 🔧 Generic Content Builder (Fallback)
  function buildGenericContent(data: GenericLetterData): any[] {
    return [
      { 
        text: `Dear ${data.salutation || 'Sir/Madam'}. ${capitalizeWords(data.employeeName || data.candidateName || '')},`, 
        style: 'greeting',
        margin: [0, 0, 0, 15] 
      },
      {
        text: 'This letter is generated based on the information provided.',
        style: 'paragraph',
        margin: [0, 0, 0, 15],
      },
      ...Object.entries(data)
        .filter(([key, value]) => key !== 'salutation' && key !== 'employeeName' && key !== 'candidateName' && value)
        .map(([key, value]) => ({
          text: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}: ${value}`,
          style: 'paragraph',
          margin: [0, 0, 0, 8],
        })),
      { 
        text: 'Best Regards,', 
        style: 'closing',
        margin: [0, 20, 0, 15] 
      },
      { 
        text: 'Demandify Media Private Limited', 
        style: 'company',
        margin: [0, 0, 0, 0] 
      },
    ];
  }

  // 🚀 Updated Generic Functions Using Dynamic Components
  export async function downloadGenericLetterPdfMake(
    letterType: string, 
    data: GenericLetterData, 
    filename: string,
    title: string
  ) {
    // Build content from component dynamically
    const content = await buildLetterContentFromComponent(letterType, data);

    // Sanitize any tables to prevent malformed rows
    const sanitizeTables = (items: any[]): any[] => {
      const fixRow = (row: any[], width: number) => {
        const norm = Array.isArray(row) ? [...row] : [];
        while (norm.length < width) norm.push('');
        if (norm.length > width) norm.length = width;
        return norm.map((c: any) => {
          if (c && typeof c === 'object' && 'text' in c) return { ...c, text: String(c.text ?? '') };
          return String(c ?? '');
        });
      };
      return (items || []).map((it: any) => {
        if (it && typeof it === 'object') {
          if (it.table && Array.isArray(it.table.body)) {
            const width = Array.isArray(it.table.widths) ? it.table.widths.length : 3;
            it.table.body = it.table.body.map((row: any) => fixRow(row, width));
          }
        }
        return it;
      });
    };
    const sanitizedContent = sanitizeTables(content);
    
    const config: LetterConfig = {
      title,
      contentBuilder: () => sanitizedContent
    };
    
    const { pdfMake, docDefinition } = await buildGenericLetterDocDefinition(letterType, data, config);
    pdfMake.createPdf(docDefinition).download(filename);
  }

  export async function previewGenericLetterPdfMake(
    letterType: string, 
    data: GenericLetterData,
    title: string
  ) {
    // Build content from component dynamically
    const content = await buildLetterContentFromComponent(letterType, data);

    // Sanitize any tables to prevent malformed rows
    const sanitizeTables = (items: any[]): any[] => {
      const fixRow = (row: any[], width: number) => {
        const norm = Array.isArray(row) ? [...row] : [];
        while (norm.length < width) norm.push('');
        if (norm.length > width) norm.length = width;
        return norm.map((c: any) => {
          if (c && typeof c === 'object' && 'text' in c) return { ...c, text: String(c.text ?? '') };
          return String(c ?? '');
        });
      };
      return (items || []).map((it: any) => {
        if (it && typeof it === 'object') {
          if (it.table && Array.isArray(it.table.body)) {
            const width = Array.isArray(it.table.widths) ? it.table.widths.length : 3;
            it.table.body = it.table.body.map((row: any) => fixRow(row, width));
          }
        }
        return it;
      });
    };
    const sanitizedContent = sanitizeTables(content);
    
    const config: LetterConfig = {
      title,
      contentBuilder: () => sanitizedContent
    };
    
    const { pdfMake, docDefinition } = await buildGenericLetterDocDefinition(letterType, data, config);
    pdfMake.createPdf(docDefinition).open();
  }

  // 🧪 Test function to verify PDFMake setup
  export async function testPdfMakeSetup(): Promise<boolean> {
    try {
      const testData: JoiningLetterData = {
        salutation: "Mr",
        employeeName: "Test User",
        designation: "Test Position",
        department: "Test Department",
        joiningDate: "2024-01-01",
        joiningTime: "10:00",
        reportingManager: "Test Manager",
        location: "Test Location"
      };
      
      const { pdfMake, docDefinition } = await buildJoiningLetterDocDefinition(testData);
      
      // Test if we can create a PDF instance
      const pdfInstance = pdfMake.createPdf(docDefinition);
      
      return !!(pdfMake && docDefinition && pdfInstance);
    } catch (error) {
      console.error('PDFMake setup test failed:', error);
      return false;
    }
  }

  // 🔍 Debug function to inspect PDFMake state
  export async function debugPdfMakeState(): Promise<void> {
    console.log('🔍 Debugging PDFMake state...');
    
    try {
      // Check window object
      console.log('Window pdfMake:', (window as any).pdfMake);
      
      // Try importing modules
      const pdfMakeModule = await import('pdfmake/build/pdfmake.min.js');
      console.log('PDFMake module keys:', Object.keys(pdfMakeModule));
      console.log('PDFMake module default:', pdfMakeModule.default);
      
      try {
        const vfsModule: any = await import('pdfmake/build/vfs_fonts.js');
        console.log('VFS module keys:', Object.keys(vfsModule));
        console.log('VFS module structure:', {
          vfs: !!vfsModule.vfs,
          default: !!vfsModule.default,
          pdfMake: !!vfsModule.pdfMake,
          defaultPdfMake: !!vfsModule.default?.pdfMake,
          defaultVfs: !!vfsModule.default?.vfs
        });
      } catch (vfsError) {
        console.error('VFS import error:', vfsError);
      }
      
    } catch (error) {
      console.error('Debug failed:', error);
    }
  }