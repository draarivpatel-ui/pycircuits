import path from "node:path";
import { buildPythonCircuit } from "./lib/build-python-circuit";
import { generatePythonLibrary } from "./lib/generate-python-library";

const printUsage = () => {
  console.log(`Usage:
  bun run cli build <path>
  bun run cli generate
`);
};

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    printUsage();
    return;
  }

  if (command === "build") {
    const targetPath = args[0] ?? ".";
    const result = await buildPythonCircuit({ inputPath: targetPath });

    console.log(
      `Python entrypoint: ${path.relative(process.cwd(), result.entryFilePath)}`,
    );
    console.log(`Selected symbol: ${result.selectedSymbol}`);
    console.log(
      `Generated TSX: ${path.relative(process.cwd(), result.generatedTsxPath)}`,
    );
    console.log(
      `Circuit JSON: ${path.relative(process.cwd(), result.circuitJsonPath)}`,
    );
    return;
  }

  if (command === "generate") {
    const result = await generatePythonLibrary();
    console.log(
      `Generated ${result.componentCount} Python component wrappers from @tscircuit/props@${result.propsVersion}.`,
    );
    console.log(
      `Python package: ${path.relative(process.cwd(), result.packageDir)}`,
    );
    return;
  }

  printUsage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
