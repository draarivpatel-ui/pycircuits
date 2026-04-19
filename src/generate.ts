import path from "node:path";
import { generatePythonLibrary } from "./lib/generate-python-library";

async function main() {
  const result = await generatePythonLibrary();

  console.log(
    `Generated ${result.componentCount} Python component wrappers from @tscircuit/props@${result.propsVersion}.`,
  );
  console.log(
    `Python package: ${path.relative(process.cwd(), result.packageDir)}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
