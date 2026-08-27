import React from "react";
import { ThemeProvider } from "./hooks/useTheme";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./hooks/useAuth";
import { AppRoutes } from "./routes/AppRoutes";

export const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
