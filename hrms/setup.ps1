# ESSL Attendance System Setup Script

Write-Host "======================================"
Write-Host "ESSL Attendance System Setup"
Write-Host "======================================"
Write-Host ""

# Step 1: Install axios in hrms directory
Write-Host "Step 1: Installing axios dependency..."
Set-Location hrms
npm install axios

# Step 2: Generate Prisma Client
Write-Host ""
Write-Host "Step 2: Generating Prisma Client..."
Set-Location ..
npx prisma generate

# Step 3: Push database schema
Write-Host ""
Write-Host "Step 3: Creating database tables..."
Write-Host "Make sure your DATABASE_URL is configured in .env file"
$confirm = Read-Host "Do you want to create the database tables now? (y/n)"
if ($confirm -eq 'y') {
    npx prisma db push
}

Write-Host ""
Write-Host "======================================"
Write-Host "Setup Complete!"
Write-Host "======================================"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Configure your .env file with database and ESSL credentials"
Write-Host "2. Run 'cd hrms && npm run dev' to start the development server"
Write-Host "3. Test the API at http://localhost:3000/api/attendance/sync"
Write-Host ""
Write-Host "See SETUP_GUIDE.md for detailed documentation"
