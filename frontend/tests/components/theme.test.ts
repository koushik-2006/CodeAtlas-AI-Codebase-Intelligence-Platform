import { THEME_STORAGE_KEY } from "../../lib/theme";

export function testThemeConstants() {
  console.assert(THEME_STORAGE_KEY === "codeatlas-theme", "Theme storage key should match");
}
