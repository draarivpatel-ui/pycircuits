import fs from "node:fs/promises";
import path from "node:path";
import { discoverPropComponents, getPropsPackageJsonPath } from "./lib/discover-props-components";
import { renderPythonDistributionFiles } from "./lib/python-template";

const DEFAULT_DISTRIBUTION_NAME = "tscircuit-pycircuit";
const DEFAULT_IMPORT_PACKAGE_NAME = "pycircuit";
const DEFAULT_OUTPUT_DIR = path.join(
  process.cwd(),
  "dist",
  "pypi",
  DEFAULT_DISTRIBUTION_NAME,
);

type PackageJson = {
  version?: string;
};

type PropsPackageJson = {
  version?: string;
};

async function main() {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "package.json"), "utf8"),
  ) as PackageJson;
  const propsPackageJson = JSON.parse(
    await fs.readFile(getPropsPackageJsonPath(), "utf8"),
  ) as PropsPackageJson;
  const packageVersion = packageJson.version ?? "0.1.0";
  const propsVersion = propsPackageJson.version ?? "unknown";
  const outputDir = DEFAULT_OUTPUT_DIR;
  const importPackageName = DEFAULT_IMPORT_PACKAGE_NAME;
  const components = await discoverPropComponents();
  const files = renderPythonDistributionFiles({
    components,
    distributionName: DEFAULT_DISTRIBUTION_NAME,
    importPackageName,
    packageVersion,
    propsVersion,
  });
  const bundledCliPath = path.join(outputDir, importPackageName, "_node", "cli.cjs");

  await fs.mkdir(outputDir, { recursive: true });

  for (const [relativeFilePath, fileContent] of Object.entries(files)) {
    const absoluteFilePath = path.join(outputDir, relativeFilePath);
    await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
    await fs.writeFile(absoluteFilePath, fileContent, "utf8");
  }

  await fs.copyFile(
    path.join(process.cwd(), "LICENSE"),
    path.join(outputDir, "LICENSE"),
  );

  try {
    await fs.access(bundledCliPath);
  } catch {
    throw new Error(
      `Bundled PyPI CLI not found at ${path.relative(process.cwd(), bundledCliPath)}. Run the PyPI tsup build first.`,
    );
  }

  console.log(
    `Generated PyPI source package in ${path.relative(process.cwd(), outputDir)}.`,
  );
  console.log(
    `Bundled Node runtime: ${path.relative(process.cwd(), bundledCliPath)}`,
  );
  console.log(
    `Python distribution name: ${DEFAULT_DISTRIBUTION_NAME}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
