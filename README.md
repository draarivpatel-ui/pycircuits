# pycircuit

`pycircuit` bootstraps a Python-facing tscircuit workflow from
`@tscircuit/props`.

The repo does two things:

1. `bun run generate` reads `@tscircuit/props` and emits a generated Python
   package in `generated/python/pycircuit`.
2. `bun run cli build <path>` runs a `circuit.py` file with that Python package,
   turns the resulting Python object graph into TSX, and feeds the generated TSX
   into `@tscircuit/eval` to produce circuit JSON.

## Requirements

- Bun
- Python 3 available as `python3`

## Install

```bash
bun install
```

## Generate The Python Library

```bash
bun run generate
```

That writes a generated Python package to `generated/python/pycircuit`.

## Build An Example

```bash
bun run cli build ./examples/example01-led-circuit
```

This produces:

- `dist/examples/example01-led-circuit/generated.circuit.tsx`
- `dist/examples/example01-led-circuit/circuit.json`

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
