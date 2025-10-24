# Batch Migration Summary

## 🚀 Migration Strategy

Due to the large number of pages (14 remaining), I'll provide a comprehensive approach:

### **Completed Migrations:**
1. ✅ **PromotionLetter** - Fully migrated and tested
2. ✅ **SalaryIncrementLetter** - Just completed

### **Ready to Migrate (Standard Pattern):**

These follow the exact same pattern and can be migrated using find/replace:

3. ResignationLetter
4. ReferenceLetter
5. RelievingLetter
6. WarningLetter
7. PerformanceLetter
8. TransferLetter
9. SeparationLetter
10. InterviewCallLetter
11. ExperienceLetter
12. JoiningLetter
13. LeaveApprovalLetter
14. AppointmentLetter

### **Complex (Need Custom Work):**
15. OfferLetter - Has salary calculation logic
16. SalesOfferLetter - Needs component creation first
17. HariOfferLetter - Needs component creation first

---

## 📝 **Standard Migration Pattern**

For pages 3-14, apply these exact changes:

### **1. Add Import**
```tsx
// After the import { generatePDF } line, add:
import { ComponentName } from "@/components/letters"
```

### **2. Change State Declaration**
Find:
```tsx
const [generatedLetter, setGeneratedLetter] = useState<string>("")
```

Replace with:
```tsx
const [showLetter, setShowLetter] = useState(false)
```

### **3. Delete Helper Functions**
Remove these entire functions:
- `capitalizeWords()`
- `formatDate()`
- `formatTimeTo12Hour()` (if present)

### **4. Replace Generate Function**
Find the entire `generate[LetterName]` function and replace with:
```tsx
const generate[LetterName] = () => {
  if (!formData.employeeName) {
    alert('Please fill in all required fields')
    return
  }
  setShowLetter(true)
}
```

### **5. Update Download Function Condition**
Find:
```tsx
if (!letterRef.current || !generatedLetter) {
```

Replace with:
```tsx
if (!letterRef.current || !showLetter) {
```

### **6. Add Better Error Handling**
In the download function's try-catch, update to:
```tsx
try {
  console.log('Starting PDF generation...')
  const employeeName = formData.employeeName || 'Employee'
  const fileName = `[Letter_Type]_${employeeName.replace(/\s+/g, '_')}.pdf`
  await generatePDF(letterRef.current, fileName)
  console.log('PDF generated successfully!')
  alert('PDF downloaded successfully!')
} catch (error) {
  console.error('PDF generation error:', error)
  const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
  alert(errorMessage)
}
```

### **7. Replace Render Block**
Find:
```tsx
{generatedLetter ? (
  <div dangerouslySetInnerHTML={{ __html: generatedLetter }} />
) : (
  <p className="text-sm text-slate-500 text-center py-12">
    Fill in the form and click "Generate Letter" to preview
  </p>
)}
```

Replace with:
```tsx
{showLetter ? (
  <ComponentName data={formData} />
) : (
  <p className="text-sm text-slate-500 text-center py-12">
    Fill in the form and click "Generate Letter" to preview
  </p>
)}
```

---

## 🗺️ **Component Mapping**

| Page File | Component Name | Import Statement |
|-----------|----------------|------------------|
| `resignation-letter/page.tsx` | `ResignationLetter` | `import { ResignationLetter } from "@/components/letters"` |
| `reference-letter/page.tsx` | `ReferenceLetter` | `import { ReferenceLetter } from "@/components/letters"` |
| `relieving-letter/page.tsx` | `RelievingLetter` | `import { RelievingLetter } from "@/components/letters"` |
| `warning-letter/page.tsx` | `WarningLetter` | `import { WarningLetter } from "@/components/letters"` |
| `performance-letter/page.tsx` | `PerformanceLetter` | `import { PerformanceLetter } from "@/components/letters"` |
| `transfer-letter/page.tsx` | `TransferLetter` | `import { TransferLetter } from "@/components/letters"` |
| `separation-letter/page.tsx` | `SeparationLetter` | `import { SeparationLetter } from "@/components/letters"` |
| `interview-call-letter/page.tsx` | `InterviewCallLetter` | `import { InterviewCallLetter } from "@/components/letters"` |
| `experience-letter/page.tsx` | `ExperienceLetter` | `import { ExperienceLetter } from "@/components/letters"` |
| `joining-letter/page.tsx` | `JoiningLetter` | `import { JoiningLetter } from "@/components/letters"` |
| `leave-approval-letter/page.tsx` | `LeaveApprovalLetter` | `import { LeaveApprovalLetter } from "@/components/letters"` |
| `appointment-letter/page.tsx` | `AppointmentLetter` | `import { AppointmentLetter } from "@/components/letters"` |

---

## ⚡ **Quick Migration Script (VS Code)**

### **Using Find & Replace with Regex:**

1. **Open VS Code**
2. **Enable Regex** (Alt+R or click .* button)
3. **Apply these replacements in order:**

#### **Replace 1: Import**
**Find:** `(import { generatePDF } from "@/lib/pdf-utils")`
**Replace:** `$1\nimport { COMPONENT_NAME } from "@/components/letters"`

#### **Replace 2: State**
**Find:** `const \[generatedLetter, setGeneratedLetter\] = useState<string>\(""\)`
**Replace:** `const [showLetter, setShowLetter] = useState(false)`

#### **Replace 3: Condition**
**Find:** `if \(!letterRef\.current \|\| !generatedLetter\)`
**Replace:** `if (!letterRef.current || !showLetter)`

#### **Replace 4: Render**
**Find:** `{generatedLetter \? \(`
**Replace:** `{showLetter ? (`

---

## 🔄 **Migration Order** (Recommended)

### **Phase 1: Simple Letters** (30 mins)
1. ResignationLetter
2. ReferenceLetter  
3. WarningLetter
4. TransferLetter
5. SeparationLetter

### **Phase 2: Medium Complexity** (30 mins)
6. PerformanceLetter
7. InterviewCallLetter
8. ExperienceLetter
9. JoiningLetter
10. LeaveApprovalLetter

### **Phase 3: Complex** (45 mins)
11. RelievingLetter (gender pronouns)
12. AppointmentLetter (salary table)
13. OfferLetter (custom fields)

### **Phase 4: Custom** (60 mins)
14. SalesOfferLetter (create component first)
15. HariOfferLetter (create component first)

---

## 📦 **Auto-Migration Approach**

Since there are many pages, I recommend:

**Option A: I migrate them all now**
- Faster (30-40 minutes total)
- Less manual work for you
- I'll do them systematically

**Option B: You migrate manually**
- Learning experience
- More control
- Takes 2-3 hours

**Option C: Hybrid**
- I do simple ones (7-8 pages)
- You do complex ones with my guidance
- Balance of speed and learning

---

## ✅ **What I'll Do Next**

I'll migrate all the standard pages (3-14) automatically:
1. Update imports
2. Change state management
3. Simplify generate functions
4. Update download functions
5. Replace render blocks
6. Test each one

This will take about 30-40 minutes and cover 12 pages.

The remaining 2 (Sales & Hari offer letters) need components created first.

---

## 🎯 **Expected Result**

After migration:
- ✅ 14/17 pages fully migrated
- ✅ All using component architecture
- ✅ Type-safe with TypeScript
- ✅ Consistent branding
- ✅ PDF generation working
- ✅ No template strings
- ✅ No dangerouslySetInnerHTML

---

**Ready to proceed with auto-migration?** Say "yes" and I'll start migrating all remaining pages! 🚀
