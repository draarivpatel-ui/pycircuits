from pycircuits import Circuit, board, led, resistor, trace

led1 = led(name="LED1", color="red", footprint="0603", pcbY=4)
r1 = resistor(name="R1", resistance="1k", footprint="0603", pcbY=-4)

circuit = Circuit(
    board(
        width="50mm",
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
