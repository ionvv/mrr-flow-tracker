import { ReferrerInfo } from "../types";

export function getReferrerInfo(): ReferrerInfo {
  const referrer = document.referrer;
  if (!referrer) return { type: 'direct' };

  const currentDomain = window.location.hostname;
  const referrerDomain = new URL(referrer).hostname;

  if (referrerDomain === currentDomain) {
    return { type: 'internal', url: referrer };
  }

  // Common search engines
  const searchEngines: Record<string, string> = {
    'google.com': 'google',
    'bing.com': 'bing',
    'duckduckgo.com': 'duckduckgo',
    'yahoo.com': 'yahoo',
  };

  for (const [domain, engine] of Object.entries(searchEngines)) {
    if (referrerDomain.includes(domain)) {
      const medium = this.detectSearchMedium(referrer);
      return { 
        type: 'search', 
        engine, 
        medium,
        url: referrer 
      };
    }
  }

  return { type: 'referral', domain: referrerDomain, url: referrer };
}
  
export function detectSearchMedium(referrer: string): 'organic' | 'cpc' {
  // Check UTM parameters first (most reliable)
  const urlParams = new URLSearchParams(window.location.search);
  const utmMedium = urlParams.get('utm_medium');
  const utmSource = urlParams.get('utm_source');
  
  if (utmMedium === 'cpc' || utmSource?.includes('ads')) {
    return 'cpc';
  }

  // Check referrer patterns for paid traffic
  const paidPatterns = [
    'googleadservices.com',
    'doubleclick.net',
    '/aclk?',           // Google Ads click identifier
    'bing.com/aclick',  // Bing Ads click
    'ads.yahoo.com'     // Yahoo Ads
  ];

  const isPaid = paidPatterns.some(pattern => referrer.includes(pattern));
  return isPaid ? 'cpc' : 'organic';
}