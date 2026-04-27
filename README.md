# pycircuits

`pycircuits` allows you to create real electronics using python, leveraging the powerful [tscircuit kernel](https://tscircuit.com)

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
