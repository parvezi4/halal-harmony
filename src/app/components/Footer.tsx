import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Halal Harmony. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-slate-200">
            About
          </Link>
          <Link href="/guidelines" className="hover:text-slate-200">
            Islamic guidelines
          </Link>
          <Link href="/faq" className="hover:text-slate-200">
            FAQ
          </Link>
          <Link href="/terms" className="hover:text-slate-200">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-slate-200">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-slate-200">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
