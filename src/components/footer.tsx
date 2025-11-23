
import Link from 'next/link';
import { PuddleLogo } from '@/components/icons';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <PuddleLogo className="h-5 w-5 text-primary-foreground" />
            <p className="text-sm text-primary-foreground/80">&copy; {new Date().getFullYear()} Puddle USM. All rights reserved.</p>
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0 text-sm text-primary-foreground/80">
            <Link href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
