export async function realmApi<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch("/realm" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let value;
  try {
    value = await r.json();
  } catch {
    throw Error(
      "Layanan dunia belum terhubung. Jalankan npm run world pada server lokal.",
    );
  }
  if (!r.ok) throw Error(value.error || "Permintaan tidak berhasil.");
  return value;
}
