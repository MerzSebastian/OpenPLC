import React, { useState, useCallback } from 'react';
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

let id = 0;
const getId = () => `dndnode_${id++}`;

// === Node Definitions ===
function InputNode({ data }: any) {
  const pins = [
    ...((boards as any)[data.selectedBoard]?.digital || []),
    ...((boards as any)[data.selectedBoard]?.analog || []),
  ];

  return (
    <div style={{ width: 120, backgroundColor: '#22c55e', border: '2px solid #166534', borderRadius: 6, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', fontWeight: 'bold', position: 'relative' }}>
      <div>INPUT</div>
      <select
        value={data.pin || ''}
        onChange={(e) => data.onChangePin?.(e.target.value)}
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

function OutputNode({ data }: any) {
  const pins = [
    ...((boards as any)[data.selectedBoard]?.digital || []),
    ...((boards as any)[data.selectedBoard]?.analog || []),
  ];

  return (
    <div style={{ width: 120, backgroundColor: '#ef4444', border: '2px solid #991b1b', borderRadius: 6, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white', fontWeight: 'bold', position: 'relative' }}>
      <div>OUTPUT</div>
      <select
        value={data.pin || ''}
        onChange={(e) => data.onChangePin?.(e.target.value)}
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



function AndNode({ data }: any) {
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
          onChange={(e) => data.onChangeInputs?.(parseInt(e.target.value))}
          style={{ width: 30, marginLeft: 4 }}
        />
      </div>
    </div>
  );
}

function OrNode({ data }: any) {
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
          onChange={(e) => data.onChangeInputs?.(parseInt(e.target.value))}
          style={{ width: 30, marginLeft: 4 }}
        />
      </div>
    </div>
  );
}

function NotNode() {
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



// Node types
const nodeTypes = {
  inputNode: InputNode,
  outputNode: OutputNode,
  andNode: AndNode,
  orNode: OrNode,
  notNode: NotNode,
};

// Board config (same as before)
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

    const position = rfInstance.project({ x: event.clientX - 200, y: event.clientY - 40 });

    const newNode = {
      id: getId(),
      type,
      position,
      data: {
        label: type,
        inputs: 2,
        onChangePin: (val: string) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === newNode.id ? { ...n, data: { ...n.data, pin: val } } : n
            )
          );
        },
      },
    };


    setNodes((nds) => nds.concat(newNode));
  };

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // ======= New Save / Load Functions using utils =======
  const handleDownload = () => {
    downloadJson({ nodes, edges, board: selectedBoard }, 'my-logic-project');
  };

  const handleUpload = () => {
    uploadJson((data) => {
      if (data.nodes && data.edges) {
        setNodes(data.nodes);
        setEdges(data.edges);
      } else {
        alert('Invalid project file');
      }
    });
  };

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

        {/* New buttons */}
        <button onClick={handleDownload} style={{ marginTop: 8, width: '100%' }}>
          Download JSON
        </button>
        <button onClick={handleUpload} style={{ marginTop: 4, width: '100%' }}>
          Upload JSON
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes.map(n => ({ ...n, data: { ...n.data, selectedBoard } }))}
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