import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, loading = false, error = null, emptyText, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading...</p> : null}
        {error ? <div role="alert" className="alert alert-danger">Unable to load {title.toLowerCase()}: {error}</div> : null}
        {!loading && !error && (!children || (Array.isArray(children) && children.length === 0)) ? (
          <p>{emptyText ?? `No ${title.toLowerCase()} found.`}</p>
        ) : null}
        {!loading && !error ? children : null}
      </div>
    </section>
  );
}
