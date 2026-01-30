import { useEffect, useMemo, useRef, useState } from "react";

interface EventStreamOptions<T> {
  parser?: (data: string) => T;
  enabled?: boolean;
}

export function useEventStream<T = unknown>(
  subject: string,
  options: EventStreamOptions<T> = {},
) {
  const { parser = JSON.parse, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const streamUrl = useMemo(() => {
    const base = import.meta.env.VITE_EVENT_STREAM_URL;
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/streams/${subject}`;
  }, [subject]);

  useEffect(() => {
    if (!enabled || !streamUrl) return;

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onerror = () => {
      setConnected(false);
      setError(new Error("Event stream connection lost"));
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = parser(event.data);
        setData(parsed);
      } catch (parseError) {
        setError(parseError as Error);
      }
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [enabled, parser, streamUrl]);

  return { data, error, connected };
}
