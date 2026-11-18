// #open/closed - text for the sign depending on if the truck is open
export const FLIP_DURATION_MS = 650; // how long the old flip animation takes
export function getSignState(status = 'closed', hours = '6–11') {
  // anything weird coming in just counts as an error
  const safeStatus = ['open', 'closed', 'loading', 'error'].includes(status) ? status : 'error';
  const safeHours = typeof hours === 'string' ? hours.trim() : '';
  // title + subtitle for each state
  const labels = {
    closed: { title: "Sorry, we're closed!", subtitle: 'A little rest. A fresh start.' },
    open: { title: "We're Open!", subtitle: safeHours },
    loading: { title: "Checking today's status", subtitle: 'Just a moment…' },
    error: { title: 'Status unavailable', subtitle: 'Please check again shortly.' }
  };
  // determinate = we actually know if it's open or closed
  return { status: safeStatus, isOpen: safeStatus === 'open', determinate: safeStatus === 'open' || safeStatus === 'closed', ...labels[safeStatus] };
}
