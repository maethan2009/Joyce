const DEFAULT_TITLE = 'EduCampus';
const DEFAULT_DESC =
  'EduCampus — portail académique multi-rôles : orientation, Academic Hub, SkillLink, EduAmis et messagerie.';

export function setPageMeta(title: string, description?: string) {
  const full = title === DEFAULT_TITLE ? title : `${title} · EduCampus`;
  document.title = full;

  const desc = description || DEFAULT_DESC;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', desc);

  const ogTitle = ensureMeta('property', 'og:title');
  ogTitle.setAttribute('content', full);
  const ogDesc = ensureMeta('property', 'og:description');
  ogDesc.setAttribute('content', desc);

  const twTitle = ensureMeta('name', 'twitter:title');
  twTitle.setAttribute('content', full);
  const twDesc = ensureMeta('name', 'twitter:description');
  twDesc.setAttribute('content', desc);
}

function ensureMeta(attr: 'name' | 'property', key: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
}
