import React from "react";
import { ThemeProvider } from "./hooks/useTheme";
import { ToastProvider } from "./components/ui/Toast";
import { AppRoutes } from "./routes/AppRoutes";

export const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
