/**
 * Licensed stills of real hardware, keyed by Learn catalog id.
 * 3D stays a textbook teaching model; these photos are the real-hardware reference.
 * Add a row here to reuse the same Learn + Live Launch figure pattern.
 */

const PHOTOS = {
  raptor: {
    file: "raptor-hawthorne.jpg",
    alt: "Sea-level Raptor engine on a stand at SpaceX Hawthorne, May 2020",
    caption: "3D is a textbook teaching model; photo is real hardware.",
    credit: "Brandon De Young",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:SpaceX_sea-level_Raptor_at_Hawthorne_-_2.jpg",
  },
};

/** Other catalog cards that should show the same still (Live hotspots share these ids). */
const ALIASES = {
  "booster-cluster": "raptor",
};

export function photoSrc(photo) {
  if (!photo?.file) return "";
  const base = import.meta.env?.BASE_URL || "/";
  return `${base}refs/${photo.file}`;
}

export function photoForCatalog(catalogId) {
  if (!catalogId) return null;
  const key = ALIASES[catalogId] || catalogId;
  return PHOTOS[key] ?? null;
}

export function fillReferenceFigure(figure, { img, caption, credit } = {}, photo) {
  if (!figure) return;
  if (!photo) {
    figure.hidden = true;
    figure.classList.add("hidden");
    if (img) {
      img.removeAttribute("src");
      img.alt = "";
    }
    return;
  }
  figure.hidden = false;
  figure.classList.remove("hidden");
  if (img) {
    img.src = photoSrc(photo);
    img.alt = photo.alt;
  }
  if (caption) caption.textContent = photo.caption;
  if (credit) {
    credit.textContent = `Photo: ${photo.credit} · ${photo.license}`;
    credit.href = photo.pageUrl;
  }
}
