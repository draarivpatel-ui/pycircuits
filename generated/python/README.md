# pycircuits

Generated Python bindings for tscircuit components from `@tscircuit/props@0.0.506`.

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

Build artifacts through the tscircuit JavaScript toolchain:

```python
result = circuit.build(pcb_svg=True, pcb_png=True, schematic_svg=True, gltf=True)

print(result.circuit_json)
print(result.pcb_svg)
```

`Circuit.build()` requires the `pycircuits` npm CLI. Install it globally with
`npm install -g pycircuits`, or pass a custom builder command:

```python
result = circuit.build(builder=["pycircuits"])
```
