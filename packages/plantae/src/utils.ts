const kindOf = ((cache) => (thing: any) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));

const kindOfTest = (type: string) => {
  type = type.toLowerCase();
  return (thing: any) => kindOf(thing) === type;
};

export const isArrayBuffer = kindOfTest("ArrayBuffer");

// https://fetch.spec.whatwg.org/#statuses
export const isNullBodyStatus = (status: number) =>
  [101, 103, 204, 205, 304].includes(status);
