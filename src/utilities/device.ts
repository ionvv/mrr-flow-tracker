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
  if (/android/i.test(ua)) os = 'android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';
  else if (/mac os/i.test(ua)) os = 'macos';
  else if (/windows/i.test(ua)) os = 'windows';
  else if (/linux/i.test(ua)) os = 'linux';

  // Browser Detection (Chrome check needs to be more specific)
  let browser = 'unknown';
  if (/edg/i.test(ua)) browser = 'edge';
  else if (/chrome/i.test(ua)) browser = 'chrome';
  else if (/firefox/i.test(ua)) browser = 'firefox';
  else if (/safari/i.test(ua)) browser = 'safari';

  // Device Type Detection
  let device_type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/ipad|tablet/i.test(ua)) device_type = 'tablet';
  else if (/mobile|android|iphone/i.test(ua)) device_type = 'mobile';

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

function calculateBotProbability() {
  let probability = 0;
  const ua = navigator.userAgent;
  
  // INSTANT BOT FLAGS (100% probability)
  // Empty user agent
  if (!ua || ua.length === 0) {
    return 1.0;
  }
  
  // Known bot patterns in user agent
  if (BOT_PATTERNS.some(pattern => pattern.test(ua))) {
    return 1.0;
  }
  
  // CRITICAL FLAGS (high weight)
  // Viewport larger than screen - physically impossible
  if (window.innerWidth > screen.width || window.innerHeight > screen.height) {
    probability += 0.50;
  }
  
  // Webdriver flag - explicit automation
  if (navigator.webdriver === true) {
    probability += 0.45;
  }
  
  // Missing core browser features (from your existing code)
  try {
    const hasCoreFeatures = (
      'cookieEnabled' in navigator &&
      'hardwareConcurrency' in navigator &&
      'maxTouchPoints' in navigator &&
      !!window.WebGLRenderingContext
    );
    
    if (!hasCoreFeatures) {
      probability += 0.40;
    }
  } catch {
    probability += 0.40; // Error checking features = likely bot
  }
  
  // HIGH CONFIDENCE FLAGS (medium weight)
  // Timezone is exactly "UTC"
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'UTC') {
      probability += 0.20;
    }
  } catch {
    probability += 0.15; // Can't get timezone = suspicious
  }
  
  // Chrome user agent but missing chrome object
  if (!window.chrome && /Chrome/.test(ua)) {
    probability += 0.25;
  }
  
  // Desktop with no plugins (headless)
  if (navigator.plugins && navigator.plugins.length === 0 && 
      !/Mobile|Android|iPhone/.test(ua)) {
    probability += 0.20;
  }
  
  // MEDIUM CONFIDENCE FLAGS (low weight)
  // Common bot screen dimensions
  const botScreens = ['800x600', '1024x768', '1280x720', '1920x1080'];
  const screenSize = `${screen.width}x${screen.height}`;
  if (botScreens.includes(screenSize)) {
    probability += 0.10;
  }
  
  // Single language (en-US only)
  if (navigator.languages && navigator.languages.length === 1) {
    probability += 0.08;
  }
  
  // Missing permissions API
  if (!navigator.permissions) {
    probability += 0.07;
  }
  
  // Missing connection API on non-mobile
  if (!navigator.connection && !navigator.mozConnection && !navigator.webkitConnection && 
      !/Mobile/.test(ua)) {
    probability += 0.07;
  }
  
  // Mobile UA but no battery API
  if (ua.match(/Mobile|Android|iPhone/) && !navigator.getBattery) {
    probability += 0.08;
  }
  
  // Missing cookieEnabled
  if (!('cookieEnabled' in navigator)) {
    probability += 0.08;
  }
  
  // Cap at 1.0 (100%)
  return Math.min(probability, 1.0);
}

export function isBot(userAgent: string): boolean {
  const probability = calculateBotProbability();

  return probability >= 0.60;
}