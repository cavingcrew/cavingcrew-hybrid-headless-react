'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TestPage() {
  const router = useRouter();

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
      <h1>Navigation Test Page</h1>
      
      {/* Method 1: useRouter programmatic navigation */}
      <button 
        onClick={() => router.push('/')}
        style={{ padding: '0.5rem', backgroundColor: '#e0f2fe' }}
      >
        Client Nav via useRouter
      </button>

      {/* Method 2: Next.js Link component */}
      <Link
        href="/"
        style={{ padding: '0.5rem', backgroundColor: '#f0fdf4', textDecoration: 'none' }}
      >
        Client Nav via &lt;Link&gt; Component
      </Link>

      {/* Method 3: Regular anchor tag */}
      <a 
        href="/"
        style={{ padding: '0.5rem', backgroundColor: '#fee2e2' }}
      >
        Full Reload via &lt;a&gt; Tag
      </a>
    </div>
  );
}
