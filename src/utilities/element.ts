const TRACKED_DATA_ATTRS = [
  'data-goal',
  'data-event', 
  'data-category',
  'data-value',
  'data-label',
  'data-campaign',
  'data-source'
];

export function getDataAttributes(element: HTMLElement) {
  const dataProps: Record<string, string> = {};
  
  TRACKED_DATA_ATTRS.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value) {
      // Convert data-goal to goal, data-event to event, etc.
      const key = attr.replace('data-', '');
      dataProps[key] = value;
    }
  });
  
  return dataProps;
}