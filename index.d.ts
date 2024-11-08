declare module 'json-merge-patcher' {
  export type JmpValue = Object | Array | string | number | boolean | null;

  export function apply(target: JmpValue, patch: JmpValue): JmpValue;
  export function merge(patch1: JmpValue, patch2: JmpValue): JmpValue;
  export function generate(before: JmpValue, after: JmpValue): JmpValue;
}
