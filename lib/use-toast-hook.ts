// Create a self-contained implementation to avoid circular dependencies
import * as React from "react";

// Define minimal types needed for our implementation
type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: "default" | "destructive";
  [key: string]: any;
};

// Simple internal state management
let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

// Generate a unique ID for each toast
let count = 0;
function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// Notify listeners when toasts change
function notifyListeners() {
  listeners.forEach(listener => listener(toasts));
}

// Toast function to create new toasts
export function toast(props: Omit<Toast, "id">) {
  const id = generateId();
  const newToast = { id, ...props };
  
  // Add toast to the list (limit to 5)
  toasts = [newToast, ...toasts].slice(0, 5);
  notifyListeners();
  
  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: Partial<Toast>) => updateToast(id, props)
  };
}

// Dismiss a toast by ID
function dismissToast(id?: string) {
  if (id) {
    // Mark as closed or remove completely
    toasts = toasts.map(t => 
      t.id === id ? { ...t, open: false } : t
    );
  } else {
    // Dismiss all
    toasts = toasts.map(t => ({ ...t, open: false }));
  }
  notifyListeners();
}

// Update a toast
function updateToast(id: string, props: Partial<Toast>) {
  toasts = toasts.map(t => 
    t.id === id ? { ...t, ...props } : t
  );
  notifyListeners();
}

// Hook to use toast functionality
export function useToast() {
  const [state, setState] = React.useState<Toast[]>(toasts);
  
  React.useEffect(() => {
    // Add listener
    listeners.push(setState);
    
    // Cleanup
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);
  
  return {
    toast,
    toasts: state,
    dismiss: dismissToast
  };
} 