import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 15000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  autoClose?: boolean
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, autoClose?: boolean) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  // Only add to remove queue if autoClose is true (default) or undefined
  if (autoClose === false) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        const toast = state.toasts.find(t => t.id === toastId)
        addToRemoveQueue(toastId, toast?.autoClose)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id, toast.autoClose)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ autoClose = true, ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  const toggleAutoClose = () => {
    const currentToast = memoryState.toasts.find(t => t.id === id)
    if (currentToast) {
      const newAutoClose = !currentToast.autoClose
      
      // If turning off autoClose, clear existing timeout first
      if (!newAutoClose) {
        const timeout = toastTimeouts.get(id)
        if (timeout) {
          clearTimeout(timeout)
          toastTimeouts.delete(id)
        }
      }
      
      // Update the toast state
      update({ ...currentToast, autoClose: newAutoClose })
      
      // If turning on autoClose, add to remove queue
      if (newAutoClose) {
        addToRemoveQueue(id, true)
      }
    }
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      autoClose,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Only add to auto-close queue if autoClose is enabled
  if (autoClose) {
    addToRemoveQueue(id, autoClose)
  }

  return {
    id: id,
    dismiss,
    update,
    toggleAutoClose,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  const toggleAutoClose = (toastId: string) => {
    const currentToast = memoryState.toasts.find(t => t.id === toastId)
    if (currentToast) {
      const newAutoClose = !currentToast.autoClose
      
      // If turning off autoClose, clear existing timeout first
      if (!newAutoClose) {
        const timeout = toastTimeouts.get(toastId)
        if (timeout) {
          clearTimeout(timeout)
          toastTimeouts.delete(toastId)
        }
      }
      
      // Update the toast state
      dispatch({
        type: "UPDATE_TOAST",
        toast: { ...currentToast, id: toastId, autoClose: newAutoClose },
      })
      
      // If turning on autoClose, add to remove queue
      if (newAutoClose) {
        addToRemoveQueue(toastId, true)
      }
    }
  }

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    toggleAutoClose,
  }
}

export { useToast, toast }
