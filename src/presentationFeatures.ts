// Presentation-only switch. Existing generation code and saved artifacts remain intact.
export const SHOW_DELIVERABLE_FEATURES: boolean = false;
export const isRetainedRoute = (path: string) => SHOW_DELIVERABLE_FEATURES || ['/projects', '/project/new', '/project/overview', '/project/result'].includes(path);
