import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { Copy, Clock, Clock3, X } from "lucide-react"
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
            <div className="grid gap-1 flex-1 pr-4">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {/* Top right icon row */}
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <button
                onClick={() => toggleAutoClose(id)}
                className={`rounded-md p-1.5 transition-colors ${
                  autoClose ? "text-blue-500 hover:text-blue-600" : "text-gray-400 hover:text-gray-500"
                }`}
                title={autoClose ? "Auto-close enabled (click to disable)" : "Auto-close disabled (click to enable)"}
              >
                {autoClose ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Clock3 className="h-4 w-4 opacity-50" />
                )}
              </button>
              <button
                onClick={() => copyToastMessage(id, title?.toString(), description?.toString())}
                className={`rounded-md p-1.5 transition-colors ${
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
              <ToastPrimitives.Close
                className="rounded-md p-1.5 text-foreground/50 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
              >
                <X className="h-4 w-4" />
              </ToastPrimitives.Close>
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
