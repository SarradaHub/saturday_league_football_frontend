import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventStream } from "@/shared/hooks/useEventStream";

interface MatchScheduledEvent {
  payload?: {
    matchId?: string;
    competition?: { name?: string };
    round?: { name?: string };
    scheduledAt?: string;
    homeTeam?: { name?: string };
    awayTeam?: { name?: string };
  };
}

interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  scheduledAt?: string;
}

const MAX_ITEMS = 5;

const MatchEventTicker = () => {
  const { data } = useEventStream<MatchScheduledEvent>(
    "scheduling.match.scheduled.v1",
    { enabled: Boolean(import.meta.env.VITE_EVENT_STREAM_URL) },
  );
  const [items, setItems] = useState<EventItem[]>([]);

  useEffect(() => {
    if (!data?.payload?.matchId) return;

    const title = `${data.payload.homeTeam?.name ?? "Time A"} vs ${data.payload.awayTeam?.name ?? "Time B"}`;
    const subtitle = `${data.payload.competition?.name ?? "Competição"} · ${data.payload.round?.name ?? "Rodada"}`;

    setItems((current) => {
      const nextItems = [
        {
          id: data.payload?.matchId ?? crypto.randomUUID(),
          title,
          subtitle,
          scheduledAt: data.payload?.scheduledAt,
        },
        ...current.filter((item) => item.id !== data.payload?.matchId),
      ];
      return nextItems.slice(0, MAX_ITEMS);
    });
  }, [data]);

  if (!items.length) {
    return null;
  }

  return (
    <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white/10 p-6 text-white shadow-xl backdrop-blur">
      <h3 className="mb-4 text-xl font-semibold">Atualizações ao vivo</h3>
      <ul className="space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl bg-white/5 p-4"
            >
              <p className="text-lg font-medium">{item.title}</p>
              <p className="text-sm text-slate-200">{item.subtitle}</p>
              {item.scheduledAt && (
                <p className="text-xs text-slate-300">
                  Agendado para {new Date(item.scheduledAt).toLocaleString()}
                </p>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default MatchEventTicker;
