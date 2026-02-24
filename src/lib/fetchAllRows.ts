const PAGE_SIZE = 1000;

/**
 * Fetches ALL rows from a Supabase query by paginating in 1000-row batches.
 * This bypasses the server-side `max_rows` limit (default 1000).
 */
export async function fetchAllRows<T = any>(
  queryBuilder: { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }> }
): Promise<T[]> {
  const allData: T[] = [];
  let page = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await queryBuilder.range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;

    allData.push(...data);

    if (data.length < PAGE_SIZE) break;
    page++;
  }

  return allData;
}
