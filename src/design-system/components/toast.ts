import { toast as sonnerToast } from "sonner";

/**
 * Toast helpers — thin wrappers over `sonner`, whose `<Toaster />` is already
 * mounted in the root layout and themed with the brand popover tokens. These
 * give callers a small, intention-revealing API.
 */
export const toast = {
  success: (message: string, description?: string) => sonnerToast.success(message, { description }),
  error: (message: string, description?: string) => sonnerToast.error(message, { description }),
  warning: (message: string, description?: string) => sonnerToast.warning(message, { description }),
  info: (message: string, description?: string) => sonnerToast.info(message, { description }),
  message: (message: string, description?: string) => sonnerToast(message, { description }),
  /** Drive a toast through a promise lifecycle (loading → success/error). */
  promise: <T>(promise: Promise<T>, msgs: { loading: string; success: string; error: string }) =>
    sonnerToast.promise(promise, msgs),
};
