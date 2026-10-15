import { useEffect, useState } from "react";

// Your original CSS files target <body> and share class names (.brand,
// .topbar, .eyebrow ...). Loading them all at once would make them fight.
// So each page loads only the CSS it needs (exactly like the old HTML pages
// did) and removes it when you leave the page. The CSS files are NOT changed.

const registry = new Map();

function acquire(href) {
  let entry = registry.get(href);

  if (!entry) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;

    entry = { link, count: 0, loaded: false, timer: null, waiters: new Set() };

    const finish = () => {
      entry.loaded = true;
      entry.waiters.forEach((fn) => fn());
      entry.waiters.clear();
    };

    link.addEventListener("load", finish);
    link.addEventListener("error", finish);
    document.head.appendChild(link);
    registry.set(href, entry);
  }

  clearTimeout(entry.timer);
  entry.count += 1;
  return entry;
}

function release(href) {
  const entry = registry.get(href);
  if (!entry) return;

  entry.count -= 1;

  if (entry.count <= 0) {
    // Small delay so moving between pages that share style.css
    // does not remove and re-add it (no flicker).
    entry.timer = setTimeout(() => {
      if (entry.count <= 0) {
        entry.link.remove();
        registry.delete(href);
      }
    }, 50);
  }
}

export default function usePageStyles(files, bodyClass = "") {
  const [ready, setReady] = useState(false);
  const key = files.join("|");

  useEffect(() => {
    const entries = files.map(acquire);
    const previousClass = document.body.className;
    let cancelled = false;

    document.body.className = bodyClass;

    const check = () => {
      if (!cancelled && entries.every((entry) => entry.loaded)) {
        setReady(true);
      }
    };

    entries.forEach((entry) => {
      if (!entry.loaded) entry.waiters.add(check);
    });
    check();

    return () => {
      cancelled = true;
      entries.forEach((entry) => entry.waiters.delete(check));
      files.forEach(release);
      document.body.className = previousClass;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bodyClass]);

  return ready;
}
