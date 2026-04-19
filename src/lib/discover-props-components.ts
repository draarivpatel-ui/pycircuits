import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

export type PropComponent = {
  sourceName: string;
  sourcePath: string;
  tagName: string;
};

const COMPONENT_EXPORT_REGEX = /export \* from "\.\/components\/([a-z0-9-]+)"/g;

export const getPropsPackageJsonPath = () => {
  const require = createRequire(import.meta.url);
  return require.resolve("@tscircuit/props/package.json");
};

export const getPropsPackageDir = () => path.dirname(getPropsPackageJsonPath());

export async function discoverPropComponents({
  propsPackageDir = getPropsPackageDir(),
}: {
  propsPackageDir?: string;
} = {}): Promise<PropComponent[]> {
  const propsIndexPath = path.join(propsPackageDir, "lib", "index.ts");
  const propsIndexSource = await fs.readFile(propsIndexPath, "utf8");
  const seenTags = new Set<string>();
  const components: PropComponent[] = [];

  for (const match of propsIndexSource.matchAll(COMPONENT_EXPORT_REGEX)) {
    const sourceName = match[1];
    if (!sourceName) continue;

    const tagName = sourceName.replaceAll("-", "");
    if (seenTags.has(tagName)) continue;

    seenTags.add(tagName);
    components.push({
      sourceName,
      sourcePath: `lib/components/${sourceName}.ts`,
      tagName,
    });
  }

  return components.sort((left, right) =>
    left.tagName.localeCompare(right.tagName),
  );
}
