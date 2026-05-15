import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.REACT_APP_PB_URL);

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
