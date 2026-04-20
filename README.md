# pycircuit

`pycircuit` bootstraps a Python-facing tscircuit workflow from
`@tscircuit/props`.

The project does three things:

1. `pycircuit generate` reads `@tscircuit/props` and emits a generated Python
   package in `generated/python/pycircuit`.
2. `pycircuit build <path>` runs a `circuit.py` file with that Python package,
   turns the resulting Python object graph into TSX, and feeds the generated TSX
   into `@tscircuit/eval` to produce circuit JSON.
3. `pycircuit start` builds every Python example under `examples/` into
   sibling `*.py.tsx` files, starts a tscircuit dev server rooted at
   `examples/`, and keeps those generated TSX files in sync as the Python files
   change.

## Requirements

- Node.js 18+
- Python 3 available as `python3`
- Bun only if you are developing this repository locally

## Install

```bash
npm install pycircuit
```

For local development in this repository:

```bash
bun install
```

## Generate The Python Library

```bash
npx pycircuit generate
```

In this repository you can also run:

```bash
bun run generate
```

That writes a generated Python package to `generated/python/pycircuit`.

## Build An Example

```bash
npx pycircuit build ./examples/example01-led-circuit
```

This produces:

- `dist/examples/example01-led-circuit/generated.circuit.tsx`
- `dist/examples/example01-led-circuit/circuit.json`

## Start The Dev Server

```bash
npx pycircuit start
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
npx pycircuit start --port 3030
```

## Example Python API

```python
from pycircuit import Circuit, board, led, resistor, trace

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
