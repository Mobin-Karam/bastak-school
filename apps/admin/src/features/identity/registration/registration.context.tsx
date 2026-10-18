import { createContext, useContext, useState, useEffect } from "react";
import { useRegistrationSelf } from "./registration.hooks.ts";

interface RegistrationContextType {
  student: any;
  profile: any;
  documents: any[];
  status: string;
  progress: number;
  isLoading: boolean;
  error: any;
  refresh: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, error, refetch } = useRegistrationSelf();

  const [contextData, setContextData] = useState<RegistrationContextType>({
    student: null,
    profile: null,
    documents: [],
    status: "",
    progress: 0,
    isLoading: true,
    error: null,
    refresh: () => refetch(),
  });

  useEffect(() => {
    if (data) {
      setContextData({
        student: data.student,
        profile: data.profile,
        documents: data.documents || [],
        status: data.status || "",
        progress: data.progress || 0,
        isLoading,
        error,
        refresh: () => refetch(),
      });
    }
  }, [data, isLoading, error, refetch]);

  return (
    <RegistrationContext.Provider value={contextData}>{children}</RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  return context;
}
