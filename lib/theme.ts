export type Theme = "light" | "dark";
export const THEME_KEY = "ll_theme";
export const THEME_COLOR: Record<Theme, string> = { light: "#FAF7F5", dark: "#12100F" };

/**
 * Runs in <head> before paint so a saved choice never flashes the wrong theme.
 * Without a saved choice, CSS follows the device setting.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;
