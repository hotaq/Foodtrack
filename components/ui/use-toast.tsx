"use client"

import * as React from "react";
import { useToast } from "@/lib/use-toast-hook"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"

export function Toaster() {
  const { toasts = [] } = useToast()

  return (
    <ToastProvider>
      {Array.isArray(toasts) && toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id || Math.random().toString()} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
} 