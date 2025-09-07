import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { downloadJson, uploadJson } from './utils';
import { bytecodeToString, generateBytecode } from './bytecode-gen';

// Improved ID management
let nodeIdCounter = 0;

const getNextId = () => {
  return `dndnode_${nodeIdCounter++}`;
};

const resetIdCounter = (nodes: any[]) => {
  const maxId = nodes.reduce((max, node) => {
    const match = node.id.match(/dndnode_(\d+)/);
    if (match) {
      const idNum = parseInt(match[1], 10);
      return Math.max(max, idNum);
    }
    return max;
  }, -1);

  nodeIdCounter = maxId + 1;
};

// === Node Definitions ===
function LatchNode({ data, id }: any) {
  return (
    <div
      style={{
        width: 120,
        height: 100,
        backgroundColor: '#f97316',
        border: '2px solid #9a3412',
        borderRadius: 6,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'white',
        fontWeight: 'bold',
        position: 'relative',
      }}
    >
      <div>LATCH</div>
      <Handle type="target" position={Position.Left} id="set" style={{ top: '30%', background: '#000' }} />
      <Handle type="target" position={Position.Left} id="reset" style={{ top: '70%', background: '#000' }} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#000' }} />
      
      <div style={{ marginTop: 4, fontSize: '12px' }}>
        Initial:
        <select
          value={data.initialState || 0}
          onChange={(e) => data.onChangeInitialState(id, parseInt(e.target.value))}
          style={{ width: 50, marginLeft: 4 }}
        >
          <option value={0}>LOW</option>
          <option value={1}>HIGH</option>
        </select>
      </div>
    </div>
  );
}

function TimerNode({ data, id }: any) {
  return (
    <div
      style={{
        width: 150,
        height: 120,
        backgroundColor: '#06b6d4',
        border: '2px solid #0e7490',
        borderRadius: 6,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'white',
        fontWeight: 'bold',
        position: 'relative',
      }}
    >
      <div>TIMER</div>
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#000' }} />
      
      <div style={{ marginTop: 4, fontSize: '12px' }}>
        <div>
          Pulse (ms):
          <input
            type="number"
            min="1"
            value={data.pulseLength || 1000}
            onChange={(e) => data.onChangePulseLength(id, parseInt(e.target.value))}
            style={{ width: 60, marginLeft: 4 }}
          />
        </div>
        <div>
          Interval (ms):
          <input
            type="number"
            min="1"
            value={data.interval || 5000}
            onChange={(e) => data.onChangeInterval(id, parseInt(e.target.value))}
            style={{ width: 60, marginLeft: 4 }}
          />
        </div>
      </div>
    </div>
  );
}

function InputNode({ data, id }: any) {
  const pins = [
    ...((boards as any)[data.selectedBoard]?.digital || []),
    ...((boards as any)[data.selectedBoard]?.analog || []),
  ];

  return (
    <div style={{ width: 120, backgroundColor: '#22c55e', border: '2px solid #166534', borderRadius: 6, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', fontWeight: 'bold', position: 'relative' }}>
      <div>INPUT</div>
      <select
        value={data.pin || ''}
        onChange={(e) => data.onChangePin(id, e.target.value)}
        style={{ width: '100%', marginTop: 4 }}
      >
        <option value="">Select Pin</option>
        {pins.map((p: any) => (
          <option key={p.pin} value={p.pin}>
            {p.label}
          </option>
        ))}
      </select>
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#000' }} />
    </div>
  );
}

function OutputNode({ data, id }: any) {
  const pins = [
    ...((boards as any)[data.selectedBoard]?.digital || []),
    ...((boards as any)[data.selectedBoard]?.analog || []),
  ];

  return (
    <div style={{ width: 120, backgroundColor: '#ef4444', border: '2px solid #991b1b', borderRadius: 6, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', fontWeight: 'bold', position: 'relative' }}>
      <div>OUTPUT</div>
      <select
        value={data.pin || ''}
        onChange={(e) => data.onChangePin(id, e.target.value)}
        style={{ width: '100%', marginTop: 4 }}
      >
        <option value="">Select Pin</option>
        {pins.map((p: any) => (
          <option key={p.pin} value={p.pin}>
            {p.label}
          </option>
        ))}
      </select>
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#000' }} />
    </div>
  );
}

function AndNode({ data, id }: any) {
  const { inputs = 2 } = data;
  const handleSpacing = 13;
  const baseHeight = 50;
  const dynamicHeight = baseHeight + (inputs - 3) * handleSpacing;

  return (
    <div
      style={{
        width: 100,
        minHeight: dynamicHeight,
        backgroundColor: '#3b82f6',
        border: '2px solid #1e40af',
        borderRadius: 6,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'white',
        fontWeight: 'bold',
        position: 'relative',
      }}
    >
      <div>AND</div>
      {Array.from({ length: inputs }).map((_, idx) => (
        <Handle
          key={idx}
          type="target"
          position={Position.Left}
          id={`in${idx}`}
          style={{ top: 10 + idx * 15, background: '#000' }}
        />
      ))}
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#000' }} />
      <div style={{ marginTop: 4 }}>
        Inputs:
        <input
          type="number"
          min={2}
          max={8}
          value={inputs}
          onChange={(e) => data.onChangeInputs(id, parseInt(e.target.value))}
          style={{ width: 30, marginLeft: 4 }}
        />
      </div>
    </div>
  );
}

function OrNode({ data, id }: any) {
  const { inputs = 2 } = data;
  return (
    <div
      style={{
        width: 100,
        minHeight: 50,
        backgroundColor: '#a855f7',
        border: '2px solid #6b21a8',
        borderRadius: 6,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'white',
        fontWeight: 'bold',
        position: 'relative',
      }}
    >
      <div>OR</div>
      {Array.from({ length: inputs }).map((_, idx) => (
        <Handle
          key={idx}
          type="target"
          position={Position.Left}
          id={`in${idx}`}
          style={{ top: 10 + idx * 15, background: '#000' }}
        />
      ))}
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#000' }} />
      <div style={{ marginTop: 4 }}>
        Inputs:
        <input
          type="number"
          min={2}
          max={8}
          value={inputs}
          onChange={(e) => data.onChangeInputs(id, parseInt(e.target.value))}
          style={{ width: 30, marginLeft: 4 }}
        />
      </div>
    </div>
  );
}

function NotNode({ data, id }: any) {
  return (
    <div
      style={{
        width: 80,
        height: 50,
        backgroundColor: '#facc15',
        border: '2px solid #ca8a04',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        position: 'relative',
      }}
    >
      NOT
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#000' }} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#000' }} />
    </div>
  );
}

// Board config
const boards = {
  arduino_nano: {
    name: 'Arduino Nano 328P',
    digital: [
      { pin: 0, label: 'D0/RX' },
      { pin: 1, label: 'D1/TX' },
      { pin: 2, label: 'D2' },
      { pin: 3, label: 'D3/PWM' },
      { pin: 4, label: 'D4' },
      { pin: 5, label: 'D5/PWM' },
      { pin: 6, label: 'D6/PWM' },
      { pin: 7, label: 'D7' },
      { pin: 8, label: 'D8' },
      { pin: 9, label: 'D9/PWM' },
      { pin: 10, label: 'D10/PWM' },
      { pin: 11, label: 'D11/PWM' },
      { pin: 12, label: 'D12' },
      { pin: 13, label: 'D13/LED' },
    ],
    analog: [
      { pin: 'A0', label: 'A0' },
      { pin: 'A1', label: 'A1' },
      { pin: 'A2', label: 'A2' },
      { pin: 'A3', label: 'A3' },
      { pin: 'A4', label: 'A4/SDA' },
      { pin: 'A5', label: 'A5/SCL' },
      { pin: 'A6', label: 'A6' },
      { pin: 'A7', label: 'A7' },
    ],
  },
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [selectedBoard, setSelectedBoard] = useState('arduino_nano');

  // Memoize nodeTypes to prevent recreation on each render
  const nodeTypes = useMemo(() => ({
    inputNode: InputNode,
    outputNode: OutputNode,
    andNode: AndNode,
    orNode: OrNode,
    notNode: NotNode,
    latchNode: LatchNode,
    timerNode: TimerNode,
  }), []);

  const handleInitialStateChange = useCallback((nodeId: string, initialState: number) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, initialState } } : n
      )
    );
  }, [setNodes]);

  const handlePulseLengthChange = useCallback((nodeId: string, pulseLength: number) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, pulseLength } } : n
      )
    );
  }, [setNodes]);

  const handleIntervalChange = useCallback((nodeId: string, interval: number) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, interval } } : n
      )
    );
  }, [setNodes]);

  // Event handler for changing pin
  const handlePinChange = useCallback((nodeId: string, pinValue: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, pin: pinValue } } : n
      )
    );
  }, [setNodes]);

  // Event handler for changing number of inputs
  const handleInputsChange = useCallback((nodeId: string, inputsValue: number) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, inputs: inputsValue } } : n
      )
    );
  }, [setNodes]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params }, eds)),
    [setEdges]
  );

  const onDragStart = (event: any, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (event: any) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !rfInstance) return;

    // Use screenToFlowPosition instead of deprecated project()
    const position = rfInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode = {
      id: getNextId(),
      type,
      position,
      data: {
        label: type,
        inputs: 2,
        selectedBoard,
        onChangePin: handlePinChange,
        onChangeInputs: handleInputsChange,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Save/Load Functions
  const handleDownload = () => {
    downloadJson({ nodes, edges, board: selectedBoard }, 'my-logic-project');
  };

  const handleUpload = () => {
    uploadJson((data) => {
      if (data.nodes && data.edges) {
        // Reset ID counter based on loaded nodes
        resetIdCounter(data.nodes);

        // Add event handlers to all nodes when loading
        const updatedNodes = data.nodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            selectedBoard: data.board || selectedBoard,
            onChangePin: handlePinChange,
            onChangeInputs: handleInputsChange,
          },
        }));

        setNodes(updatedNodes);
        setEdges(data.edges);
        if (data.board) setSelectedBoard(data.board);
      } else {
        alert('Invalid project file');
      }
    });
  };

  const uploadBytecode = () => {
    const config = { nodes, edges, board: selectedBoard };
    const bytecode = generateBytecode(config as any);
    console.log(bytecodeToString(bytecode));
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 200, backgroundColor: '#e5e7eb', padding: 8 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Board: </label>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            style={{ width: '100%' }}
          >
            {Object.keys(boards).map((key) => (
              <option key={key} value={key}>
                {(boards as any)[key].name}
              </option>
            ))}
          </select>
        </div>

        <h3>Blocks</h3>
        <div
          onDragStart={(e) => onDragStart(e, 'inputNode')}
          draggable
          style={{ padding: 4, margin: 2, backgroundColor: '#22c55e', cursor: 'move' }}
        >
          INPUT
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'outputNode')}
          draggable
          style={{ padding: 4, margin: 2, backgroundColor: '#ef4444', cursor: 'move' }}
        >
          OUTPUT
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'andNode')}
          draggable
          style={{ padding: 4, margin: 2, backgroundColor: '#3b82f6', cursor: 'move' }}
        >
          AND
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'orNode')}
          draggable
          style={{ padding: 4, margin: 2, backgroundColor: '#a855f7', cursor: 'move' }}
        >
          OR
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'notNode')}
          draggable
          style={{ padding: 4, margin: 2, backgroundColor: '#facc15', cursor: 'move' }}
        >
          NOT
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'latchNode')}
          draggable
          style={{ padding: 4, margin: 2, backgroundColor: '#f97316', cursor: 'move' }}
        >
          LATCH
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'timerNode')}
          draggable
          style={{ padding: 4, margin: 2, backgroundColor: '#06b6d4', cursor: 'move' }}
        >
          TIMER
        </div>

        <button onClick={handleDownload} style={{ marginTop: 8, width: '100%' }}>
          Download Project
        </button>
        <button onClick={handleUpload} style={{ marginTop: 4, width: '100%' }}>
          Load Project
        </button>
        <button onClick={uploadBytecode} style={{ marginTop: 4, width: '100%' }}>
          Flash
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              selectedBoard,
              onChangePin: handlePinChange,
              onChangeInputs: n.type === 'andNode' || n.type === 'orNode' ? handleInputsChange : undefined,
              onChangeInitialState: n.type === 'latchNode' ? handleInitialStateChange : undefined,
              onChangePulseLength: n.type === 'timerNode' ? handlePulseLengthChange : undefined,
              onChangeInterval: n.type === 'timerNode' ? handleIntervalChange : undefined,
            }
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}