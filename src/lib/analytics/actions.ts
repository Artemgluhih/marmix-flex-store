import { trackMetrikaActionGoal } from "./metrika";

// A fresh link instance represents a fresh, deliberate move from a ready cart.
// The synchronous guard closes the rapid double-click window before navigation.
export function createBeginCheckoutAction(track: () => boolean = () => trackMetrikaActionGoal("begin_checkout")) {
  let sent = false;
  return () => {
    if (sent) return false;
    sent = true;
    return track();
  };
}

// The permanent checkout form is still disabled pending legal approval. This
// client-side boundary is ready for the later, approved submit flow to call
// only after HTTP success with { submitted: true }; it never stores or sends keys.
export function createOrderSubmitGoalTracker(track: () => boolean = () => trackMetrikaActionGoal("order_submit")) {
  const observedKeys = new Set<string>();
  return (key: string, status: number, body: unknown): boolean => {
    if (typeof key !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key) ||
      !Number.isInteger(status) || status < 200 || status >= 300 ||
      !body || typeof body !== "object" || !("submitted" in body) || body.submitted !== true) return false;
    const normalizedKey = key.toLowerCase();
    if (observedKeys.has(normalizedKey)) return false;
    if (!track()) return false;
    observedKeys.add(normalizedKey);
    return true;
  };
}

export const trackSuccessfulOrderSubmission = createOrderSubmitGoalTracker();
