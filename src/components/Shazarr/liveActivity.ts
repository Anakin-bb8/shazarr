import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

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
 * No-ops on the web build (the calls reject, every call site swallows that).
 */
export const LiveActivity = registerPlugin<LiveActivityPlugin>("LiveActivity");
