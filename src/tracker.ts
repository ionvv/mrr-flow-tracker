import type { 
  TrackerConfig, 
  TrackingEvent, 
  EventProperties, 
  ReferrerInfo, 
  UTMParams,
  MRRFlowAPI 
} from './types';

export class MRRFlowTracker implements MRRFlowAPI {
  private _config: Required<TrackerConfig>;
  
  private accountId: string;
  private sessionId: string;
  private eventQueue: TrackingEvent[] = [];
  private batchTimer: number | null = null;

  constructor(accountId: string, config: TrackerConfig = {}) {
    this.accountId = accountId;
    this._config = {
      endpoint: 'https://api.mrrflow.io/e',
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      batchSize: 10,
      batchTimeout: 5000,
      debug: false,
      autoTrack: true,
      ...config,
    };

    this.sessionId = this.getSessionId();
    
    if (this._config.autoTrack) {
      this.initAutoTracking();
    }
  }

  private initAutoTracking(): void {
    // Track initial pageview
    this.trackPageview();

    // Set up event listeners
    document.addEventListener('click', this.handleClick.bind(this), { 
      capture: true, 
      passive: true 
    });
    
    document.addEventListener('submit', this.handleFormSubmit.bind(this), { 
      passive: true 
    });

    // Flush events before page unload
    window.addEventListener('beforeunload', this.flush.bind(this));
    window.addEventListener('pagehide', this.flush.bind(this));

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    if (this._config.debug) {
      console.log('MRRFlow tracker initialized for account:', this.accountId);
    }
  }

  getSessionId(): string {
    const key = '_mrrflow_session';
    const stored = sessionStorage.getItem(key);
    const now = Date.now();
    
    if (stored) {
      const [id, timestamp] = stored.split('|');
      if (now - parseInt(timestamp) < this._config.sessionDuration) {
        sessionStorage.setItem(key, `${id}|${now}`);
        return id;
      }
    }
    
    const newId = this.generateId();
    sessionStorage.setItem(key, `${newId}|${now}`);
    return newId;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async getEmailHash(): Promise<string | null> {
    // Look for email in common form fields
    const emailInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="email"], input[name*="email"]'
    );
    
    for (const input of Array.from(emailInputs)) {
      if (input.value && this.isValidEmail(input.value)) {
        return this.hashEmail(input.value);
      }
    }

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam && this.isValidEmail(emailParam)) {
      return this.hashEmail(emailParam);
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async hashEmail(email: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase() + this.accountId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getUTMParams(): UTMParams | null {
    const params = new URLSearchParams(window.location.search);
    const utm: UTMParams = {};
    
    (['source', 'medium', 'campaign', 'term', 'content'] as const).forEach(param => {
      const value = params.get(`utm_${param}`);
      if (value) utm[param] = value;
    });

    return Object.keys(utm).length > 0 ? utm : null;
  }

  private getReferrerInfo(): ReferrerInfo {
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
        return { type: 'search', engine, url: referrer };
      }
    }

    return { type: 'referral', domain: referrerDomain, url: referrer };
  }

  private createEvent(type: string, properties: EventProperties = {}): TrackingEvent {
    return {
      account_id: this.accountId,
      session_id: this.sessionId,
      event_type: type,
      properties: {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        screen_width: screen.width,
        screen_height: screen.height,
        ...properties,
      },
    };
  }

  private async queueEvent(event: TrackingEvent): Promise<void> {
    // Add email hash if available
    const hash = await this.getEmailHash();
    if (hash) {
      event.email_hash = hash;
    }
    
    this.eventQueue.push(event);
    
    if (this._config.debug) {
      console.log('MRRFlow event queued:', event);
    }

    if (this.eventQueue.length >= this._config.batchSize) {
      this.flush();
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => this.flush(), this._config.batchTimeout);
    }
  }

  flush(): void {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.slice();
    this.eventQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.sendEvents(events);
  }

  private sendEvents(events: TrackingEvent[]): void {
    const payload = JSON.stringify(events);
    
    // Use sendBeacon if available (more reliable for page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(this._config.endpoint, blob)) {
        return;
      }
    }

    // Fallback to fetch
    fetch(this._config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(err => {
      if (this._config.debug) {
        console.warn('MRRFlow: Failed to send events', err);
      }
    });
  }

  private trackPageview(): void {
    const properties = {
      referrer: this.getReferrerInfo(),
      utm: this.getUTMParams(),
    };

    this.queueEvent(this.createEvent('pageview', properties));
  }

  private handleClick(event: Event): void {
    const element = event.target as HTMLElement;
    const properties: EventProperties = {
      tag_name: element.tagName.toLowerCase(),
      text: element.textContent?.trim().substring(0, 100),
      class_name: element.className,
      id: element.id,
    };

    if (element instanceof HTMLAnchorElement && element.href) {
      properties.href = element.href;
      properties.link_type = element.href.startsWith('mailto:') ? 'email' : 
                            element.href.startsWith('tel:') ? 'phone' : 'external';
    }

    if (element instanceof HTMLButtonElement || 
        (element instanceof HTMLInputElement && element.type === 'submit')) {
      properties.button_type = element.type || 'button';
    }

    this.queueEvent(this.createEvent('click', properties));
  }

  private handleFormSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    const properties: EventProperties = {
      form_id: form.id,
      form_name: form.name,
      form_action: form.action,
      field_count: form.elements.length,
    };

    this.queueEvent(this.createEvent('form_submit', properties));
  }

  // Public API methods
  track(eventType: string, properties: EventProperties = {}): void {
    this.queueEvent(this.createEvent(eventType, properties));
  }

  identify(email: string): void {
    if (this.isValidEmail(email)) {
      this.hashEmail(email).then(hash => {
        this.queueEvent(this.createEvent('identify', { email_hash: hash }));
      });
    }
  }

  debug(enabled: boolean): void {
    this._config.debug = enabled;
  }

  getConfig(): Required<TrackerConfig> {
    return this._config;
  }

  config(options: Partial<TrackerConfig>): void {
    this._config = { ...this._config, ...options };
  }
}