// Message safe to show users: our API sends friendly text in plain Errors;
// network (TypeError) and Supabase auth errors carry raw library text, so use the fallback.
export function userMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!(err instanceof Error) || err instanceof TypeError || err.name.startsWith("Auth")) return fallback;
  return err.message || fallback;
}
