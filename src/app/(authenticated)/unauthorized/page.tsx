import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Unauthorized</h1>
      <p className="text-lg mb-8">You do not have permission to view this page.</p>
      {/* <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">
        Go to Dashboard
      </Link> */}
    </div>
  );
}
