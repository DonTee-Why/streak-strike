import { getMsUntilNextLocalMidnight } from "@/lib/date/local-date";

type TimerHandle = ReturnType<typeof setTimeout>;

interface EventTargetLike {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

interface VisibilityDocumentLike extends EventTargetLike {
  visibilityState?: string;
}

interface TimerApi {
  setTimeout: (callback: () => void | Promise<void>, delay: number) => TimerHandle;
  clearTimeout: (handle: TimerHandle) => void;
}

export function registerDayRolloverSync(input: {
  syncToday: () => Promise<string>;
  windowTarget: EventTargetLike;
  documentTarget: VisibilityDocumentLike;
  timerApi: TimerApi;
  getDelayMs?: () => number;
}): () => void {
  const { syncToday, windowTarget, documentTarget, timerApi, getDelayMs = () => getMsUntilNextLocalMidnight() } = input;
  let timeoutHandle: TimerHandle | null = null;
  let disposed = false;

  const runSync = () => {
    void syncToday();
  };

  const scheduleNext = () => {
    if (disposed) {
      return;
    }

    if (timeoutHandle !== null) {
      timerApi.clearTimeout(timeoutHandle);
    }

    timeoutHandle = timerApi.setTimeout(async () => {
      await syncToday();
      scheduleNext();
    }, getDelayMs());
  };

  const handleVisibilityChange: EventListener = () => {
    if (documentTarget.visibilityState === "visible") {
      runSync();
    }
  };

  const handleFocus: EventListener = () => {
    runSync();
  };

  const handlePageShow: EventListener = () => {
    runSync();
  };

  runSync();
  scheduleNext();

  windowTarget.addEventListener("focus", handleFocus);
  windowTarget.addEventListener("pageshow", handlePageShow);
  documentTarget.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    disposed = true;
    if (timeoutHandle !== null) {
      timerApi.clearTimeout(timeoutHandle);
    }
    windowTarget.removeEventListener("focus", handleFocus);
    windowTarget.removeEventListener("pageshow", handlePageShow);
    documentTarget.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
