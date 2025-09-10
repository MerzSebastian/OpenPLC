import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { bytecodeToString, generateBytecode } from './bytecode-gen';

// test('renders learn react link', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });

test('Input connected to two parallel analog ranges and then to OR gate and then to the output', () => {
  // Test 1: Input connected to two parallel analog ranges and then to OR gate
  const test1 = {
    nodes: [
      { id: 'input1', type: 'inputNode', data: { pin: '16' }, position: { x: 0, y: 0 } },
      { id: 'analog1', type: 'analogRangeNode', data: { min: 0, max: 500 }, position: { x: 0, y: 0 } },
      { id: 'analog2', type: 'analogRangeNode', data: { min: 600, max: 1023 }, position: { x: 0, y: 0 } },
      { id: 'or1', type: 'orNode', data: { inputs: 2 }, position: { x: 0, y: 0 } },
      { id: 'output1', type: 'outputNode', data: { pin: '13' }, position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: 'e2', source: 'input1', target: 'analog2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e1', source: 'input1', target: 'analog1', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'analog1', target: 'or1', sourceHandle: 'out', targetHandle: 'in0' },
      { id: 'e4', source: 'analog2', target: 'or1', sourceHandle: 'out', targetHandle: 'in1' },
      { id: 'e5', source: 'or1', target: 'output1', sourceHandle: 'out', targetHandle: 'in' },
    ],
    board: 'arduino_nano'
  };

  const expectedBytecode = "1,16,2,13,5,16,0,19,0,88,2,255,3,1,19,0,0,0,244,1,2,12,2,2,1,3,4,13,3";

  expect(bytecodeToString(generateBytecode(test1 as any))).toEqual(expectedBytecode);
});
test('Input connected to two parallel analog ranges directly to output (no OR)', () => {
  // Test 2: Input connected to two parallel analog ranges directly to output (no OR)
  const test2 = {
    nodes: [
      { id: 'input1', type: 'inputNode', data: { pin: '16' }, position: { x: 0, y: 0 } },
      { id: 'analog1', type: 'analogRangeNode', data: { min: 0, max: 500 }, position: { x: 0, y: 0 } },
      { id: 'analog2', type: 'analogRangeNode', data: { min: 600, max: 1023 }, position: { x: 0, y: 0 } },
      { id: 'output1', type: 'outputNode', data: { pin: '13' }, position: { x: 0, y: 0 } },
    ],
    edges: [
      { id: 'e2', source: 'input1', target: 'analog2', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e1', source: 'input1', target: 'analog1', sourceHandle: 'out', targetHandle: 'in' },
      { id: 'e3', source: 'analog1', target: 'output1', sourceHandle: 'out', targetHandle: 'in0' },
      { id: 'e4', source: 'analog2', target: 'output1', sourceHandle: 'out', targetHandle: 'in1' },
    ],
    board: 'arduino_nano'
  };

  const expectedBytecode = "1,16,2,13,5,16,0,19,0,88,2,255,3,1,19,0,0,0,244,1,2,12,2,2,1,3,4,13,3";

  expect(bytecodeToString(generateBytecode(test2 as any))).toEqual(expectedBytecode);
});


test('larger project with OR to connect two buttons', () => {
  const test = {
  "nodes": [
    {
      "id": "dndnode_0",
      "type": "orNode",
      "position": {
        "x": 241.241969952952,
        "y": 216.73858248031
      },
      "data": {
        "label": "orNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano"
      },
      "width": 112,
      "height": 60,
      "selected": false,
      "positionAbsolute": {
        "x": 241.241969952952,
        "y": 216.73858248031
      },
      "dragging": false
    },
    {
      "id": "dndnode_1",
      "type": "inputNode",
      "position": {
        "x": 99.0525726762845,
        "y": 120.38101845944
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "2"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 99.0525726762845,
        "y": 120.38101845944
      },
      "dragging": false
    },
    {
      "id": "dndnode_2",
      "type": "outputNode",
      "position": {
        "x": 583.847337035519,
        "y": 260.636051960996
      },
      "data": {
        "label": "outputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "8"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 583.847337035519,
        "y": 260.636051960996
      },
      "dragging": false
    },
    {
      "id": "dndnode_3",
      "type": "inputNode",
      "position": {
        "x": 99.4330577928179,
        "y": 186.453426300785
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "3"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 99.4330577928179,
        "y": 186.453426300785
      },
      "dragging": false
    },
    {
      "id": "dndnode_4",
      "type": "inputNode",
      "position": {
        "x": 99.1067031003101,
        "y": 251.878940946015
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "4"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 99.1067031003101,
        "y": 251.878940946015
      },
      "dragging": false
    },
    {
      "id": "dndnode_5",
      "type": "inputNode",
      "position": {
        "x": 98.912141723119,
        "y": 316.686258832949
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "5"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 98.912141723119,
        "y": 316.686258832949
      },
      "dragging": false
    },
    {
      "id": "dndnode_6",
      "type": "inputNode",
      "position": {
        "x": 98.0021028990381,
        "y": 383.119092990855
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "6"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 98.0021028990381,
        "y": 383.119092990855
      },
      "dragging": false
    },
    {
      "id": "dndnode_8",
      "type": "notNode",
      "position": {
        "x": 259.629661527553,
        "y": 143.97344363477
      },
      "data": {
        "label": "notNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano"
      },
      "width": 80,
      "height": 48,
      "selected": false,
      "positionAbsolute": {
        "x": 259.629661527553,
        "y": 143.97344363477
      },
      "dragging": false
    },
    {
      "id": "dndnode_12",
      "type": "andNode",
      "position": {
        "x": 446.273766755506,
        "y": 259.353231519314
      },
      "data": {
        "label": "andNode",
        "inputs": 4,
        "selectedBoard": "arduino_nano"
      },
      "width": 112,
      "height": 65,
      "selected": false,
      "dragging": false,
      "positionAbsolute": {
        "x": 446.273766755506,
        "y": 259.353231519314
      }
    },
    {
      "id": "dndnode_13",
      "type": "toggleNode",
      "position": {
        "x": 240.352027954439,
        "y": 319.013558181499
      },
      "data": {
        "label": "toggleNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano"
      },
      "width": 112,
      "height": 60,
      "selected": false,
      "positionAbsolute": {
        "x": 240.352027954439,
        "y": 319.013558181499
      },
      "dragging": false
    },
    {
      "id": "dndnode_14",
      "type": "latchNode",
      "position": {
        "x": 240.352027954439,
        "y": 413.701592373082
      },
      "data": {
        "label": "latchNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano"
      },
      "width": 112,
      "height": 88,
      "selected": false,
      "positionAbsolute": {
        "x": 240.352027954439,
        "y": 413.701592373082
      },
      "dragging": false
    },
    {
      "id": "dndnode_15",
      "type": "inputNode",
      "position": {
        "x": 97.8163169107269,
        "y": 447.95045580408
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "7"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 97.8163169107269,
        "y": 447.95045580408
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "dndnode_1",
      "sourceHandle": "out",
      "target": "dndnode_8",
      "targetHandle": "in",
      "id": "reactflow__edge-dndnode_1out-dndnode_8in"
    },
    {
      "source": "dndnode_3",
      "sourceHandle": "out",
      "target": "dndnode_0",
      "targetHandle": "in0",
      "id": "reactflow__edge-dndnode_3out-dndnode_0in0"
    },
    {
      "source": "dndnode_4",
      "sourceHandle": "out",
      "target": "dndnode_0",
      "targetHandle": "in1",
      "id": "reactflow__edge-dndnode_4out-dndnode_0in1"
    },
    {
      "source": "dndnode_8",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in0",
      "id": "reactflow__edge-dndnode_8out-dndnode_12in0"
    },
    {
      "source": "dndnode_0",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in1",
      "id": "reactflow__edge-dndnode_0out-dndnode_12in1"
    },
    {
      "source": "dndnode_12",
      "sourceHandle": "out",
      "target": "dndnode_2",
      "targetHandle": "in",
      "id": "reactflow__edge-dndnode_12out-dndnode_2in"
    },
    {
      "source": "dndnode_5",
      "sourceHandle": "out",
      "target": "dndnode_13",
      "targetHandle": "in",
      "id": "reactflow__edge-dndnode_5out-dndnode_13in"
    },
    {
      "source": "dndnode_13",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in2",
      "id": "reactflow__edge-dndnode_13out-dndnode_12in2"
    },
    {
      "source": "dndnode_6",
      "sourceHandle": "out",
      "target": "dndnode_14",
      "targetHandle": "set",
      "id": "reactflow__edge-dndnode_6out-dndnode_14set"
    },
    {
      "source": "dndnode_15",
      "sourceHandle": "out",
      "target": "dndnode_14",
      "targetHandle": "reset",
      "id": "reactflow__edge-dndnode_15out-dndnode_14reset"
    },
    {
      "source": "dndnode_14",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in3",
      "id": "reactflow__edge-dndnode_14out-dndnode_12in3"
    }
  ],
  "board": "arduino_nano"
};

  const expectedBytecode = "1,2,2,8,1,3,1,4,1,5,1,6,1,7,3,2,0,3,3,1,3,4,2,3,5,3,3,6,4,3,7,5,10,0,6,12,2,1,2,7,18,3,8,0,16,4,5,9,0,11,4,6,7,8,9,10,4,8,10";

  expect(bytecodeToString(generateBytecode(test as any))).toEqual(expectedBytecode);
});
test('larger project without OR. connecting two buttons to same input', () => {
  const test = {
  "nodes": [
    {
      "id": "dndnode_1",
      "type": "inputNode",
      "position": {
        "x": 99.0525726762845,
        "y": 120.38101845944
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "2"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 99.0525726762845,
        "y": 120.38101845944
      },
      "dragging": false
    },
    {
      "id": "dndnode_2",
      "type": "outputNode",
      "position": {
        "x": 583.847337035519,
        "y": 260.636051960996
      },
      "data": {
        "label": "outputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "8"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 583.847337035519,
        "y": 260.636051960996
      },
      "dragging": false
    },
    {
      "id": "dndnode_3",
      "type": "inputNode",
      "position": {
        "x": 99.4330577928179,
        "y": 186.453426300785
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "3"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 99.4330577928179,
        "y": 186.453426300785
      },
      "dragging": false
    },
    {
      "id": "dndnode_4",
      "type": "inputNode",
      "position": {
        "x": 99.1067031003101,
        "y": 251.878940946015
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "4"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 99.1067031003101,
        "y": 251.878940946015
      },
      "dragging": false
    },
    {
      "id": "dndnode_5",
      "type": "inputNode",
      "position": {
        "x": 98.912141723119,
        "y": 316.686258832949
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "5"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 98.912141723119,
        "y": 316.686258832949
      },
      "dragging": false
    },
    {
      "id": "dndnode_6",
      "type": "inputNode",
      "position": {
        "x": 98.0021028990381,
        "y": 383.119092990855
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "6"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 98.0021028990381,
        "y": 383.119092990855
      },
      "dragging": false
    },
    {
      "id": "dndnode_8",
      "type": "notNode",
      "position": {
        "x": 259.629661527553,
        "y": 143.97344363477
      },
      "data": {
        "label": "notNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano"
      },
      "width": 80,
      "height": 48,
      "selected": false,
      "positionAbsolute": {
        "x": 259.629661527553,
        "y": 143.97344363477
      },
      "dragging": false
    },
    {
      "id": "dndnode_12",
      "type": "andNode",
      "position": {
        "x": 446.273766755506,
        "y": 259.353231519314
      },
      "data": {
        "label": "andNode",
        "inputs": 4,
        "selectedBoard": "arduino_nano"
      },
      "width": 112,
      "height": 65,
      "selected": false,
      "dragging": false,
      "positionAbsolute": {
        "x": 446.273766755506,
        "y": 259.353231519314
      }
    },
    {
      "id": "dndnode_13",
      "type": "toggleNode",
      "position": {
        "x": 240.352027954439,
        "y": 319.013558181499
      },
      "data": {
        "label": "toggleNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano"
      },
      "width": 112,
      "height": 60,
      "selected": false,
      "positionAbsolute": {
        "x": 240.352027954439,
        "y": 319.013558181499
      },
      "dragging": false
    },
    {
      "id": "dndnode_14",
      "type": "latchNode",
      "position": {
        "x": 240.352027954439,
        "y": 413.701592373082
      },
      "data": {
        "label": "latchNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano"
      },
      "width": 112,
      "height": 88,
      "selected": false,
      "positionAbsolute": {
        "x": 240.352027954439,
        "y": 413.701592373082
      },
      "dragging": false
    },
    {
      "id": "dndnode_15",
      "type": "inputNode",
      "position": {
        "x": 97.8163169107269,
        "y": 447.95045580408
      },
      "data": {
        "label": "inputNode",
        "inputs": 2,
        "selectedBoard": "arduino_nano",
        "pin": "7"
      },
      "width": 97,
      "height": 59,
      "selected": false,
      "positionAbsolute": {
        "x": 97.8163169107269,
        "y": 447.95045580408
      },
      "dragging": false
    }
  ],
  "edges": [
    {
      "source": "dndnode_1",
      "sourceHandle": "out",
      "target": "dndnode_8",
      "targetHandle": "in",
      "id": "reactflow__edge-dndnode_1out-dndnode_8in"
    },
    {
      "source": "dndnode_8",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in0",
      "id": "reactflow__edge-dndnode_8out-dndnode_12in0"
    },
    {
      "source": "dndnode_12",
      "sourceHandle": "out",
      "target": "dndnode_2",
      "targetHandle": "in",
      "id": "reactflow__edge-dndnode_12out-dndnode_2in"
    },
    {
      "source": "dndnode_5",
      "sourceHandle": "out",
      "target": "dndnode_13",
      "targetHandle": "in",
      "id": "reactflow__edge-dndnode_5out-dndnode_13in"
    },
    {
      "source": "dndnode_13",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in2",
      "id": "reactflow__edge-dndnode_13out-dndnode_12in2"
    },
    {
      "source": "dndnode_6",
      "sourceHandle": "out",
      "target": "dndnode_14",
      "targetHandle": "set",
      "id": "reactflow__edge-dndnode_6out-dndnode_14set"
    },
    {
      "source": "dndnode_15",
      "sourceHandle": "out",
      "target": "dndnode_14",
      "targetHandle": "reset",
      "id": "reactflow__edge-dndnode_15out-dndnode_14reset"
    },
    {
      "source": "dndnode_14",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in3",
      "id": "reactflow__edge-dndnode_14out-dndnode_12in3"
    },
    {
      "source": "dndnode_3",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in1",
      "id": "reactflow__edge-dndnode_3out-dndnode_12in1"
    },
    {
      "source": "dndnode_4",
      "sourceHandle": "out",
      "target": "dndnode_12",
      "targetHandle": "in1",
      "id": "reactflow__edge-dndnode_4out-dndnode_12in1"
    }
  ],
  "board": "arduino_nano"
};
  const expectedBytecode = "1,2,2,8,1,3,1,4,1,5,1,6,1,7,3,2,0,3,3,1,3,4,2,3,5,3,3,6,4,3,7,5,10,0,6,12,2,1,2,7,18,3,8,0,16,4,5,9,0,11,4,6,8,9,7,10,4,8,10";
  //const expectedBytecode = "1,2,2,8,1,3,1,4,1,5,1,6,1,7,3,2,0,3,3,1,3,4,2,3,5,3,3,6,4,3,7,5,10,0,6,12,2,1,2,7,18,3,8,0,16,4,5,9,0,11,4,6,7,8,9,10,4,8,10";

  expect(bytecodeToString(generateBytecode(test as any))).toEqual(expectedBytecode);
});
