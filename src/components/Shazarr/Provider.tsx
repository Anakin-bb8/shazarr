import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { Haptics } from "@capacitor/haptics";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { VoiceRecorder } from "capacitor-voice-recorder";
import { Shazam } from "shazam-api";
import { ShazamRoot } from "shazam-api/dist/types";

import { RECORD_DURATION } from "../../constant";
import { ErrorCodeType } from "../Config/errorCode";
import { useConfigProvider } from "../Config/useConfig";
import { HistoryItem } from "../History/context";
import { useHistoryProvider } from "../History/useHistory";

import { mockRecordBase64 } from "./mock/recordBase64";
import { liveActivity } from "./liveActivity";
import { RecordingStatusType, ShazarrContext } from "./context";
import { transcodePCM16 } from "./utils";

export type { RecordingStatusType } from "./context";

const FLAT_LEVELS = [0.14, 0.14, 0.14, 0.14, 0.14];

export function ShazarrProvider({ children }: { children: ReactNode }) {
  const [audio, setAudio] = useState<string>();
  const [showInlineResult, setShowInlineResult] = useState(false);
  const [openResultDate, setOpenResultDate] = useState<number>();
  const [shazarrLoading, setShazarrLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<ErrorCodeType | undefined>();
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatusType>("inactive");
  const [pendingTrackKey, setPendingTrackKey] = useState<string>();

  const { config, isNetworkConnected } = useConfigProvider();

  const {
    history,
    actions: { addItemToHistory },
  } = useHistoryProvider();

  // Live value read by event listeners that must not re-subscribe on change.
  const statusRef = useRef<RecordingStatusType>(recordingStatus);
  const levelsTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    statusRef.current = recordingStatus;
  }, [recordingStatus]);

  const vibrateAction = async () => {
    try {
      await Haptics.vibrate();
    } catch (err) {
      console.error(err);
    }
  };

  const stopLevelStream = useCallback(() => {
    if (levelsTimer.current !== undefined) {
      window.clearInterval(levelsTimer.current);
      levelsTimer.current = undefined;
    }
  }, []);

  /**
   * ActivityKit can't run a continuous, mic-reactive animation: a Live Activity
   * is a series of snapshots, and the recorder owns the audio session while it
   * runs. We push a fresh waveform a few times a second so the bars move like
   * audio rather than a GIF, then swap to the result state on match.
   */
  const startLevelStream = useCallback(() => {
    stopLevelStream();
    const startedAt = Date.now();
    const phases = [0.0, 1.1, 2.4, 0.7, 3.1];
    const speeds = [2.7, 3.9, 2.1, 3.3, 2.9];

    levelsTimer.current = window.setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      const levels = phases.map((phase, index) => {
        const wave = Math.sin(seconds * speeds[index] + phase);
        const drift = Math.sin(seconds * 0.9 + phase * 1.7) * 0.12;
        return Math.min(1, Math.max(0.16, 0.55 + wave * 0.32 + drift));
      });
      void liveActivity.update({ phase: "listening", levels });
    }, 280);
  }, [stopLevelStream]);

  const stopLiveActivity = useCallback(() => {
    stopLevelStream();
    void liveActivity.stop();
  }, [stopLevelStream]);

  const dismissInlineResult = () => {
    setShowInlineResult(false);
  };

  const resetSearch = async () => {
    setShowInlineResult(false);
    setAudio(undefined);
    setRecordingStatus("inactive");
    setShazarrLoading(false);
    stopLiveActivity();

    await ScreenOrientation.unlock();

    try {
      const { status } = await VoiceRecorder.getCurrentStatus();
      if (status === "RECORDING") {
        await VoiceRecorder.stopRecording();
      }
    } catch (e) {
      console.error(e);
    }
  };

  function handleTesting(date: number) {
    const audioData = mockRecordBase64;
    setAudio(audioData);
    if (!isNetworkConnected) {
      addItemToHistory({
        title: "Offline record",
        artist: "Not discovered",
        date: date,
        stream: audioData,
      });
      setRecordingStatus("inactive");
      return;
    }
    setRecordingStatus("searching");
    processTranscoding(audioData);
  }

  const processShazam = async (samples: number[]) => {
    const shazam = new Shazam();

    shazam
      .fullRecognizeSong(samples)
      .then((value: ShazamRoot | null) => {
        console.log("shazarr:", value);
        const response = value?.track;
        if (response?.title) {
          const historyItem: HistoryItem = {
            title: response.title,
            artist: response.subtitle,
            date: Date.now(),
            data: response,
          };
          addItemToHistory(historyItem);
          setShowInlineResult(true);
          stopLevelStream();
          void liveActivity.update({
            phase: "result",
            levels: FLAT_LEVELS,
            title: response.title,
            artist: response.subtitle,
            artworkURL: response.images?.coverart,
            downloadURL: `shazarr://track?key=${encodeURIComponent(response.key)}`,
          });
        } else {
          setRecordingError("SHAZARR_NOT_FOUND" as never);
          void liveActivity.update({ phase: "error" });
          window.setTimeout(stopLiveActivity, 4000);
        }
      })
      .catch((err) => {
        console.error("shazarr:", err);
        setRecordingError("SHAZAM_API_ERROR" as never);
        void liveActivity.update({ phase: "error" });
        window.setTimeout(stopLiveActivity, 4000);
      })
      .finally(async () => {
        await vibrateAction();
        await ScreenOrientation.unlock();
        setRecordingStatus("inactive");
        setShazarrLoading(false);
      });
  };

  const processTranscoding = (recordDataBase64: string) => {
    setShazarrLoading(true);
    transcodePCM16(recordDataBase64).then((pcm16) => {
      processShazam(pcm16);
    });
  };

  const startRecording = async (duration: number = RECORD_DURATION) => {
    setRecordingError(undefined);
    try {
      const { value: hasPerm } = await VoiceRecorder.hasAudioRecordingPermission();

      if (!hasPerm) {
        const { value: resultRequestPerm } = await VoiceRecorder.requestAudioRecordingPermission();

        if (!resultRequestPerm) return;
      }

      vibrateAction();
      setRecordingStatus("recording");

      void liveActivity.start();
      startLevelStream();

      const { value: isRecording } = await VoiceRecorder.startRecording();

      if (isRecording) {
        setTimeout(async () => {
          const {
            value: { recordDataBase64 },
          } = await VoiceRecorder.stopRecording();

          const audioData =
            import.meta.env.VITE_STAGE === "testing" ? mockRecordBase64 : recordDataBase64;

          if (!audioData) return;

          setAudio(audioData);
          setRecordingStatus("searching");
          await vibrateAction();

          if (!isNetworkConnected) {
            addItemToHistory({
              title: "Offline record",
              artist: "Not discovered",
              date: Date.now(),
              stream: audioData,
            });
            setRecordingStatus("inactive");
            stopLiveActivity();
            return;
          }

          processTranscoding(audioData);
        }, duration);
      }
    } catch (err) {
      console.error(err);

      if (import.meta.env.VITE_STAGE === "testing") {
        handleTesting(Date.now());
        return;
      }

      resetSearch();
      setRecordingError("ERROR_RECORDING" as never);
    }
  };

  const hasCheckedLaunchConfig = useRef(false);

  useEffect(() => {
    if (hasCheckedLaunchConfig.current) return;
    if (!config) return;
    hasCheckedLaunchConfig.current = true;

    if (!config.auto_listen_on_launch) return;
    if (recordingStatus !== "inactive") return;

    setTimeout(() => startRecording(), 0);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // The "Riconosci un brano" shortcut: the App Intent flags the app (or emits
  // the event if the app is already alive) and we start listening. The short
  // poll covers a cold launch, where the intent can land just after the web
  // layer mounts and the event would otherwise be missed.
  useEffect(() => {
    let cancelled = false;

    const triggerRecognize = () => {
      if (statusRef.current !== "inactive") return;
      setTimeout(() => startRecording(), 300);
    };

    const unsubscribe = liveActivity.onPendingRecognize(() => {
      void liveActivity.consumePendingRecognize();
      triggerRecognize();
    });

    const timers = [0, 600, 1500, 3000].map((delay) =>
      window.setTimeout(() => {
        if (cancelled) return;
        liveActivity.consumePendingRecognize().then((pending) => {
          if (pending) triggerRecognize();
        });
      }, delay),
    );

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      unsubscribe();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep links: the Live Activity's "Scarica" pill opens the matched track,
  // "shazarr://stop" stops an in-flight recognition.
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "shazarr:") return;

        if (parsed.host === "stop") {
          resetSearch();
          return;
        }

        if (parsed.host === "track") {
          const key = parsed.searchParams.get("key");
          if (!key) return;
          setPendingTrackKey(key);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const listener = App.addListener("appUrlOpen", handleUrl);
    App.getLaunchUrl()
      .then((launch) => {
        if (launch?.url) handleUrl({ url: launch.url });
      })
      .catch(() => {});

    return () => {
      listener.then((handle) => handle.remove());
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The "Scarica" pill can arrive before history is read from storage, so the
  // matching track is opened as soon as history is available.
  useEffect(() => {
    if (!pendingTrackKey || !history) return;
    const item = history.find((entry) => entry.data?.key === pendingTrackKey);
    if (!item) return;
    setOpenResultDate(item.date);
    setPendingTrackKey(undefined);
  }, [pendingTrackKey, history]);

  const searchOfflineRecord = (item: HistoryItem) => {
    if (!item?.stream) return;

    resetSearch();
    setAudio(item.stream);
    setRecordingStatus("searching");
    processTranscoding(item.stream);
  };

  const value = {
    recordingError,
    shazarrLoading,
    showInlineResult,
    openResultDate,
    recordingStatus,
    audio,
    actions: {
      startRecording,
      resetSearch,
      dismissInlineResult,
      searchOfflineRecord,
      setOpenResultDate,
    },
  };

  return <ShazarrContext.Provider value={value}>{children}</ShazarrContext.Provider>;
}
