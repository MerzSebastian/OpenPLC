# OpenPLC Web Editor

A visual programming interface for Arduino controllers built with React and React Flow. This project allows users to create logic circuits using a block-based interface and generates optimized bytecode for Arduino microcontrollers.

**Live Demo**: https://merzsebastian.github.io/OpenPLC/

**License**: CC BY-NC 4.0

## Current Status

Weekend project with occasional updates. This is my first React project, so best practices may not always be followed.

## Features

- Drag-and-drop block interface for Arduino programming
- Support for digital I/O blocks with Arduino pin mapping
- Logic gates (AND, OR, NOT, NAND, NOR, XOR) with configurable inputs
- SR Latch block with configurable initial state
- Pulse generator with adjustable timing
- Toggle block for edge-triggered toggling
- Project save/load functionality
- Bytecode generation optimized for Arduino
- WebSerial integration for direct programming of Arduino devices
- EEPROM storage on Arduino for program persistence

## Quick Start Guide

### Using the Web Interface

1. **Add components**: Drag blocks from the left sidebar to the canvas
2. **Configure components**: Click on components to set Arduino pins and parameters
3. **Connect components**: Drag from output handles to input handles
4. **Generate and deploy code**:
   - Click **"Copy for Wokwi"** to get code for simulation (paste into Wokwi)
   - Click **"Upload via WebSerial"** to send directly to Arduino hardware

### For Physical Arduino Hardware

1. **Load the Arduino code**:
   - Copy the custom Arduino code from this project via the "Copy Arduino Code" button
   - Paste it into the Arduino IDE
   - Upload it to your Arduino board

2. **Upload your logic**:
   - Design your circuit in the web interface
   - Click "Upload via WebSerial"
   - Select your Arduino when prompted by the browser
   - The program will upload and run automatically

### For Wokwi Simulation

1. **Design your circuit** in the web interface
2. Click **"Copy for Wokwi"** to generate the bytecode
3. In Wokwi, paste the bytecode into the Arduino code section
4. Add `#define WOKWI` at the top of your Wokwi sketch
5. Run the simulation to test your logic

## Arduino Code Integration

This project includes custom Arduino code that implements:
- Bytecode interpreter for efficient execution
- WebSerial communication protocol
- EEPROM storage for program persistence
- Support for all logic operations and timers

The Arduino code is specifically optimized for:
- Arduino Nano 328P (tested platform)
- Efficient execution with minimal memory footprint
- Persistent storage across power cycles

## Bytecode Structure

The system uses a compact bytecode format optimized for Arduino:

```
[START_BYTE][LENGTH][DATA...][CHECKSUM]
```

- **START_BYTE**: 0x7E (marks message beginning)
- **LENGTH**: Number of bytes in DATA section
- **DATA**: Optimized bytecode instructions
- **CHECKSUM**: Sum of DATA bytes modulo 256 for verification

## Opcode Reference

| Opcode | Instruction | Parameters | Description |
|--------|-------------|------------|-------------|
| 1 | SET_PIN_MODE_INPUT | pin | Set Arduino pin as input |
| 2 | SET_PIN_MODE_OUTPUT | pin | Set Arduino pin as output |
| 3 | READ_PIN | pin, var_index | Read digital pin to variable |
| 4 | WRITE_PIN | pin, var_index | Write variable to digital pin |
| 5 | READ_ANALOG_PIN | pin, var_index | Read analog pin to variable |
| 6 | WRITE_ANALOG_PIN | pin, var_index | Write variable to analog pin (PWM) |
| 10 | NOT | input_var, output_var | Logical NOT operation |
| 11 | AND | num_inputs, inputs..., output_var | Logical AND operation |
| 12 | OR | num_inputs, inputs..., output_var | Logical OR operation |
| 13 | NAND | num_inputs, inputs..., output_var | Logical NAND operation |
| 14 | NOR | num_inputs, inputs..., output_var | Logical NOR operation |
| 15 | XOR | num_inputs, inputs..., output_var | Logical XOR operation |
| 16 | LATCH | set_var, reset_var, output_var, initial_state | SR Latch implementation |
| 17 | PULSE | output_var, pulse_ms, interval_ms | Pulse generator |
| 18 | TOGGLE | input_var, output_var, initial_state | Toggle on rising edge |

## Troubleshooting

### WebSerial Issues
- Use Chrome or Edge for best WebSerial support
- Ensure no other serial monitors are connected to the Arduino
- Disconnect components from pins 0 and 1 (RX/TX) during upload
- If upload fails, try manually resetting the Arduino just before uploading

### Program Not Running
- Verify your Arduino has the correct custom code uploaded
- Check that the EEPROM signature is valid
- Ensure you're not using the serial port for debugging while running

## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

#### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

#### `npm test`
Launches the test runner in interactive watch mode

#### `npm run build`
Builds the app for production to the `build` folder

#### `npm run eject`
**Note: this is a one-way operation.** Ejects from Create React App

## Future Plans

- Support for more Arduino board types
- Expanded library of logic blocks
- Real-time serial monitoring
- Enhanced simulation capabilities

## Learn More

- [React Documentation](https://reactjs.org/)
- [WebSerial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Arduino Reference](https://www.arduino.cc/reference/en/)
- [Wokwi Simulator](https://wokwi.com/)