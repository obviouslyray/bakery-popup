export const FLIP_DURATION_MS = 650;
export function getSignState(status = 'closed', hours = '6–11') {
  const safeStatus = ['open', 'closed', 'loading', 'error'].includes(status) ? status : 'error';
  const safeHours = typeof hours === 'string' ? hours.trim() : '';
  const labels = {
    closed: { title: "Sorry, we're closed!", subtitle: 'A little rest. A fresh start.' },
    open: { title: "We're Open!", subtitle: safeHours },
    loading: { title: "Checking today's status", subtitle: 'Just a moment…' },
    error: { title: 'Status unavailable', subtitle: 'Please check again shortly.' }
  };
  return { status: safeStatus, isOpen: safeStatus === 'open', determinate: safeStatus === 'open' || safeStatus === 'closed', ...labels[safeStatus] };
}
