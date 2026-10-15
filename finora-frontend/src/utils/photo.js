// Profile photos are stored in THIS browser only (localStorage), one per email.
// They are not saved in MySQL. The profile page and the sidebar now use the
// same key, so the photo shows up everywhere.

const keyFor = (email) =>
  "finoraProfilePhoto_" + String(email || "").trim().toLowerCase();

export function getPhoto(email) {
  if (!email) return null;
  try {
    return localStorage.getItem(keyFor(email));
  } catch {
    return null;
  }
}

export function savePhoto(email, dataUrl) {
  localStorage.setItem(keyFor(email), dataUrl); // may throw if storage is full
}

export function movePhoto(oldEmail, newEmail) {
  if (!oldEmail || !newEmail) return;
  if (keyFor(oldEmail) === keyFor(newEmail)) return;
  try {
    const photo = localStorage.getItem(keyFor(oldEmail));
    if (photo) {
      localStorage.setItem(keyFor(newEmail), photo);
      localStorage.removeItem(keyFor(oldEmail));
    }
  } catch {
    /* ignore */
  }
}
