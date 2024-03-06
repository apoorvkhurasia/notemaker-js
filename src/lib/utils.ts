export function del<T>(arr: T[], elem: T): void {
  const index = arr.indexOf(elem);
  if (index >= 0) {
    arr.splice(index, 1);
  }
}
