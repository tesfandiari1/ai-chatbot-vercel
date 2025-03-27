'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export function CalendarStyleLoader() {
  useEffect(() => {
    // Ensure styles are applied after component mounts
    const style = document.createElement('style');
    style.textContent = `
      .calendar-wrapper .grid button[data-state="active"] {
        background-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
      }
      
      .calendar-wrapper .grid button {
        transition: all 0.15s ease;
      }
      
      .calendar-wrapper .grid button:not([disabled]):hover {
        transform: scale(1.05);
        z-index: 2;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Script
      id="calendar-fix"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Fix for dark mode and stacked elements
            const style = document.createElement('style');
            style.textContent = \`
              .calendar-wrapper .grid button {
                position: relative;
                z-index: 1;
              }
            \`;
            document.head.appendChild(style);
          })();
        `,
      }}
    />
  );
}
