import { useEffect, useState } from 'react';
import { Compass, GraduationCap, Award, Briefcase } from 'lucide-react';
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
    { id: 'bourses', label: 'Bourses', icon: Award },
    { id: 'metiers', label: 'Métiers A–Z', icon: Briefcase },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <PageMeta
        title="Orientation & Carrière"
        description="Écoles et classements, catalogue de bourses et encyclopédie des métiers de A à Z."
      />

      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wide">
          <Compass className="h-4 w-4" /> Orientation & Carrière
        </div>
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-slate-100">
          Construisez votre parcours
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Explorez les fiches écoles, les bourses (Cameroun, Afrique, International) et les métiers de A à Z.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Chargement…</div>
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
                className="text-left card-base p-5 hover:shadow-card-hover transition"
              >
                <div className="flex items-start gap-3">
                  {s.logo_url ? (
                    <img src={s.logo_url} alt={`Logo ${s.name}`} className="h-12 w-12 object-contain" loading="lazy" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold">
                      {s.ranking_position ?? '—'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{s.name}</p>
                    <p className="text-xs text-slate-500">
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
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  region === r ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {r === 'all' ? 'Toutes' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {scholarships.length === 0 ? (
            <EmptyState
              title="Aucune bourse pour ce filtre"
              description="Le catalogue des bourses est géré par le super administrateur."
              icon={Award}
            />
          ) : (
            <ul className="space-y-3">
              {scholarships.map((b) => (
                <li key={b.id} className="card-base p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{b.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {b.region}
                        {b.country ? ` · ${b.country}` : ''}
                        {b.deadline ? ` · Deadline ${b.deadline}` : ''}
                      </p>
                    </div>
                    {b.amount && (
                      <span className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded-lg">
                        {b.amount}
                      </span>
                    )}
                  </div>
                  {b.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{b.description}</p>}
                  {b.application_url && (
                    <a
                      href={b.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-3 text-sm font-semibold text-brand-600"
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
              className={`h-8 min-w-8 px-2 rounded-lg text-xs font-bold ${letter === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
            >
              Tous
            </button>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLetter(l)}
                className={`h-8 w-8 rounded-lg text-xs font-bold ${letter === l ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                {l}
              </button>
            ))}
          </div>
          {careers.length === 0 ? (
            <EmptyState
              title="Aucun métier publié"
              description="L’encyclopédie des métiers de A à Z sera alimentée par le super administrateur."
              icon={Briefcase}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {careers.map((c) => (
                <article key={c.id} className="card-base p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 font-bold text-sm">
                      {c.letter}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</h3>
                  </div>
                  {c.missions && <p className="text-sm text-slate-600 dark:text-slate-400">{c.missions}</p>}
                  <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2">
                    {c.study_duration && (
                      <>
                        <dt>Études</dt>
                        <dd className="text-slate-700 dark:text-slate-300">{c.study_duration}</dd>
                      </>
                    )}
                    {c.avg_retirement_age != null && (
                      <>
                        <dt>Retraite moy.</dt>
                        <dd className="text-slate-700 dark:text-slate-300">{c.avg_retirement_age} ans</dd>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setSelectedSchool(null)}>
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="school-title"
          >
            <h2 id="school-title" className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              {selectedSchool.name}
            </h2>
            {selectedSchool.ranking_position != null && (
              <p className="text-sm text-brand-600 font-semibold mt-1">Classement #{selectedSchool.ranking_position}</p>
            )}
            {selectedSchool.why_top && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                <strong>Pourquoi Top&nbsp;?</strong> {selectedSchool.why_top}
              </p>
            )}
            {selectedSchool.advantages?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase text-slate-400">Avantages</p>
                <ul className="mt-1 list-disc pl-4 text-sm text-slate-600 dark:text-slate-400">
                  {selectedSchool.advantages.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSchool.disadvantages?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase text-slate-400">Limites</p>
                <ul className="mt-1 list-disc pl-4 text-sm text-slate-600 dark:text-slate-400">
                  {selectedSchool.disadvantages.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSchool.admission_info && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                <strong>Admission :</strong> {selectedSchool.admission_info}
              </p>
            )}
            <button type="button" className="btn-primary mt-5 w-full" onClick={() => setSelectedSchool(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
