import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Verificar se há tema salvo no localStorage (específico para dono)
    const savedTheme = localStorage.getItem("dono-theme") as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    // Padrão: modo claro
    return "light";
  });

  useEffect(() => {
    // Aplicar tema apenas no elemento do painel do dono
    const donoPanel = document.querySelector(".dono-panel-theme");
    if (donoPanel) {
      donoPanel.classList.remove("light", "dark");
      donoPanel.classList.add(theme);
    }
    localStorage.setItem("dono-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
}

