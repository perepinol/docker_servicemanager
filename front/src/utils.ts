type BooleanObject = {[key: string]: boolean};

export const shortest = (arr: string[]): string => {
  const lengths = arr.map(value => value.length);
  const minlen = lengths.reduce((x, y) => x < y ? x : y);
  return arr[lengths.indexOf(minlen)];
};

export const joinBooleanObjects = (a: BooleanObject, b: BooleanObject, operation: (a: boolean, b: boolean) => boolean): BooleanObject => {
  const result = { ...a };
  for (const key in b) {
    result[key] = a[key] ? operation(a[key], b[key]) : b[key];
  }
  return result;
};