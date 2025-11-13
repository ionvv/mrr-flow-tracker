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

export function getDataGoalAttributes(element: HTMLElement) {
  const dataProps: Record<string, string> = {};
  
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith('data-goal')) {
      dataProps[attr.name] = attr.value;
    }
  }
  
  return dataProps;
}