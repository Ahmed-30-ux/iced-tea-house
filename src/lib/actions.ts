export type ActionResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult {
  return { ok: false, error };
}

export function handleActionError(e: unknown): ActionResult {
  if (e instanceof Error) {
    if (e.message === "Unauthorized") return fail("You are not signed in.");
    return fail(e.message);
  }
  return fail("Something went wrong. Please try again.");
}