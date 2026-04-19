import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { AnyCircuitElement } from "circuit-json";
import { runTscircuitCode } from "@tscircuit/eval";

const DEFAULT_ENTRYPOINTS = ["circuit.py", "index.py"] as const;

const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const findProjectRoot = async (startPath: string) => {
  let currentPath = startPath;

  while (true) {
    const packageJsonPath = path.join(currentPath, "package.json");
    if (await fileExists(packageJsonPath)) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      return startPath;
    }

    currentPath = parentPath;
  }
};

const resolvePythonEntrypoint = async ({
  inputPath = ".",
  cwd = process.cwd(),
}: {
  inputPath?: string;
  cwd?: string;
}) => {
  const resolvedInputPath = path.resolve(cwd, inputPath);
  const inputStats = await fs
    .stat(resolvedInputPath)
    .catch(() => null);

  if (!inputStats) {
    throw new Error(`Input path does not exist: ${inputPath}`);
  }

  if (inputStats.isDirectory()) {
    for (const candidate of DEFAULT_ENTRYPOINTS) {
      const candidatePath = path.join(resolvedInputPath, candidate);
      if (await fileExists(candidatePath)) {
        return {
          entryFilePath: candidatePath,
          inputIsDirectory: true,
          inputRootPath: resolvedInputPath,
        };
      }
    }

    throw new Error(
      `No Python circuit entrypoint found in ${inputPath}. Expected one of: ${DEFAULT_ENTRYPOINTS.join(", ")}`,
    );
  }

  return {
    entryFilePath: resolvedInputPath,
    inputIsDirectory: false,
    inputRootPath: resolvedInputPath,
  };
};

const runPythonRenderer = async ({
  entryFilePath,
  projectDir,
}: {
  entryFilePath: string;
  projectDir: string;
}) => {
  const pythonBin = process.env.PYCIRCUIT_PYTHON_BIN || "python3";
  const generatedPythonDir = path.join(projectDir, "generated", "python");
  const rendererScriptPath = path.join(
    projectDir,
    "scripts",
    "render_python_entry.py",
  );
  const tempDirPath = await fs.mkdtemp(path.join(os.tmpdir(), "pycircuit-"));
  const renderOutputPath = path.join(tempDirPath, "render-output.json");

  if (!(await fileExists(generatedPythonDir))) {
    throw new Error(
      'Generated Python library not found. Run "bun run generate" first.',
    );
  }

  const spawnResult = await new Promise<{ code: number | null; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(
        pythonBin,
        [
          rendererScriptPath,
          generatedPythonDir,
          projectDir,
          entryFilePath,
          renderOutputPath,
        ],
        {
          cwd: projectDir,
          stdio: ["ignore", "ignore", "pipe"],
        },
      );

      let stderr = "";

      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.on("error", reject);
      child.on("close", (code: number | null) => resolve({ code, stderr }));
    },
  );

  if (spawnResult.code !== 0) {
    throw new Error(
      spawnResult.stderr.trim() || `Python renderer exited with code ${spawnResult.code}`,
    );
  }

  const renderOutput = JSON.parse(
    await fs.readFile(renderOutputPath, "utf8"),
  ) as { selectedSymbol: string; tsx: string };

  await fs.rm(tempDirPath, { force: true, recursive: true });
  return renderOutput;
};

const getOutputDir = ({
  entryFilePath,
  inputIsDirectory,
  inputRootPath,
  projectDir,
}: {
  entryFilePath: string;
  inputIsDirectory: boolean;
  inputRootPath: string;
  projectDir: string;
}) => {
  const basePath = inputIsDirectory
    ? inputRootPath
    : entryFilePath.replace(/\.py$/, "");
  const relativeBasePath = path.relative(projectDir, basePath) || "circuit";
  return path.join(projectDir, "dist", relativeBasePath);
};

export type BuildPythonCircuitResult = {
  circuitJson: AnyCircuitElement[];
  circuitJsonPath: string;
  entryFilePath: string;
  generatedTsxPath: string;
  outputDir: string;
  projectDir: string;
  selectedSymbol: string;
  tsxSource: string;
};

export async function buildPythonCircuit({
  inputPath = ".",
  cwd = process.cwd(),
}: {
  inputPath?: string;
  cwd?: string;
} = {}): Promise<BuildPythonCircuitResult> {
  const { entryFilePath, inputIsDirectory, inputRootPath } =
    await resolvePythonEntrypoint({ cwd, inputPath });
  const projectDir = await findProjectRoot(path.dirname(entryFilePath));
  const { selectedSymbol, tsx } = await runPythonRenderer({
    entryFilePath,
    projectDir,
  });
  const circuitJson = await runTscircuitCode(tsx, {
    name: path.basename(entryFilePath),
  });
  const outputDir = getOutputDir({
    entryFilePath,
    inputIsDirectory,
    inputRootPath,
    projectDir,
  });
  const generatedTsxPath = path.join(outputDir, "generated.circuit.tsx");
  const circuitJsonPath = path.join(outputDir, "circuit.json");

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(generatedTsxPath, tsx, "utf8");
  await fs.writeFile(circuitJsonPath, JSON.stringify(circuitJson, null, 2));

  return {
    circuitJson,
    circuitJsonPath,
    entryFilePath,
    generatedTsxPath,
    outputDir,
    projectDir,
    selectedSymbol,
    tsxSource: tsx,
  };
}
