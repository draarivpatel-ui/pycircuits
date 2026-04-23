import { defineConfig, type Options } from "tsup";

const bundledPythonRuntimeOptions: Omit<Options, "entry"> = {
  clean: true,
  dts: false,
  format: ["cjs"],
  noExternal: [/.*/],
  outDir: "dist/pypi/tscircuit-pycircuit/pycircuit/_node",
  outExtension() {
    return {
      js: ".cjs",
    };
  },
  platform: "node",
  sourcemap: false,
  splitting: false,
  target: "node18",
  treeshake: true,
};

export default defineConfig([
  {
    ...bundledPythonRuntimeOptions,
    entry: {
      cli: "src/pypi-cli.ts",
    },
  },
]);
