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
  /headless/i,
  /scraper/i,
  /facebookexternalhit/i,
  /whatsapp/i,
  /slack/i,
  /twitterbot/i,
  /linkedinbot/i,
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /applebot/i,
  /semrush/i,
  /ahrefsbot/i,
  /dataforseo/i,
  /chrome-lighthouse/i,
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,

  // AI Bots
  /chatgpt-user/i,        // OpenAI ChatGPT
  /gptbot/i,              // OpenAI GPT crawler
  /claudebot/i,           // Anthropic Claude
  /claude-web/i,          // Anthropic web scraper
  /bard/i,                // Google Bard (legacy)
  /gemini/i,              // Google Gemini
  /perplexitybot/i,       // Perplexity AI
  /cohere-ai/i,           // Cohere
  /anthropic-ai/i,        // Anthropic generic
  /ai2bot/i,              // Allen Institute
  /omgili/i,              // Omgili bot (used by AI training)
  /bytespider/i,          // ByteDance (TikTok) AI crawler
  /meta-externalagent/i,  // Meta AI
  /facebookbot/i,         // Facebook AI crawler
  /diffbot/i,             // Diffbot
  /peer39_crawler/i,      // Peer39 AI
  /youbot/i,              // You.com
];

export function isBot(userAgent: string): boolean {
  if (!userAgent) return true;

  const ua = navigator.userAgent.toLowerCase();
  const isBot = BOT_PATTERNS.some(pattern => pattern.test(ua));

  if (isBot) return true;
  
  try {
    return !(
      'cookieEnabled' in navigator &&
      'hardwareConcurrency' in navigator &&
      'maxTouchPoints' in navigator &&
      !!(window as any).WebGLRenderingContext
    );
  } catch {
    return false;
  }
}