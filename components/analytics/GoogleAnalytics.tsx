'use client';

import Script from 'next/script';

// Validation patterns to prevent XSS in inline scripts
const GA_ID_PATTERN = /^G-[A-Z0-9]{10,12}$/;
const CLARITY_ID_PATTERN = /^[a-z0-9]{10,12}$/i;

function isValidGAId(id: string): boolean {
  return GA_ID_PATTERN.test(id);
}

function isValidClarityId(id: string): boolean {
  return CLARITY_ID_PATTERN.test(id);
}

interface GoogleAnalyticsProps {
  GA_MEASUREMENT_ID?: string;
}

export function GoogleAnalytics({ GA_MEASUREMENT_ID }: GoogleAnalyticsProps) {
  // Only load if GA ID is provided and valid (XSS prevention)
  if (!GA_MEASUREMENT_ID || !isValidGAId(GA_MEASUREMENT_ID)) {
    if (GA_MEASUREMENT_ID && !isValidGAId(GA_MEASUREMENT_ID)) {
      console.warn('[GoogleAnalytics] Invalid GA_MEASUREMENT_ID format');
    }
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
}

export function MSClarity({ CLARITY_PROJECT_ID }: { CLARITY_PROJECT_ID?: string }) {
  // Only load if Clarity ID is provided and valid (XSS prevention)
  if (!CLARITY_PROJECT_ID || !isValidClarityId(CLARITY_PROJECT_ID)) {
    if (CLARITY_PROJECT_ID && !isValidClarityId(CLARITY_PROJECT_ID)) {
      console.warn('[MSClarity] Invalid CLARITY_PROJECT_ID format');
    }
    return null;
  }

  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `,
      }}
    />
  );
}
