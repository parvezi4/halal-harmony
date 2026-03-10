import type { ReactNode } from 'react';

/* Admin login layout - no auth checks, allows unauthenticated access */
export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
