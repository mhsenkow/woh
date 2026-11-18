declare module 'bitecs/legacy' {
  export const Types: {
    i8: 'i8';
    ui8: 'ui8';
    i16: 'i16';
    ui16: 'ui16';
    i32: 'i32';
    ui32: 'ui32';
    f32: 'f32';
    f64: 'f64';
    eid: 'eid';
  };

  type TypeName = 'i8' | 'ui8' | 'i16' | 'ui16' | 'i32' | 'ui32' | 'f32' | 'f64' | 'eid';

  type ComponentSchema = Record<string, TypeName>;

  type SoAComponent<T extends ComponentSchema> = {
    [K in keyof T]: T[K] extends 'f32' | 'f64'
      ? Float32Array
      : T[K] extends 'i32' | 'ui32' | 'eid'
        ? Uint32Array
        : T[K] extends 'i16' | 'ui16'
          ? Uint16Array
          : Uint8Array;
  };

  export function defineComponent<T extends ComponentSchema>(schema: T): SoAComponent<T>;
  export function defineQuery(components: any[]): (world: any) => number[];
  export function addComponent(world: any, component: any, eid: number): void;
  export function removeComponent(world: any, component: any, eid: number): void;
  export function hasComponent(world: any, component: any, eid: number): boolean;
}
