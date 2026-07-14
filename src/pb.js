import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.REACT_APP_PB_URL);

// Failų prieigos tokenas (naudojamas prie nuotraukų URL, kad veiktų
// su "Protected" pažymėtais failų laukais PocketBase pusėje). Kol laukas
// nepažymėtas kaip Protected, šis parametras tiesiog ignoruojamas.
let fileTokenCache = { token: null, expires: 0 };
export async function pbFileToken() {
  if (!pb.authStore.isValid) return null;
  const now = Date.now();
  if (fileTokenCache.token && now < fileTokenCache.expires) return fileTokenCache.token;
  try {
    const token = await pb.files.getToken();
    fileTokenCache = { token, expires: now + 2 * 60 * 1000 };
    return token;
  } catch {
    return null;
  }
}

export async function pbFirst(collection, filter, opts = {}) {
  try {
    return await pb.collection(collection).getFirstListItem(filter, { requestKey: null, ...opts });
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function pbUpsert(collection, filter, data) {
  try {
    const existing = await pb.collection(collection).getFirstListItem(filter);
    return await pb.collection(collection).update(existing.id, data);
  } catch (e) {
    if (e.status === 404) return await pb.collection(collection).create(data);
    throw e;
  }
}