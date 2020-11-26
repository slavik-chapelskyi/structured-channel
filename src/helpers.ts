export function isGlobal(targetOrigin: any): targetOrigin is typeof globalThis {
  return targetOrigin && typeof (targetOrigin as typeof globalThis).MessageChannel === 'function';
}
