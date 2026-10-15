import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = {
  name: string;
  mascot: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ teams: TeamItem[] }>('/api/teams');
        if (!active) return;
        setTeams(payload.teams ?? []);
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
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} emptyText="No teams yet.">
      {teams.length > 0 ? (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name}-${index}`} className="list-group-item">
              <strong>{team.name}</strong> ({team.mascot}) · {team.members.length} members
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
