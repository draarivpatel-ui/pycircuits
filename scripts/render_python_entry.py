#!/usr/bin/env python3
from __future__ import annotations

import json
import runpy
import sys
from pathlib import Path
from typing import Any


def _resolve_render_subject(namespace: dict[str, Any]) -> tuple[Any, str]:
    for function_name in ("main", "build"):
        candidate = namespace.get(function_name)
        if callable(candidate):
            rendered = candidate()
            if rendered is not None:
                return rendered, f"{function_name}()"

    for symbol_name in ("circuit", "app", "root"):
        candidate = namespace.get(symbol_name)
        if candidate is not None:
            return candidate, symbol_name

    raise RuntimeError(
        "Could not find a renderable symbol. Define circuit = ..., app = ..., root = ..., or a main()/build() function."
    )


def main() -> int:
    if len(sys.argv) != 5:
        raise SystemExit(
            "Usage: render_python_entry.py <generated_python_dir> <project_dir> <entry_file> <output_json>"
        )

    generated_python_dir = Path(sys.argv[1]).resolve()
    project_dir = Path(sys.argv[2]).resolve()
    entry_file = Path(sys.argv[3]).resolve()
    output_json = Path(sys.argv[4]).resolve()

    if not generated_python_dir.exists():
        raise RuntimeError(
            f"Generated Python library not found: {generated_python_dir}. Run 'pycircuits generate' (or 'bun run generate' in this repo) first."
        )

    sys.path.insert(0, str(generated_python_dir))
    sys.path.insert(0, str(project_dir))
    sys.path.insert(0, str(entry_file.parent))

    from pycircuits.runtime import render_to_tsx

    namespace = runpy.run_path(str(entry_file), run_name="__pycircuits__")
    render_subject, selected_symbol = _resolve_render_subject(namespace)
    tsx = render_to_tsx(render_subject)

    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(
        json.dumps(
            {
                "selectedSymbol": selected_symbol,
                "tsx": tsx,
            },
            ensure_ascii=True,
            indent=2,
        ),
        encoding="utf-8",
    )

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # pragma: no cover - CLI error surface
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
