import fs from "node:fs/promises";
import path from "node:path";
import { discoverPropComponents, getPropsPackageJsonPath } from "./discover-props-components";
import { renderPythonLibraryFiles } from "./python-template";

type PropsPackageJson = {
  version?: string;
};

export type GeneratePythonLibraryResult = {
  componentCount: number;
  outputDir: string;
  packageDir: string;
  propsVersion: string;
};

export async function generatePythonLibrary({
  outputDir = path.join(process.cwd(), "generated", "python"),
}: {
  outputDir?: string;
} = {}): Promise<GeneratePythonLibraryResult> {
  const propsPackageJsonPath = getPropsPackageJsonPath();
  const propsPackageJson = JSON.parse(
    await fs.readFile(propsPackageJsonPath, "utf8"),
  ) as PropsPackageJson;
  const propsVersion = propsPackageJson.version ?? "unknown";
  const components = await discoverPropComponents();
  const packageDir = path.join(outputDir, "pycircuit");
  const files = renderPythonLibraryFiles({ components, propsVersion });

  await fs.mkdir(packageDir, { recursive: true });

  for (const [relativeFilePath, fileContent] of Object.entries(files)) {
    const absoluteFilePath = path.resolve(packageDir, relativeFilePath);
    await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
    await fs.writeFile(absoluteFilePath, fileContent, "utf8");
  }

  return {
    componentCount: components.length,
    outputDir,
    packageDir,
    propsVersion,
  };
}
