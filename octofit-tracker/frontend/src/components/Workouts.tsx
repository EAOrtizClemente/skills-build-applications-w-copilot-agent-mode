import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/' + encodeURIComponent('mona@example.com'));
        if (!active) return;
        setSuggestions(payload.suggestions ?? []);
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
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} emptyText="No workout suggestions.">
      {suggestions.length > 0 ? (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title}-${index}`} className="list-group-item">
              <strong>{suggestion.title}</strong> · {suggestion.focus}
              {suggestion.reason ? <div>{suggestion.reason}</div> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
