import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = {
  type: string;
  minutes: number;
  points: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ activities: ActivityItem[] }>('/api/activities');
        if (!active) return;
        setActivities(payload.activities ?? []);
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
    <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} emptyText="No activities yet.">
      {activities.length > 0 ? (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${activity.minutes}-${index}`} className="list-group-item">
              <strong>{activity.type}</strong> · {activity.minutes} min · {activity.points} pts
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
