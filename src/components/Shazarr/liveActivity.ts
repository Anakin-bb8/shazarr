import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type LiveActivityPhase = "listening" | "result" | "error";

export interface LiveActivityState {
  phase: LiveActivityPhase;
  /** Five normalized 0..1 bars, drawn as the listening waveform. */
  levels?: number[];
  title?: string;
  artist?: string;
  artworkURL?: string;
  /** Custom-scheme link the "Scarica" pill opens (shazarr://track?key=...). */
  downloadURL?: string;
  serviceName?: string;
}

export interface LiveActivityPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  consumePendingRecognize(): Promise<{ pending: boolean }>;
  start(options?: { levels?: number[] }): Promise<{ started: boolean }>;
  update(options: LiveActivityState): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: "pendingRecognize",
    listenerFunc: (data: unknown) => void,
  ): Promise<PluginListenerHandle>;
}

/**
 * Bridge to the native ActivityKit Live Activity shown in the Dynamic Island.
 * Only exists in the iOS build; the facade below keeps every other platform
 * silent instead of throwing "plugin is not implemented on web".
 */
export const LiveActivity = registerPlugin<LiveActivityPlugin>("LiveActivity");

const isIOS = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

export const liveActivity = {
  async start(levels?: number[]) {
    if (!isIOS()) return;
    await LiveActivity.start(levels ? { levels } : undefined).catch(() => {});
  },

  async update(state: LiveActivityState) {
    if (!isIOS()) return;
    await LiveActivity.update(state).catch(() => {});
  },

  async stop() {
    if (!isIOS()) return;
    await LiveActivity.stop().catch(() => {});
  },

  /** True only for a fresh "Riconosci un brano" shortcut run. */
  async consumePendingRecognize(): Promise<boolean> {
    if (!isIOS()) return false;
    try {
      const { pending } = await LiveActivity.consumePendingRecognize();
      return pending;
    } catch {
      return false;
    }
  },

  /** Fires when the shortcut runs while the app is already alive. */
  onPendingRecognize(handler: () => void): () => void {
    if (!isIOS()) return () => {};
    const handle = LiveActivity.addListener("pendingRecognize", handler).catch(() => undefined);
    return () => {
      handle.then((listener) => listener?.remove()).catch(() => {});
    };
  },
};
