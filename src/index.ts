import type { 
  TrackerConfig, 
  TrackingEvent, 
  EventProperties, 
  MRRFlowAPI 
} from './types';
import { getDeviceInfo, type DeviceInfo } from './utilities/device';
import { getReferrerInfo } from './utilities/referrer';
import { isBot } from './utilities/device';
import { getDataAttributes } from './utilities/element';
import { getUTMParams, sanitizeUrl } from './utilities/url';

declare const __VERSION__: string;

export class MRRFlowTracker implements MRRFlowAPI {
  private _config: Required<TrackerConfig>;
  
  private trackerVersion: string;

  private accountId: string;
  private sessionId: string;
  private eventQueue: TrackingEvent[] = [];
  private batchTimer: number | null = null;

  private deviceInfo: DeviceInfo;
  
  public pageStartTime: number;

  constructor(accountId: string, config: TrackerConfig = {}) {
    this.accountId = accountId;
    this.trackerVersion = __VERSION__;

    // Set endpoint as environment variable
    this._config = {
      endpoint: import.meta.env.VITE_MRRFLOW_ENDPOINT || 'http://localhost:8084/e',
      debug: import.meta.env.VITE_MRRFLOW_DEBUG || false,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      batchSize: 1,
      batchTimeout: 5000,
      autoTrack: true,
      ...config,
    };

    // Check for bot-like behavior
    if (navigator.webdriver || !navigator.cookieEnabled || isBot(navigator.userAgent)) {
      return;
    }

    this.sessionId = this.getSessionId();

    this.deviceInfo = getDeviceInfo();
    
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
    window.addEventListener('beforeunload', this.trackPageExit.bind(this));
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

  private createEvent(type: string, properties: EventProperties = {}): TrackingEvent {
    return {
      account_id: this.accountId,
      session_id: this.sessionId,
      event_type: type,
      properties: {
        url: sanitizeUrl(window.location.href),
        title: document.title,
        timestamp: Date.now(),
        device_info: this.deviceInfo,
        mrrflow_version: this.trackerVersion,
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
    
    // Try sendBeacon first (most reliable for page unload)
    if (navigator.sendBeacon) {
      const formData = new FormData();
      formData.append('events', payload);
      
      if (navigator.sendBeacon(this._config.endpoint, formData)) {
        if (this._config.debug) {
          console.log('MRRFlow: Events sent via beacon');
        }
        return;
      }
    }
  
    // Fallback to fetch with keepalive
    fetch(this._config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).then(() => {
      if (this._config.debug) {
        console.log('MRRFlow: Events sent via fetch');
      }
    }).catch(err => {
      if (this._config.debug) {
        console.warn('MRRFlow: Failed to send events', err);
      }
    });
  }

  private trackPageview(): void {
    const properties = {
      referrer: getReferrerInfo(),
      utm: getUTMParams(window.location.href),
    };
    
    this.pageStartTime = Date.now();

    this.queueEvent(this.createEvent('pageview', properties));
  }

  private trackPageExit(): void {
    const duration = this.pageStartTime ? Math.floor((Date.now() - this.pageStartTime) / 1000) : -1; // seconds
    const properties = {
      scroll_depth: Math.round((window.scrollY / document.documentElement.scrollHeight) * 100),
      duration
    };

    this.queueEvent(this.createEvent('page_exit', properties));

    this.flush();
  }

  private handleClick(event: Event): void {
    const element = event.target as HTMLElement;
    const mouseEvent = event as MouseEvent;

    const dataProps = getDataAttributes(element);
    
    const properties: EventProperties = {
      tag_name: element.tagName.toLowerCase(),
      text: element.textContent?.trim().substring(0, 100),
      class_name: element.className,
      id: element.id,
      cursor_x: mouseEvent.clientX,
      cursor_y: mouseEvent.clientY,
      data_props: dataProps,
    };

    if (element instanceof HTMLAnchorElement && element.href) {
      properties.href = element.href;
      const isInternal = element.href.startsWith(window.location.origin);
      properties.link_type = element.href.startsWith('mailto:') ? 'email' : 
                       element.href.startsWith('tel:') ? 'phone' : 
                       isInternal ? 'internal' : 'external';
    } else {
      // Find the closest parent anchor element
      const closestAnchor = element.closest('a');
      if (closestAnchor && closestAnchor.href) {
        properties.href = closestAnchor.href;
        const isInternal = closestAnchor.href.startsWith(window.location.origin);
        properties.link_type = closestAnchor.href.startsWith('mailto:') ? 'email' : 
                       closestAnchor.href.startsWith('tel:') ? 'phone' : 
                       isInternal ? 'internal' : 'external';
      }
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