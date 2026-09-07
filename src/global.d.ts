/// <reference types="vite/client" />

import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { icon: string; width?: string; height?: string };
    }
  }
}

