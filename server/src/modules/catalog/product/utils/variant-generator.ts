export type VariantOptionGroup = {
  attributeId: string;
  attributeValueIds: string[];
};

export type VariantCombination = {
  attributeValueIds: string[];
  key: string;
};

export const makeVariantKey = (attributeValueIds: string[]): string =>
  [...attributeValueIds].sort().join("|");

export const generateVariantCombinations = (
  groups: VariantOptionGroup[],
): VariantCombination[] => {
  const cleaned = groups
    .map((group) => ({
      attributeId: group.attributeId,
      attributeValueIds: [...new Set(group.attributeValueIds)],
    }))
    .filter((group) => group.attributeValueIds.length > 0);

  if (cleaned.length === 0) return [];

  const combinations = cleaned.reduce<string[][]>(
    (acc, group) => {
      if (acc.length === 0) {
        return group.attributeValueIds.map((id) => [id]);
      }
      return acc.flatMap((combo) =>
        group.attributeValueIds.map((id) => [...combo, id]),
      );
    },
    [],
  );

  const seen = new Set<string>();
  const unique: VariantCombination[] = [];
  for (const attributeValueIds of combinations) {
    const key = makeVariantKey(attributeValueIds);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ attributeValueIds, key });
  }
  return unique;
};
