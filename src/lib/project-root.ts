import fs from "node:fs/promises";
import path from "node:path";

const ROOT_MARKERS = ["package.json", "pyproject.toml", ".git"] as const;

const pathExists = async (targetPath: string) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

export async function findProjectRoot({
  fallbackPath,
  startPath,
}: {
  fallbackPath?: string;
  startPath: string;
}) {
  let currentPath = path.resolve(startPath);

  while (true) {
    for (const marker of ROOT_MARKERS) {
      if (await pathExists(path.join(currentPath, marker))) {
        return currentPath;
      }
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      return path.resolve(fallbackPath ?? startPath);
    }

    currentPath = parentPath;
  }
}
