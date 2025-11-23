import type { SVGProps } from 'react';

export function PuddleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a7 7 0 0 0-7 7c0 3.08 1.88 6.26 7 11.42 5.12-5.16 7-8.34 7-11.42A7 7 0 0 0 12 2Z" />
    </svg>
  );
}
