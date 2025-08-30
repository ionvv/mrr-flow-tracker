export interface DeviceInfo {
  os: string;
  browser: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  timezone: string;
  language: string;
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  // OS Detection
  let os = 'unknown';
  if (ua.includes('Windows')) os = 'windows';
  else if (ua.includes('Mac OS')) os = 'macos';
  else if (ua.includes('Linux')) os = 'linux';
  else if (ua.includes('Android')) os = 'android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'ios';

  // Browser Detection
  let browser = 'unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'safari';
  else if (ua.includes('Firefox')) browser = 'firefox';
  else if (ua.includes('Edg')) browser = 'edge';

  // Device Type Detection
  let device_type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/Mobile|Android|iPhone/.test(ua)) device_type = 'mobile';
  else if (/iPad|Tablet/.test(ua)) device_type = 'tablet';

  return {
    os,
    browser,
    device_type,
    screen_width: screen.width,
    screen_height: screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /facebookexternalhit/i,
  /WhatsApp/i,
  /Slack/i,
  /TwitterBot/i,
  /LinkedInBot/i,
  /GoogleBot/i,
  /BingBot/i,
  /YandexBot/i,
  /Applebot/i,
  /Semrush/i,
  /AhrefsBot/i,
  /DataForSeo/i,
  /Chrome-Lighthouse/i,
  /HeadlessChrome/i,
  /PhantomJS/i,
  /Puppeteer/i,
  /Playwright/i
];

export function isBot(userAgent: string): boolean {
  if (!userAgent) return true;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}