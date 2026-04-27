import fs from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { runTscircuitCode } from "@tscircuit/eval";
import type { AnyCircuitElement } from "circuit-json";
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf";
import { convertCircuitJsonToSimple3dSvg } from "circuit-json-to-simple-3d";
import {
  circuitJsonToPcbSvg,
  circuitJsonToSchematicSvg,
} from "circuit-to-svg";

export type BuildTsxArtifactOptions = {
  cadPng?: boolean;
  circuitJson?: boolean;
  gltf?: boolean;
  inputPath: string;
  outputDir: string;
  pcbPng?: boolean;
  pcbSvg?: boolean;
  schematicSvg?: boolean;
};

export type BuildTsxArtifactManifest = {
  artifacts: Partial<
    Record<
      | "cad_png"
      | "circuit_json"
      | "gltf"
      | "pcb_png"
      | "pcb_svg"
      | "schematic_svg",
      string
    >
  >;
  output_dir: string;
};

const writeTextArtifact = async ({
  artifacts,
  key,
  outputDir,
  text,
}: {
  artifacts: BuildTsxArtifactManifest["artifacts"];
  key: keyof BuildTsxArtifactManifest["artifacts"];
  outputDir: string;
  text: string;
}) => {
  const fileName = `${key.replaceAll("_", "-")}.${key === "circuit_json" ? "json" : "svg"}`;
  await fs.writeFile(path.join(outputDir, fileName), text, "utf8");
  artifacts[key] = fileName;
};

const renderPng = (svg: string) => new Resvg(svg).render().asPng();

export async function buildTsxArtifacts({
  cadPng = false,
  circuitJson = true,
  gltf = false,
  inputPath,
  outputDir,
  pcbPng = false,
  pcbSvg = false,
  schematicSvg = false,
}: BuildTsxArtifactOptions): Promise<BuildTsxArtifactManifest> {
  const tsxSource = await fs.readFile(inputPath, "utf8");
  const json = await runTscircuitCode(tsxSource, {
    name: path.basename(inputPath),
  });
  const artifacts: BuildTsxArtifactManifest["artifacts"] = {};

  await fs.mkdir(outputDir, { recursive: true });

  if (circuitJson) {
    await fs.writeFile(
      path.join(outputDir, "circuit.json"),
      JSON.stringify(json, null, 2),
      "utf8",
    );
    artifacts.circuit_json = "circuit.json";
  }

  let cachedPcbSvg: string | null = null;
  const getPcbSvg = () => {
    cachedPcbSvg ??= circuitJsonToPcbSvg(json as AnyCircuitElement[]);
    return cachedPcbSvg;
  };

  if (pcbSvg) {
    await writeTextArtifact({
      artifacts,
      key: "pcb_svg",
      outputDir,
      text: getPcbSvg(),
    });
  }

  if (schematicSvg) {
    await writeTextArtifact({
      artifacts,
      key: "schematic_svg",
      outputDir,
      text: circuitJsonToSchematicSvg(json as AnyCircuitElement[]),
    });
  }

  if (pcbPng) {
    await fs.writeFile(path.join(outputDir, "pcb.png"), renderPng(getPcbSvg()));
    artifacts.pcb_png = "pcb.png";
  }

  if (cadPng) {
    const cadSvg = await convertCircuitJsonToSimple3dSvg(
      json as AnyCircuitElement[],
      {
        anglePreset: "angle1",
        height: 900,
        width: 1200,
      },
    );
    await fs.writeFile(path.join(outputDir, "cad.png"), renderPng(cadSvg));
    artifacts.cad_png = "cad.png";
  }

  if (gltf) {
    const gltfResult = await convertCircuitJsonToGltf(
      json as AnyCircuitElement[],
      {
        format: "gltf",
      },
    );
    const gltfText =
      gltfResult instanceof ArrayBuffer
        ? Buffer.from(gltfResult).toString("utf8")
        : JSON.stringify(gltfResult, null, 2);
    await fs.writeFile(path.join(outputDir, "scene.gltf"), gltfText, "utf8");
    artifacts.gltf = "scene.gltf";
  }

  const manifest = {
    artifacts,
    output_dir: outputDir,
  };
  await fs.writeFile(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );

  return manifest;
}
