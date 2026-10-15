import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(payload.leaderboard ?? []);
        setError(null);
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} emptyText="No leaderboard available.">
      {leaderboard.length > 0 ? (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li key={`${entry.teamName}-${entry.rank}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{entry.rank}. {entry.teamName}</span>
              <span>{entry.totalPoints}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </CapabilityCard>
  );
}
