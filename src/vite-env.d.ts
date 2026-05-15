/// <reference types="vite/client" />

declare module "three" {
  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y: number): this;
    copy(vector: Vector2): this;
    clone(): Vector2;
    sub(vector: Vector2): this;
    add(vector: Vector2): this;
    addScaledVector(vector: Vector2, scale: number): this;
    multiplyScalar(scale: number): this;
    length(): number;
    setLength(length: number): this;
    lerp(vector: Vector2, alpha: number): this;
    dot(vector: Vector2): number;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    copy(vector: Vector3): this;
  }

  export class Color {
    constructor(color?: string | number);
    copy(color: Color): this;
    convertSRGBToLinear(): this;
  }

  export class Clock {
    getElapsedTime(): number;
  }

  export class Scene {
    add(object: unknown): void;
  }

  export class OrthographicCamera {
    constructor(left: number, right: number, top: number, bottom: number, near?: number, far?: number);
    position: {
      z: number;
    };
  }

  export class BufferGeometry {
    dispose(): void;
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number);
  }

  export class ShaderMaterial {
    constructor(parameters?: Record<string, unknown>);
    uniforms: Record<string, { value: any }>;
    dispose(): void;
  }

  export class Mesh {
    constructor(geometry?: BufferGeometry, material?: ShaderMaterial);
    geometry: BufferGeometry;
  }

  export class WebGLRenderer {
    constructor(parameters?: Record<string, unknown>);
    domElement: HTMLCanvasElement;
    autoClear: boolean;
    outputColorSpace: unknown;
    toneMapping: unknown;
    setPixelRatio(pixelRatio: number): void;
    getPixelRatio(): number;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setClearColor(color: string | number, alpha?: number): void;
    clear(color?: boolean, depth?: boolean, stencil?: boolean): void;
    render(scene: Scene, camera: OrthographicCamera): void;
    dispose(): void;
    forceContextLoss(): void;
  }

  export const SRGBColorSpace: unknown;
  export const NoToneMapping: unknown;

  export const MathUtils: {
    clamp(value: number, min: number, max: number): number;
    lerp(x: number, y: number, t: number): number;
    degToRad(degrees: number): number;
  };
}
