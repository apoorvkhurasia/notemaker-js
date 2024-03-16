export function del<T>(arr: T[], elem: T): boolean {
  const index = arr.indexOf(elem);
  if (index >= 0) {
    arr.splice(index, 1);
    return true;
  }
  return false;
}

export function computeIfAbsent<K, V>(
  map: Map<K, V>,
  key: K,
  missingValComputer: (k: K) => V
) {
  let val = map.get(key);
  if (!val) {
    val = missingValComputer(key);
  }
  map.set(key, val);
  return val;
}

export function pop<K, V>(map: Map<K, V>): V | null {
  if (map.size > 0) {
    const [key, val] = map.entries().next().value;
    map.delete(key);
    return val;
  }
  return null;
}
