// Turns an axios error into a sentence a person can act on.
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err?.response) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}
