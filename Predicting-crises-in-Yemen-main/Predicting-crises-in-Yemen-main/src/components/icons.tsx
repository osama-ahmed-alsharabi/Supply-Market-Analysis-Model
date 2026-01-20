import * as React from 'react';

export const AppLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M2 12h3" />
        <path d="M19 12h3" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M12 8a4 4 0 1 0 4 4" />
        <path d="M12 12a4 4 0 0 0-4-4" />
        <path d="M12 12a4 4 0 1 1 4-4" />
        <path d="M12 16a4 4 0 0 1-4-4" />
    </svg>
);
