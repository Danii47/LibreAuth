export const getColors = (scheme: "light" | "dark" | null | undefined) => {
  const isDark = scheme === "dark";
  return {
    background: isDark ? "#1d1e1fff" : "#f5f5f5",
    card: isDark ? "#292929ff" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#333333",
    subtext: isDark ? "#AAAAAA" : "#888888",
    headerBg: isDark ? "#141414ff" : "#FFFFFF",
    headerBorder: isDark ? "#333333" : "#eee",
    tint: "#2e78b7",
    danger: "#FF3B30",
    warning: "#FF9500",
    success: "#34C759",
    overlay: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.5)",
    modalBg: isDark ? "#1b1b1dff" : "#FFFFFF",
  };
};
