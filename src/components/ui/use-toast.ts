
import { useContext, createContext } from "react";


export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export type ToastContextType = {
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    // Provide default implementation if context is not available
    return {
      toast: (props: ToastProps) => {
        console.log("Toast:", props);
      },
      dismiss: (id: string) => {
        console.log("Dismiss toast:", id);
      }
    };
  }
  
  return context;
}
