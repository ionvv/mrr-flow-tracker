import { URLProperties, UTMParams } from "../types";

export function getUTMParams(url: string): UTMParams {
    const params = new URLSearchParams(url);
    const utm: UTMParams = {};
    
    (['source', 'medium', 'campaign', 'term', 'content'] as const).forEach(param => {
      const value = params.get(`utm_${param}`);
      if (value) utm[param] = value;
    });

    const ref = params.get('ref');
    if (ref) utm['ref'] = ref;

    return utm;
  }

export function sanitizeUrl(url: string): URLProperties {
  try {
    const urlObj = new URL(url);
    // Return only origin + pathname, strip query and hash
    return {
      url: urlObj.origin + urlObj.pathname,
      path: urlObj.pathname,
      params: getUTMParams(url),
      hash: urlObj.hash
    };
  } catch (e) {
    // Fallback if URL parsing fails
    return {
      url: url.split('?')[0].split('#')[0],
      path: url.split('?')[0].split('#')[0],
      params: getUTMParams(url),
      hash: url.split('?')[0].split('#')[0]
    };
  }
}