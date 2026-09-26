// Remembers the student's active ticket(s) on this device/browser so the
// kiosk can offer to resume them if the tab is closed and reopened.
// A student can have more than one active ticket at once (e.g. Registrar
// and Cashier the same day), so this stores a small array, not a single id.

const KEY = 'cvsu_my_tickets';

export function getSavedTickets() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSavedTicket(ticket) {
  try {
    const tickets = getSavedTickets().filter((t) => t.id !== ticket.id);
    tickets.unshift(ticket); // newest first
    localStorage.setItem(KEY, JSON.stringify(tickets.slice(0, 10))); // cap it, just in case
  } catch {
    /* localStorage unavailable (private browsing, etc.) - degrade silently */
  }
}

export function removeSavedTicket(id) {
  try {
    const tickets = getSavedTickets().filter((t) => t.id !== id);
    localStorage.setItem(KEY, JSON.stringify(tickets));
  } catch {
    /* no-op */
  }
}
