import { MRRFlowTracker } from './index.js';

// Browser initialization
(() => {
  'use strict';

  const GLOBAL_NAME = 'mrrflow';
  const INIT_LOCK = '__mrrflowInitLock';
  const INIT_PROMISE = '__mrrflowInitPromise';
  
  const win = window as any;

  // Return existing instance
  if (win[GLOBAL_NAME]) {
    return;
  }

  // Return existing initialization promise
  if (win[INIT_PROMISE]) {
    return;
  }

  // Create initialization promise
  win[INIT_PROMISE] = new Promise((resolve, reject) => {
    try {
      // Double-check after promise creation (race condition protection)
      if (win[GLOBAL_NAME]) {
        resolve(win[GLOBAL_NAME]);
        return;
      }

      const script = document.currentScript as HTMLScriptElement || 
                     document.querySelector('script[data-account-id]') as HTMLScriptElement;
      
      const accountId = script?.getAttribute('data-account-id');
      
      if (!accountId) {
        reject(new Error('MRRFlow: No account ID found'));
        return;
      }

      // Initialize tracker
      const tracker = new MRRFlowTracker(accountId);
      
      // Expose global API
      win[GLOBAL_NAME] = tracker;
      
      // Resolve with tracker instance
      resolve(tracker);
      
    } catch (error) {
      reject(error);
    }
  }).finally(() => {
    // Clean up init promise after completion
    delete win[INIT_PROMISE];
  });
})();