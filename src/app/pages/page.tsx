import Link from "next/link"

export default function PagesIndexPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">HRMS Department Portals</h1>
      <p className="text-muted-foreground mb-8">Select your department to access the portal:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link 
          href="/pages/admin" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Admin Portal</h2>
          <p className="text-sm text-muted-foreground">System administration and user management</p>
        </Link>
        
        <Link 
          href="/pages/user" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">User Portal</h2>
          <p className="text-sm text-muted-foreground">Employee self-service and personal tools</p>
        </Link>
        
        <Link 
          href="/pages/hr" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">HR Portal</h2>
          <p className="text-sm text-muted-foreground">Human resources management</p>
        </Link>
        
        <Link 
          href="/pages/quality" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Quality Portal</h2>
          <p className="text-sm text-muted-foreground">Quality assurance and control</p>
        </Link>
        
        <Link 
          href="/pages/csm" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">CSM Portal</h2>
          <p className="text-sm text-muted-foreground">Customer Success Management</p>
        </Link>
        
        <Link 
          href="/pages/sales" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Sales Portal</h2>
          <p className="text-sm text-muted-foreground">Sales management and CRM</p>
        </Link>
        
        <Link 
          href="/pages/marketing" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Marketing Portal</h2>
          <p className="text-sm text-muted-foreground">Marketing campaigns and analytics</p>
        </Link>
        
        <Link 
          href="/pages/it" 
          className="p-6 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">IT Portal</h2>
          <p className="text-sm text-muted-foreground">IT infrastructure and support</p>
        </Link>
      </div>
    </div>
  )
}
