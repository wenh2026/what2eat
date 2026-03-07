const getRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const logEvent = (eventName, payload = {}) => {
  console.info('[app-event]', {
    event_name: eventName,
    request_id: payload.request_id || getRequestId(),
    ts: new Date().toISOString(),
    ...payload,
  });
};

export const logError = (eventName, error, payload = {}) => {
  console.error('[app-error]', {
    event_name: eventName,
    request_id: payload.request_id || getRequestId(),
    ts: new Date().toISOString(),
    error_code: payload.error_code || error?.code || 'UNKNOWN_ERROR',
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    ...payload,
  });
};
