import { describe, expect, it, vi } from "vitest";
import { registerDayRolloverSync } from "@/lib/app/day-rollover-sync";

class FakeEventTarget {
  private listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new Event(type));
    }
  }
}

class FakeDocumentTarget extends FakeEventTarget {
  visibilityState: "hidden" | "visible" = "hidden";
}

function createTimerApi() {
  let nextId = 1;
  const callbacks = new Map<number, () => void | Promise<void>>();
  const delays = new Map<number, number>();

  return {
    callbacks,
    delays,
    api: {
      setTimeout: vi.fn((callback: () => void | Promise<void>, delay: number) => {
        const id = nextId;
        nextId += 1;
        callbacks.set(id, callback);
        delays.set(id, delay);
        return id as unknown as ReturnType<typeof setTimeout>;
      }),
      clearTimeout: vi.fn((handle: ReturnType<typeof setTimeout>) => {
        callbacks.delete(handle as unknown as number);
        delays.delete(handle as unknown as number);
      }),
    },
  };
}

describe("day rollover sync registration", () => {
  it("syncs immediately and schedules the next midnight refresh", () => {
    const syncToday = vi.fn().mockResolvedValue("2026-03-09");
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeDocumentTarget();
    const timer = createTimerApi();

    const dispose = registerDayRolloverSync({
      syncToday,
      windowTarget,
      documentTarget,
      timerApi: timer.api,
      getDelayMs: () => 2500,
    });

    expect(syncToday).toHaveBeenCalledTimes(1);
    expect(timer.api.setTimeout).toHaveBeenCalledTimes(1);
    expect(Array.from(timer.delays.values())).toEqual([2500]);

    dispose();
  });

  it("resyncs on focus, pageshow, and visible recovery", () => {
    const syncToday = vi.fn().mockResolvedValue("2026-03-09");
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeDocumentTarget();
    const timer = createTimerApi();

    const dispose = registerDayRolloverSync({
      syncToday,
      windowTarget,
      documentTarget,
      timerApi: timer.api,
      getDelayMs: () => 2500,
    });

    windowTarget.dispatch("focus");
    windowTarget.dispatch("pageshow");
    documentTarget.dispatch("visibilitychange");
    documentTarget.visibilityState = "visible";
    documentTarget.dispatch("visibilitychange");

    expect(syncToday).toHaveBeenCalledTimes(4);
    dispose();
  });

  it("reschedules after the midnight timer fires", async () => {
    const syncToday = vi.fn().mockResolvedValue("2026-03-10");
    const windowTarget = new FakeEventTarget();
    const documentTarget = new FakeDocumentTarget();
    const timer = createTimerApi();

    const dispose = registerDayRolloverSync({
      syncToday,
      windowTarget,
      documentTarget,
      timerApi: timer.api,
      getDelayMs: () => 1000,
    });

    const firstTimerId = Array.from(timer.callbacks.keys())[0];
    const firstCallback = timer.callbacks.get(firstTimerId);
    await firstCallback?.();

    expect(syncToday).toHaveBeenCalledTimes(2);
    expect(timer.api.setTimeout).toHaveBeenCalledTimes(2);
    dispose();
  });
});
