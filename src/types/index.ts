export interface TrackerConfig {
  endpoint?: string;
  sessionDuration?: number;
  batchSize?: number;
  batchTimeout?: number;
  debug?: boolean;
  autoTrack?: boolean;
}

export interface EventProperties {
  [key: string]: any;
}

export interface TrackingEvent {
  account_id: string;
  session_id: string;
  event_type: string;
  email_hash?: string;
  properties: {
    url: string;
    title: string;
    timestamp: number;
    user_agent: string;
    screen_width: number;
    screen_height: number;
    [key: string]: any;
  };
}

export interface ReferrerInfo {
  type: 'direct' | 'internal' | 'search' | 'referral';
  engine?: string;
  domain?: string;
  url?: string;
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface MRRFlowAPI {
  /**
   * Track a custom event
   */
  track(eventType: string, properties?: EventProperties): void;
  
  /**
   * Identify a user by email
   */
  identify(email: string): void;
  
  /**
   * Manually flush queued events
   */
  flush(): void;
  
  /**
   * Enable/disable debug mode
   */
  debug(enabled: boolean): void;
  
  /**
   * Get current session ID
   */
  getSessionId(): string;
  
  /**
   * Update configuration
   */
  config(options: Partial<TrackerConfig>): void;
}

declare global {
  interface Window {
    mrrflow: MRRFlowAPI;
  }
}