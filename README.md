# pycircuits

`pycircuits` bootstraps a Python-facing tscircuit workflow from
`@tscircuit/props`.

The project does three things:

1. `pycircuits generate` reads `@tscircuit/props` and emits a generated Python
   package in `generated/python/pycircuits`.
2. `pycircuits build <path>` runs a `circuit.py` file with that Python package,
   turns the resulting Python object graph into TSX, and feeds the generated TSX
   into `@tscircuit/eval` to produce circuit JSON.
3. `pycircuits start` builds every Python example under `examples/` into
   sibling `*.py.tsx` files, starts a tscircuit dev server rooted at
   `examples/`, and keeps those generated TSX files in sync as the Python files
   change.

## Requirements

- Node.js 18+
- Python 3 available as `python3`
- Bun only if you are developing this repository locally

## Install

```bash
npm install pycircuits
```

For local development in this repository:

```bash
bun install
```

## Generate The Python Library

```bash
npx pycircuits generate
```

In this repository you can also run:

```bash
bun run generate
```

That writes a generated Python package to `generated/python/pycircuits`.

## Build An Example

```bash
npx pycircuits build ./examples/example01-led-circuit
```

This produces:

- `dist/examples/example01-led-circuit/generated.circuit.tsx`
- `dist/examples/example01-led-circuit/circuit.json`

## Build From Python

`Circuit.build()` renders the Python circuit through the tscircuit JavaScript
toolchain and returns a `BuildResult`.

```python
result = circuit.build(
    pcb_svg=True,
    pcb_png=True,
    schematic_svg=True,
    gltf=True,
)

print(result.circuit_json)
print(result.pcb_svg)
```

By default, build artifacts are read back into memory and temporary files are
removed. Pass `out_dir="dist/board"` to keep files on disk:

```python
result = circuit.build(pcb_svg=True, out_dir="dist/board")
print(result.artifact_paths["pcb_svg"])
```

The Python build API requires the `pycircuits` npm CLI to be available. Install it
globally with `npm install -g pycircuits`, or pass a custom command:

```python
circuit.build(builder=["bun", "run", "src/cli.ts"])
```

## Start The Dev Server

```bash
npx pycircuits start
```

This will:

- generate the Python bindings automatically if they do not exist yet
- write `circuit.py.tsx` next to each Python example entrypoint
- start the tscircuit dev server with `examples/` as the project root
- rebuild those generated TSX files whenever `examples/**/*.py` changes

The tscircuit file picker will then show paths like:

- `example01-led-circuit/circuit.py.tsx`

You can also choose a different port:

```bash
npx pycircuits start --port 3030
```

## Example Python API

```python
from pycircuits import Circuit, board, led, resistor, trace

led1 = led(name="LED1", color="red", footprint="0603", pcbY=4)
r1 = resistor(name="R1", resistance="1k", footprint="0603", pcbY=-4)

circuit = Circuit(
    board(
        width="12mm",
        height="20mm",
        children=[
            led1,
            r1,
            trace(from_=r1.pin2, to=led1.anode),
            trace(from_=r1.pin1, to="net.VCC"),
            trace(from_=led1.cathode, to="net.GND"),
        ],
    )
)
```

Use trailing underscores for reserved Python keywords such as `from_`; the
generated runtime maps them back to the original tscircuit prop names.

Both child styles are supported:

- `board(child1, child2, width="10mm")`
- `board(width="10mm", children=[child1, child2])`
