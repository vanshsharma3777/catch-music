async function getJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(url, { signal });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new Error(
      json?.error || `Request failed (${res.status})`,
    );
  }

  return json.data as T;
}
