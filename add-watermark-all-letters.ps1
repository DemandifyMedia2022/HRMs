# PowerShell script to add watermark and logo to all letter pages

$letterPages = @(
    "experience-letter",
    "interview-call-letter",
    "performance-letter",
    "promotion-letter",
    "reference-letter",
    "relieving-letter",
    "resignation-letter",
    "salary-increment-letter",
    "separation-letter",
    "transfer-letter",
    "warning-letter",
    "leave-approval-letter"
)

$logoHeader = @'
        <div style="position: absolute; top: 0; right: 0; z-index: 10;">
          <img src="/Demandify1.png" alt="Demandify Logo" style="width: 120px; height: auto;" />
        </div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; z-index: 0; pointer-events: none;">
          <img src="/demandify.png" alt="Watermark" style="width: 400px; height: auto;" />
        </div>
        <div style="position: relative; z-index: 1;">
'@

foreach ($letter in $letterPages) {
    $filePath = "src\app\pages\hr\letter-generation\$letter\page.tsx"
    
    Write-Host "Processing $letter..." -ForegroundColor Cyan
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Check if already has watermark
        if ($content -notmatch 'demandify.png') {
            Write-Host "  Adding watermark and logo..." -ForegroundColor Yellow
            
            # Pattern 1: Replace simple div opening
            $pattern1 = '<div style="line-height:'
            if ($content -match [regex]::Escape($pattern1)) {
                $content = $content -replace '<div style="line-height:', '<div style="position: relative; line-height:'
                
                # Find first paragraph or heading after the opening div and insert logo/watermark before it
                $content = $content -replace '(<div style="position: relative; line-height:[^>]+>)\s*(<[ph])', "`$1`n$logoHeader`n`$2"
                
                # Close the inner div before the closing main div
                $content = $content -replace '(</div>\s*`\s*)$', "        </div>`n`$1"
            }
            
            # Pattern 2: Replace h3 or h2 at start
            $pattern2 = '<h[23] style="text-align: center;'
            if ($content -match $pattern2) {
                $content = $content -replace '(<div[^>]+>)\s*(<h[23])', "`$1`n$logoHeader`n`$2"
            }
            
            Set-Content -Path $filePath -Value $content -NoNewline
            Write-Host "  ✓ Updated $letter" -ForegroundColor Green
        } else {
            Write-Host "  ○ Skipped $letter (already has watermark)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host "`n✓ All letters processed!" -ForegroundColor Green
Write-Host "Note: Hari Offer Letter uses different branding (harilogo.png and hari.png)" -ForegroundColor Cyan
