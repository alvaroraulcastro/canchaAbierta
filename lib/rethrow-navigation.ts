import { isRedirectError } from "next/dist/client/components/redirect-error";

export function rethrowNavigationError(error: unknown): void {
  if (isRedirectError(error)) {
    throw error;
  }
}
