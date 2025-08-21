import { MRRFlowTracker } from './index.js';

// Browser initialization
(() => {
  'use strict';

  // Get account ID from script tag
  const script = document.currentScript as HTMLScriptElement || 
                 document.querySelector('script[data-account-id]') as HTMLScriptElement;
  
  const accountId = script?.getAttribute('data-account-id');
  
  if (!accountId) {
    console.warn('MRRFlow: No account ID found. Add data-account-id to script tag.');
    return;
  }

  // Initialize tracker
  const tracker = new MRRFlowTracker(accountId);
  
  // Expose global API
  (window as any).mrrflow = tracker;
})();