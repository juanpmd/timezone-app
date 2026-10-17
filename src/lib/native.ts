// Thin wrapper over the Rust commands. Falls back to browser APIs so the UI can
// be developed with plain `vite` outside Tauri.

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const STORAGE_KEY = "timezone-state";

export async function loadState(): Promise<string | null> {
  if (!isTauri) return localStorage.getItem(STORAGE_KEY);
  return invoke<string | null>("load_state");
}

export async function saveState(json: string): Promise<void> {
  if (!isTauri) return void localStorage.setItem(STORAGE_KEY, json);
  await invoke("save_state", { json });
}

export async function copyText(text: string): Promise<void> {
  if (!isTauri) return navigator.clipboard.writeText(text);
  await invoke("copy_text", { text });
}

export const setTrayTitle = (title: string | null) => (isTauri ? invoke("set_tray_title", { title }) : Promise.resolve());
export const setHotkey = (shortcut: string | null) => (isTauri ? invoke("set_hotkey", { shortcut }) : Promise.resolve());
export const setAutostart = (enabled: boolean) => (isTauri ? invoke("set_autostart", { enabled }) : Promise.resolve());
export const getAutostart = () => (isTauri ? invoke<boolean>("get_autostart") : Promise.resolve(false));
export const fitHeight = (height: number) => (isTauri ? invoke("fit_height", { height }) : Promise.resolve());
export const hideWindow = () => (isTauri ? invoke("hide_window") : Promise.resolve());
export const quitApp = () => (isTauri ? invoke("quit") : Promise.resolve());

export function onPopoverShown(callback: () => void): () => void {
  if (!isTauri) return () => {};
  const unlisten = listen("popover-shown", callback);
  return () => void unlisten.then((fn) => fn());
}
