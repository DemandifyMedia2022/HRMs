export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold mb-2">Access denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to view this page. If you believe this is a mistake,
          please contact your administrator.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Go to home
        </a>
      </div>
    </main>
  );
}