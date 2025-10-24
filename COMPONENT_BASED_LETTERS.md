# Component-Based Letter Generation Architecture

## 🎯 **New Architecture Overview**

We've refactored the letter generation system from **template strings** to **React components** for better maintainability, reusability, and type safety.

---

## 📁 **Folder Structure**

```
src/
├── components/
│   └── letters/
│       ├── index.ts                    # Export barrel
│       ├── PromotionLetter.tsx         # ✅ Implemented
│       ├── OfferLetter.tsx             # ✅ Implemented
│       ├── JoiningLetter.tsx           # 🔄 To be created
│       ├── ExperienceLetter.tsx        # 🔄 To be created
│       ├── RelievingLetter.tsx         # 🔄 To be created
│       └── ... (14 more letters)
│
├── app/
│   └── pages/
│       └── hr/
│           └── letter-generation/
│               ├── promotion-letter/
│               │   └── page.tsx        # ✅ Refactored
│               ├── offer-letter/
│               │   └── page.tsx        # 🔄 To be refactored
│               └── ... (other letters)
│
└── lib/
    └── pdf-utils.ts                    # PDF generation utility
```

---

## 🏗️ **Architecture Pattern**

### **Before (Template String Approach):**

```tsx
// ❌ OLD: Hard to maintain, no type safety
const generateLetter = () => {
  const letter = `
    <div style="...">
      <h1>${data.title}</h1>
      <p>Dear ${data.name}</p>
      <!-- Long HTML string... -->
    </div>
  `
  setGeneratedLetter(letter)
}

// Render
<div dangerouslySetInnerHTML={{ __html: generatedLetter }} />
```

### **After (Component-Based Approach):**

```tsx
// ✅ NEW: Reusable, type-safe, maintainable
// Step 1: Create Letter Component
interface PromotionLetterProps {
  data: {
    employeeName: string
    newPosition: string
    // ... other fields
  }
}

export const PromotionLetter: React.FC<PromotionLetterProps> = ({ data }) => {
  return (
    <div style={{...}}>
      {/* Logo & Watermark */}
      <h3>Promotion Letter</h3>
      <p>Dear {data.employeeName}</p>
      {/* ... rest of letter */}
    </div>
  )
}

// Step 2: Use in Page
const [showLetter, setShowLetter] = useState(false)

// Render directly
{showLetter && <PromotionLetter data={formData} />}
```

---

## ✅ **Benefits of Component-Based Approach**

| Aspect | Template String | Component-Based |
|--------|----------------|-----------------|
| **Type Safety** | ❌ No TypeScript support | ✅ Full TypeScript support |
| **Reusability** | ❌ Copy-paste code | ✅ Import and reuse |
| **Maintainability** | ❌ Hard to update | ✅ Easy to modify |
| **Testing** | ❌ Difficult to test | ✅ Unit testable |
| **Refactoring** | ❌ Error-prone | ✅ IDE support |
| **Props Validation** | ❌ Runtime errors | ✅ Compile-time errors |
| **Code Organization** | ❌ 200+ line strings | ✅ Separate files |

---

## 📝 **Creating a New Letter Component**

### **1. Create Component File**

`src/components/letters/YourLetter.tsx`

```tsx
import React from 'react'

interface YourLetterProps {
  data: {
    // Define all required fields
    salutation: string
    employeeName: string
    // ... other fields
  }
}

export const YourLetter: React.FC<YourLetterProps> = ({ data }) => {
  // Helper functions
  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  return (
    <div style={{ position: 'relative', lineHeight: 1.8, color: '#000', fontSize: '14px' }}>
      {/* Logo */}
      <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <img src="/Demandify1.png" alt="Logo" style={{ width: '120px' }} />
      </div>
      
      {/* Watermark */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        opacity: 0.08, 
        zIndex: 0 
      }}>
        <img src="/demandify.png" alt="Watermark" style={{ width: '400px' }} />
      </div>
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ textAlign: 'center', fontSize: '16px', marginTop: '80px' }}>
          Your Letter Title
        </h3>
        
        {/* Letter content here */}
        <p>Dear {data.salutation}. {capitalizeWords(data.employeeName)},</p>
        {/* ... rest of your letter */}
      </div>
    </div>
  )
}
```

### **2. Export from Index**

`src/components/letters/index.ts`

```tsx
export { YourLetter } from './YourLetter'
// ... other exports
```

### **3. Use in Page**

```tsx
import { YourLetter } from '@/components/letters'

export default function YourLetterPage() {
  const [formData, setFormData] = useState({/* ... */})
  const [showLetter, setShowLetter] = useState(false)
  const letterRef = useRef<HTMLDivElement>(null)

  const generateLetter = () => {
    if (!formData.requiredField) {
      alert('Please fill required fields')
      return
    }
    setShowLetter(true)
  }

  const downloadPDF = async () => {
    if (!letterRef.current || !showLetter) {
      alert("Generate letter first")
      return
    }
    
    try {
      const fileName = `Your_Letter_${formData.employeeName}.pdf`
      await generatePDF(letterRef.current, fileName)
      alert('PDF downloaded!')
    } catch (error) {
      alert('PDF generation failed')
    }
  }

  return (
    <>
      {/* Form Section */}
      <div>
        {/* Input fields */}
        <Button onClick={generateLetter}>Generate Letter</Button>
        <Button onClick={downloadPDF}>Download PDF</Button>
      </div>

      {/* Preview Section */}
      <div ref={letterRef}>
        {showLetter ? (
          <YourLetter data={formData} />
        ) : (
          <p>Fill form and click Generate</p>
        )}
      </div>
    </>
  )
}
```

---

## 🎨 **Styling Guidelines**

### **Logo & Watermark (Standard)**

```tsx
{/* Logo - Top Right */}
<div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
  <img src="/Demandify1.png" alt="Logo" style={{ width: '120px', height: 'auto' }} />
</div>

{/* Watermark - Center Background */}
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

{/* Content - Foreground */}
<div style={{ position: 'relative', zIndex: 1 }}>
  {/* Your letter content */}
</div>
```

### **Typography**

```tsx
// Main heading
<h3 style={{ 
  textAlign: 'center', 
  fontSize: '16px', 
  fontWeight: 600, 
  marginTop: '80px'  // Space for logo
}}>

// Body text
<p style={{ fontSize: '14px', lineHeight: 1.8 }}>

// Emphasized text
<b>Bold Text</b>
<strong>Strong Text</strong>
```

---

## 🔄 **Migration Checklist**

For each letter type:

- [ ] 1. Create letter component in `src/components/letters/`
- [ ] 2. Define TypeScript interface for props
- [ ] 3. Implement letter layout with logo & watermark
- [ ] 4. Add helper functions (capitalize, format dates, etc.)
- [ ] 5. Export from `index.ts`
- [ ] 6. Update page to use component
- [ ] 7. Replace `dangerouslySetInnerHTML` with component
- [ ] 8. Test letter generation
- [ ] 9. Test PDF download
- [ ] 10. Verify watermark and logo in PDF

---

## 📊 **Migration Status**

| Letter Type | Component Created | Page Updated | Tested |
|-------------|------------------|--------------|--------|
| **Promotion Letter** | ✅ | ✅ | 🔄 |
| **Offer Letter** | ✅ | ❌ | ❌ |
| Joining Letter | ❌ | ❌ | ❌ |
| Interview Call Letter | ❌ | ❌ | ❌ |
| Experience Letter | ❌ | ❌ | ❌ |
| Relieving Letter | ❌ | ❌ | ❌ |
| Salary Increment Letter | ❌ | ❌ | ❌ |
| Resignation Letter | ❌ | ❌ | ❌ |
| Reference Letter | ❌ | ❌ | ❌ |
| Performance Letter | ❌ | ❌ | ❌ |
| Warning Letter | ❌ | ❌ | ❌ |
| Transfer Letter | ❌ | ❌ | ❌ |
| Separation Letter | ❌ | ❌ | ❌ |
| Leave Approval Letter | ❌ | ❌ | ❌ |
| Appointment Letter | ❌ | ❌ | ❌ |
| Sales Offer Letter | ❌ | ❌ | ❌ |
| Hari Offer Letter | ❌ | ❌ | ❌ |

---

## 🚀 **Next Steps**

1. **Test Promotion Letter** - Verify generation and PDF download
2. **Migrate Offer Letter Page** - Use the OfferLetter component
3. **Create Remaining Components** - Follow the pattern above
4. **Add Unit Tests** - Test each letter component
5. **Update Documentation** - Keep this file current

---

## 💡 **Best Practices**

✅ **DO:**
- Use TypeScript interfaces for all props
- Keep components pure (no side effects)
- Use helper functions for formatting
- Add comments for complex logic
- Test on different browsers

❌ **DON'T:**
- Use dangerouslySetInnerHTML
- Hardcode values (use props)
- Mix business logic with presentation
- Forget logo and watermark
- Skip prop validation

---

**Status:** 🟡 **In Progress**  
**Completed:** 2/17 Components  
**Next:** Test Promotion Letter + Migrate Offer Letter

---

## 📞 **Support**

For questions or issues with the component-based architecture:
1. Check this document
2. Review implemented examples (PromotionLetter, OfferLetter)
3. Follow the creation pattern above

**Last Updated:** October 17, 2025
