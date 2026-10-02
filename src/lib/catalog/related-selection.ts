/** Series candidates precede public category candidates; each source is already ordered by sort_order/id. */
export function selectRelatedRows<Row extends { id: string }>(
  currentId: string, series: Row[], categories: Row[], limit = 3,
): Row[] {
  const selected = new Map<string, Row>();
  for (const row of [...series, ...categories]) {
    if (row.id !== currentId && !selected.has(row.id)) selected.set(row.id, row);
    if (selected.size === limit) break;
  }
  return [...selected.values()];
}
