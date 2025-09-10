export const defaultProject = {
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