import { ReferrerInfo } from "../types";

export function getReferrerInfo(): ReferrerInfo {
  const referrer = document.referrer;
  if (!referrer) return { type: 'direct' };

  const currentDomain = window.location.hostname;
  const referrerDomain = new URL(referrer).hostname;

  if (referrerDomain === currentDomain) {
    return { type: 'internal', url: referrer };
  }

  // Check for social media platforms
  const socialPlatforms: Record<string, string> = {
    'facebook.com': 'facebook',
    'fb.com': 'facebook',
    'instagram.com': 'instagram',
    'twitter.com': 'twitter',
    'x.com': 'twitter',
    'linkedin.com': 'linkedin',
    'tiktok.com': 'tiktok',
    'youtube.com': 'youtube',
    'youtu.be': 'youtube',
    'pinterest.com': 'pinterest',
    'snapchat.com': 'snapchat',
    'reddit.com': 'reddit',
    'discord.com': 'discord',
    'telegram.org': 'telegram',
    'whatsapp.com': 'whatsapp'
  };

  for (const [domain, platform] of Object.entries(socialPlatforms)) {
    if (referrerDomain.includes(domain)) {
      const medium = detectSocialMedium(referrer, platform);
      return { 
        type: 'social', 
        platform, 
        medium,
        url: referrer 
      };
    }
  }

  // Check for search engines
  const searchEngines: Record<string, string> = {
    'google.com': 'google',
    'bing.com': 'bing',
    'duckduckgo.com': 'duckduckgo',
    'yahoo.com': 'yahoo',
    'baidu.com': 'baidu',
    'yandex.com': 'yandex'
  };

  for (const [domain, engine] of Object.entries(searchEngines)) {
    if (referrerDomain.includes(domain)) {
      const medium = detectSearchMedium(referrer);
      return { 
        type: 'search', 
        engine, 
        medium,
        url: referrer 
      };
    }
  }

  // Check for email clients
  const emailClients = [
    'mail.google.com',
    'outlook.live.com',
    'mail.yahoo.com',
    'mail.aol.com',
    'webmail.',
    'email.'
  ];

  if (emailClients.some(client => referrerDomain.includes(client))) {
    return { 
      type: 'email', 
      medium: 'email',
      domain: referrerDomain,
      url: referrer 
    };
  }

  return { type: 'referral', domain: referrerDomain, url: referrer };
}
  
export function detectSocialMedium(referrer: string, platform: string): 'organic' | 'cpc' {
  // Check UTM parameters
  const urlParams = new URLSearchParams(window.location.search);
  const utmMedium = urlParams.get('utm_medium');
  const utmSource = urlParams.get('utm_source');
  
  if (utmMedium === 'cpc' || utmMedium === 'paid-social' || 
      utmSource?.includes('ads')) {
    return 'cpc';
  }

  // Platform-specific paid traffic patterns
  const paidPatterns: Record<string, string[]> = {
    'facebook': ['facebook.com/tr/', 'l.facebook.com/l.php'],
    'instagram': ['l.instagram.com'],
    'twitter': ['t.co/'],
    'linkedin': ['lnkd.in/'],
    'tiktok': ['tiktok.com/t/'],
    'youtube': ['youtube.com/redirect']
  };

  const patterns = paidPatterns[platform] || [];
  const isPaid = patterns.some(pattern => referrer.includes(pattern));
  
  return isPaid ? 'cpc' : 'organic';
}

export function detectSearchMedium(referrer: string): 'organic' | 'cpc' {
  const urlParams = new URLSearchParams(window.location.search);
  const utmMedium = urlParams.get('utm_medium');
  const utmSource = urlParams.get('utm_source');
  
  // Check for Google Ads click ID
  const gclid = urlParams.get('gclid');
  if (gclid) {
    return 'cpc';
  }
  
  // Check for other Google Ads parameters
  const gadSource = urlParams.get('gad_source');
  const gadCampaignId = urlParams.get('gad_campaignid');
  if (gadSource || gadCampaignId) {
    return 'cpc';
  }
  
  if (utmMedium === 'cpc' || utmSource?.includes('ads')) {
    return 'cpc';
  }

  // Referrer-based patterns (less reliable for Google Ads)
  const paidPatterns = [
    'googleadservices.com',
    'doubleclick.net',
    '/aclk?',
    'bing.com/aclick',
    'ads.yahoo.com'
  ];

  const isPaid = paidPatterns.some(pattern => referrer.includes(pattern));
  return isPaid ? 'cpc' : 'organic';
}