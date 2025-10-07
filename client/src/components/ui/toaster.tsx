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
  const { toasts, toggleAutoClose } = useToast()
  const [copiedToastId, setCopiedToastId] = useState<string | null>(null)

  const copyToastMessage = async (toastId: string, title?: string, description?: string) => {
    const message = [title, description].filter(Boolean).join(': ')
    try {
      await navigator.clipboard.writeText(message)
      setCopiedToastId(toastId)
      setTimeout(() => setCopiedToastId(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy toast message:', err)
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, autoClose, ...props }) {
        return (
          <Toast 
            key={id} 
            variant={variant} 
            autoClose={autoClose}
            onToggleAutoClose={() => toggleAutoClose(id)}
            {...props}
          >
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => copyToastMessage(id, title?.toString(), description?.toString())}
                className={`rounded-md p-2 transition-colors ${
                  copiedToastId === id
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                    : variant === 'destructive'
                      ? 'text-destructive-foreground/70 hover:text-destructive-foreground'
                      : 'text-foreground/70 hover:text-foreground'
                }`}
                title={copiedToastId === id ? "Copied!" : "Copy full message to clipboard"}
              >
                <Copy className="h-4 w-4" />
              </button>
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
