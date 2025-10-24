# PowerShell script to update all letter pages with PDF functionality

$letterPages = @(
    "appointment-letter",
    "experience-letter",
    "interview-call-letter",
    "joining-letter",
    "performance-letter",
    "promotion-letter",
    "reference-letter",
    "relieving-letter",
    "resignation-letter",
    "salary-increment-letter",
    "separation-letter",
    "transfer-letter",
    "warning-letter"
)

foreach ($letter in $letterPages) {
    $filePath = "src\app\pages\hr\letter-generation\$letter\page.tsx"
    
    Write-Host "Updating $letter..." -ForegroundColor Cyan
    
    # Check if file exists
    if (Test-Path $filePath) {
        # Read file content
        $content = Get-Content $filePath -Raw
        
        # Check if already has PDF import
        if ($content -notmatch 'generatePDF') {
            # Add import if not present
            if ($content -match 'import Link from "next/link"') {
                $content = $content -replace 'import Link from "next/link"', 'import Link from "next/link"`nimport { generatePDF } from "@/lib/pdf-utils"'
            }
            
            # Replace downloadPDF function
            $content = $content -replace '(?s)const downloadPDF = \(\) => \{[^}]+\}', @'
const downloadPDF = async () => {
    if (!letterRef.current || !generatedLetter) {
      alert("Please generate the letter first before downloading")
      return
    }

    try {
      const fileName = `LETTER_NAME.pdf`
      await generatePDF(letterRef.current, fileName)
    } catch (error) {
      alert('Failed to generate PDF. Please try again.')
    }
  }
'@
            
            # Write back to file
            Set-Content -Path $filePath -Value $content
            Write-Host "✓ Updated $letter" -ForegroundColor Green
        } else {
            Write-Host "○ Skipped $letter (already updated)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "`nAll letters processed!" -ForegroundColor Green
