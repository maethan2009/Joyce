import { useEffect, useState } from 'react';
import { Compass, GraduationCap, Award, Briefcase, Loader2, X } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { EmptyState } from '@/components/EmptyState';
import { orientationService } from '@/services';
import type { Career, Scholarship, School } from '@/types';

type Tab = 'ecoles' | 'bourses' | 'metiers';

export function OrientationPage() {
  const [tab, setTab] = useState<Tab>('ecoles');
  const [schools, setSchools] = useState<School[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [region, setRegion] = useState('all');
  const [letter, setLetter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (tab === 'ecoles') {
          const data = await orientationService.listSchools();
          if (!cancelled) setSchools(data);
        } else if (tab === 'bourses') {
          const data = await orientationService.listScholarships(region);
          if (!cancelled) setScholarships(data);
        } else {
          const data = await orientationService.listCareers(letter);
          if (!cancelled) setCareers(data);
        }
      } catch {
        if (!cancelled) {
          setSchools([]);
          setScholarships([]);
          setCareers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, region, letter]);

  const tabs: { id: Tab; label: string; icon: typeof Compass }[] = [
    { id: 'ecoles', label: 'Écoles & classements', icon: GraduationCap },
    { id: 'bourses', label: 'Bourses d’études', icon: Award },
    { id: 'metiers', label: 'Métiers A–Z', icon: Briefcase },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <PageMeta
        title="Orientation & Avenir"
        description="Écoles et classements, catalogue de bourses et encyclopédie des métiers de A à Z."
      />

      <header className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 text-[11px] font-bold uppercase tracking-widest">
          <Compass className="h-4 w-4" /> Pilier 2 · Orientation &amp; Avenir
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
          Construisez votre parcours
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Explorez les fiches écoles vérifiées, les bourses (Cameroun, Afrique, International) et l’encyclopédie des métiers.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-brand-600 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tab === 'ecoles' ? (
        schools.length === 0 ? (
          <EmptyState
            title="Aucune école publiée"
            description="Le catalogue des écoles et classements sera disponible dès publication par l’administrateur."
            icon={GraduationCap}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {schools.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSchool(s)}
                className="text-left card-base p-5 hover:border-brand-600/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {s.logo_url ? (
                    <img
                      src={s.logo_url}
                      alt={`Logo ${s.name}`}
                      className="h-12 w-12 object-contain rounded-lg bg-white p-1 border border-zinc-200 dark:border-zinc-800"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold tabular-nums">
                      {s.ranking_position ?? '—'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-display font-bold text-zinc-950 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {s.city ? `${s.city} · ` : ''}
                      {s.category}
                      {s.ranking_position != null ? ` · Rang #${s.ranking_position}` : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      ) : tab === 'bourses' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {['all', 'cameroun', 'afrique', 'international'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold border transition-colors ${
                  region === r
                    ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white'
                    : 'bg-white dark:bg-[#111114] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {r === 'all' ? 'Toutes les zones' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {scholarships.length === 0 ? (
            <EmptyState
              title="Aucune bourse pour ce filtre"
              description="Le catalogue des bourses est alimenté par le super administrateur."
              icon={Award}
            />
          ) : (
            <ul className="space-y-3">
              {scholarships.map((b) => (
                <li key={b.id} className="card-base p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-zinc-950 dark:text-white">{b.title}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {b.region}
                        {b.country ? ` · ${b.country}` : ''}
                        {b.deadline ? ` · Date limite : ${b.deadline}` : ''}
                      </p>
                    </div>
                    {b.amount && (
                      <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 px-2.5 py-1 rounded-md tabular-nums">
                        {b.amount}
                      </span>
                    )}
                  </div>
                  {b.description && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{b.description}</p>}
                  {b.application_url && (
                    <a
                      href={b.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-3 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Postuler →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setLetter('all')}
              className={`h-8 min-w-8 px-2.5 rounded-lg text-xs font-bold border transition-colors ${
                letter === 'all'
                  ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white'
                  : 'bg-white dark:bg-[#111114] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Tous
            </button>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLetter(l)}
                className={`h-8 w-8 rounded-lg text-xs font-bold border transition-colors ${
                  letter === l
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-[#111114] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-brand-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {careers.length === 0 ? (
            <EmptyState
              title="Aucun métier publié"
              description="L’encyclopédie des métiers de A à Z est administrée depuis le portail Super Admin."
              icon={Briefcase}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {careers.map((c) => (
                <article key={c.id} className="card-base p-5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-bold text-sm border border-brand-200 dark:border-brand-900">
                      {c.letter}
                    </span>
                    <h3 className="font-display font-bold text-zinc-950 dark:text-white">{c.name}</h3>
                  </div>
                  {c.missions && <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.missions}</p>}
                  <dl className="grid grid-cols-2 gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {c.study_duration && (
                      <>
                        <dt>Études</dt>
                        <dd className="text-zinc-900 dark:text-zinc-200 font-medium">{c.study_duration}</dd>
                      </>
                    )}
                    {c.avg_retirement_age != null && (
                      <>
                        <dt>Retraite moy.</dt>
                        <dd className="text-zinc-900 dark:text-zinc-200 font-medium tabular-nums">
                          {c.avg_retirement_age} ans
                        </dd>
                      </>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {selectedSchool && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedSchool(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-6 shadow-cabinet space-y-3"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="school-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="school-title" className="font-display text-xl font-bold text-zinc-950 dark:text-white">
                  {selectedSchool.name}
                </h2>
                {selectedSchool.ranking_position != null && (
                  <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold mt-0.5 tabular-nums">
                    Classement #{selectedSchool.ranking_position}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchool(null)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {selectedSchool.why_top && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-950 dark:text-white">Points forts :</strong> {selectedSchool.why_top}
              </p>
            )}
            {selectedSchool.advantages?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Avantages</p>
                <ul className="mt-1 list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  {selectedSchool.advantages.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSchool.disadvantages?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Limites</p>
                <ul className="mt-1 list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  {selectedSchool.disadvantages.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSchool.admission_info && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-950 dark:text-white">Admission :</strong> {selectedSchool.admission_info}
              </p>
            )}
            <button type="button" className="btn-primary mt-3 w-full" onClick={() => setSelectedSchool(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
