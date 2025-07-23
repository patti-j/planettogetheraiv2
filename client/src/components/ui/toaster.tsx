import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Copy } from "lucide-react"
import { useState } from "react"

export function Toaster() {
  const { toasts } = useToast()
  const [copiedToastId, setCopiedToastId] = useState<string | null>(null)

  const copyErrorMessage = async (toastId: string, title?: string, description?: string) => {
    const message = [title, description].filter(Boolean).join(': ')
    try {
      await navigator.clipboard.writeText(message)
      setCopiedToastId(toastId)
      setTimeout(() => setCopiedToastId(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy error message:', err)
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {variant === 'destructive' && (
                <button
                  onClick={() => copyErrorMessage(id, title?.toString(), description?.toString())}
                  className="rounded-md p-1 text-destructive-foreground/70 hover:text-destructive-foreground transition-colors"
                  title="Copy error message"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
              {action}
              <ToastClose />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
