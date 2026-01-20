
import React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
        }
    }
}
