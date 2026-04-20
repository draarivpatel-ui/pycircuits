import path from "node:path";
import { buildPythonCircuit } from "./lib/build-python-circuit";
import { generatePythonLibrary } from "./lib/generate-python-library";
import { startPythonDevServer } from "./lib/start-python-dev-server";

const printUsage = () => {
  console.log(`Usage:
  pycircuit build <path>
  pycircuit generate
  pycircuit start [path] [--port <number>]
`);
};

const parseStartArgs = (args: string[]) => {
  let port: number | undefined;
  let targetPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) {
      continue;
    }

    if (argument === "--") {
      continue;
    }

    if (argument.startsWith("--port=")) {
      const parsedPort = Number.parseInt(argument.slice("--port=".length), 10);
      if (Number.isNaN(parsedPort)) {
        throw new Error(`Invalid port: ${argument.slice("--port=".length)}`);
      }
      port = parsedPort;
      continue;
    }

    if (argument === "--port" || argument === "-p") {
      const portValue = args[index + 1];
      if (!portValue) {
        throw new Error(`Missing value for ${argument}`);
      }

      const parsedPort = Number.parseInt(portValue, 10);
      if (Number.isNaN(parsedPort)) {
        throw new Error(`Invalid port: ${portValue}`);
      }

      port = parsedPort;
      index += 1;
      continue;
    }

    if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    if (targetPath) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    targetPath = argument;
  }

  return {
    port,
    targetPath,
  };
};

const waitForStopSignal = () =>
  new Promise<void>((resolve) => {
    const handleSignal = () => {
      process.off("SIGINT", handleSignal);
      process.off("SIGTERM", handleSignal);
      resolve();
    };

    process.on("SIGINT", handleSignal);
    process.on("SIGTERM", handleSignal);
  });

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

  if (command === "start") {
    const { port, targetPath } = parseStartArgs(args);
    const devServer = await startPythonDevServer({
      inputPath: targetPath,
      port,
    });

    await waitForStopSignal();
    await devServer.stop();
    return;
  }

  printUsage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
