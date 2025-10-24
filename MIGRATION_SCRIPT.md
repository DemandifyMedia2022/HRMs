# Letter Page Migration Script

## Quick Migration Guide

For each letter page, apply these changes:

### 1. Add Component Import

```tsx
// Add to imports
import { LetterComponentName } from "@/components/letters"
```

### 2. Replace State

```tsx
// OLD
const [generatedLetter, setGeneratedLetter] = useState<string>("")

// NEW
const [showLetter, setShowLetter] = useState(false)
```

### 3. Simplify Generate Function

```tsx
// OLD - Delete entire template string generation

// NEW
const generateLetterName = () => {
  if (!formData.requiredField) {
    alert('Please fill in all required fields')
    return
  }
  setShowLetter(true)
}
```

### 4. Update Download Function

```tsx
// OLD
if (!letterRef.current || !generatedLetter) {

// NEW  
if (!letterRef.current || !showLetter) {

// Add better logging
try {
  console.log('Starting PDF generation...')
  // ... existing code
  console.log('PDF generated successfully!')
  alert('PDF downloaded successfully!')
} catch (error) {
  console.error('PDF generation error:', error)
  const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
  alert(errorMessage)
}
```

### 5. Replace Render

```tsx
// OLD
{generatedLetter ? (
  <div dangerouslySetInnerHTML={{ __html: generatedLetter }} />
) : (
  <p>Fill form...</p>
)}

// NEW
{showLetter ? (
  <LetterComponentName data={formData} />
) : (
  <p>Fill in the form and click "Generate Letter" to preview</p>
)}
```

## Pages to Migrate

- [x] PromotionLetter
- [x] SalaryIncrementLetter  
- [ ] ResignationLetter
- [ ] ReferenceLetter
- [ ] RelievingLetter
- [ ] WarningLetter
- [ ] PerformanceLetter
- [ ] TransferLetter
- [ ] SeparationLetter
- [ ] InterviewCallLetter
- [ ] ExperienceLetter
- [ ] JoiningLetter
- [ ] LeaveApprovalLetter
- [ ] AppointmentLetter
- [ ] OfferLetter (complex - has salary table)
