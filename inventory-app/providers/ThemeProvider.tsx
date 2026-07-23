import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
  // Placeholder for future theme support (light/dark mode)
  return <>{children}</>;
}