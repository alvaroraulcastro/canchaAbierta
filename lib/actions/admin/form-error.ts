import { redirect } from "next/navigation";

export function redirectAdminFormError(returnPath: string, message: string): never {
  redirect(`${returnPath}?error=${encodeURIComponent(message)}`);
}
