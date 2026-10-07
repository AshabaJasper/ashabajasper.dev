/**
 * Output shapes and parameter counts for the handwriting CNN described in
 * content/posts/handwritten-letter-recognition-cnn-opencv.mdx. Pure, so the
 * layer diagram is computed from the model definition instead of typed by
 * hand, and a test pins the numbers.
 */

export type LayerSpec =
  | { kind: "input"; size: number; channels: number }
  | { kind: "conv"; filters: number; kernel: number; padding: "valid" | "same" }
  | { kind: "pool"; size: number; stride: number }
  | { kind: "flatten" }
  | { kind: "dense"; units: number; activation: string };

export interface LayerShape {
  kind: LayerSpec["kind"];
  name: string;
  /** Spatial side for image-shaped outputs, null once flattened. */
  side: number | null;
  /** Channels for image-shaped outputs, units for vectors. */
  depth: number;
  shape: string;
  params: number;
}

/** The model in the post, layer for layer. */
export const HANDWRITING_CNN: readonly LayerSpec[] = [
  { kind: "input", size: 28, channels: 1 },
  { kind: "conv", filters: 32, kernel: 3, padding: "valid" },
  { kind: "pool", size: 2, stride: 2 },
  { kind: "conv", filters: 64, kernel: 3, padding: "same" },
  { kind: "pool", size: 2, stride: 2 },
  { kind: "conv", filters: 128, kernel: 3, padding: "valid" },
  { kind: "pool", size: 2, stride: 2 },
  { kind: "flatten" },
  { kind: "dense", units: 64, activation: "relu" },
  { kind: "dense", units: 128, activation: "relu" },
  { kind: "dense", units: 26, activation: "softmax" },
];

export function layerShapes(specs: readonly LayerSpec[]): LayerShape[] {
  const out: LayerShape[] = [];
  let side = 0;
  let depth = 0;
  for (const spec of specs) {
    switch (spec.kind) {
      case "input":
        side = spec.size;
        depth = spec.channels;
        out.push({ kind: "input", name: "Input", side, depth, shape: `${side}×${side}×${depth}`, params: 0 });
        break;
      case "conv": {
        const params = spec.kernel * spec.kernel * depth * spec.filters + spec.filters;
        side = spec.padding === "same" ? side : side - spec.kernel + 1;
        depth = spec.filters;
        out.push({ kind: "conv", name: `Conv ${spec.filters}`, side, depth, shape: `${side}×${side}×${depth}`, params });
        break;
      }
      case "pool":
        side = Math.floor((side - spec.size) / spec.stride) + 1;
        out.push({ kind: "pool", name: "Max pool", side, depth, shape: `${side}×${side}×${depth}`, params: 0 });
        break;
      case "flatten":
        depth = side * side * depth;
        out.push({ kind: "flatten", name: "Flatten", side: null, depth, shape: String(depth), params: 0 });
        break;
      case "dense": {
        const params = depth * spec.units + spec.units;
        depth = spec.units;
        out.push({
          kind: "dense",
          name: spec.activation === "softmax" ? `Softmax ${spec.units}` : `Dense ${spec.units}`,
          side: null,
          depth,
          shape: String(depth),
          params,
        });
        break;
      }
    }
  }
  return out;
}

export function totalParams(shapes: readonly LayerShape[]): number {
  return shapes.reduce((sum, layer) => sum + layer.params, 0);
}
