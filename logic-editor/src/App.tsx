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

// Common style classes
const nodeBaseClasses = "flex flex-col items-center text-white font-bold relative rounded-md p-1";
const handleClasses = "bg-black";
const titleClasses = "text-center mb-1";
const inputClasses = "w-full bg-white/20 rounded px-1 text-black text-xs";

// === Node Definitions ===
function LatchNode({ data, id }: any) {
  return (
    <div className={`${nodeBaseClasses} w-30 h-25 bg-orange-500 border-2 border-orange-800`}>
      <div className={titleClasses}>LATCH</div>
      <Handle type="target" position={Position.Left} id="set" className={handleClasses} style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="reset" className={handleClasses} style={{ top: '70%' }} />
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />
      
      <div className="mt-1 text-xs">
        Initial:
        <select
          value={data.initialState || 0}
          onChange={(e) => data.onChangeInitialState(id, parseInt(e.target.value))}
          className={`${inputClasses} ml-1 w-12`}
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
    <div className={`${nodeBaseClasses} w-36 h-30 bg-cyan-500 border-2 border-cyan-800`}>
      <div className={titleClasses}>TIMER</div>
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />
      
      <div className="mt-1 text-xs space-y-1">
        <div className="flex items-center">
          Pulse (ms):
          <input
            type="number"
            min="1"
            value={data.pulseLength || 1000}
            onChange={(e) => data.onChangePulseLength(id, parseInt(e.target.value))}
            className={`${inputClasses} ml-1 w-14`}
          />
        </div>
        <div className="flex items-center">
          Interval (ms):
          <input
            type="number"
            min="1"
            value={data.interval || 5000}
            onChange={(e) => data.onChangeInterval(id, parseInt(e.target.value))}
            className={`${inputClasses} ml-1 w-14`}
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
    <div className={`${nodeBaseClasses} w-30 bg-green-500 border-2 border-green-700`}>
      <div className={titleClasses}>INPUT</div>
      <select
        value={data.pin || ''}
        onChange={(e) => data.onChangePin(id, e.target.value)}
        className={`${inputClasses} mt-1`}
      >
        <option value="">Select Pin</option>
        {pins.map((p: any) => (
          <option key={p.pin} value={p.pin}>
            {p.label}
          </option>
        ))}
      </select>
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />
    </div>
  );
}

function OutputNode({ data, id }: any) {
  const pins = [
    ...((boards as any)[data.selectedBoard]?.digital || []),
    ...((boards as any)[data.selectedBoard]?.analog || []),
  ];

  return (
    <div className={`${nodeBaseClasses} w-30 bg-red-500 border-2 border-red-700`}>
      <div className={titleClasses}>OUTPUT</div>
      <select
        value={data.pin || ''}
        onChange={(e) => data.onChangePin(id, e.target.value)}
        className={`${inputClasses} mt-1`}
      >
        <option value="">Select Pin</option>
        {pins.map((p: any) => (
          <option key={p.pin} value={p.pin}>
            {p.label}
          </option>
        ))}
      </select>
      <Handle type="target" position={Position.Left} id="in" className={handleClasses} />
    </div>
  );
}

function AndNode({ data, id }: any) {
  const { inputs = 2 } = data;
  const handleSpacing = 15;
  const baseHeight = 50;
  const dynamicHeight = baseHeight + (inputs - 3) * handleSpacing;

  return (
    <div
      className={`${nodeBaseClasses} bg-blue-500 border-2 border-blue-700`}
      style={{ width: 100, minHeight: dynamicHeight }}
    >
      <div className={titleClasses}>AND</div>
      {Array.from({ length: inputs }).map((_, idx) => (
        <Handle
          key={idx}
          type="target"
          position={Position.Left}
          id={`in${idx}`}
          className={handleClasses}
          style={{ top: 10 + idx * 15 }}
        />
      ))}
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />
      <div className="mt-1 text-xs">
        Inputs:
        <input
          type="number"
          min={2}
          max={8}
          value={inputs}
          onChange={(e) => data.onChangeInputs(id, parseInt(e.target.value))}
          className={`${inputClasses} ml-1 w-8`}
        />
      </div>
    </div>
  );
}

function OrNode({ data, id }: any) {
  const { inputs = 2 } = data;
  return (
    <div className={`${nodeBaseClasses} w-25 min-h-12 bg-purple-500 border-2 border-purple-700`}>
      <div className={titleClasses}>OR</div>
      {Array.from({ length: inputs }).map((_, idx) => (
        <Handle
          key={idx}
          type="target"
          position={Position.Left}
          id={`in${idx}`}
          className={handleClasses}
          style={{ top: 10 + idx * 15 }}
        />
      ))}
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />
      <div className="mt-1 text-xs">
        Inputs:
        <input
          type="number"
          min={2}
          max={8}
          value={inputs}
          onChange={(e) => data.onChangeInputs(id, parseInt(e.target.value))}
          className={`${inputClasses} ml-1 w-8`}
        />
      </div>
    </div>
  );
}

function NotNode({ data, id }: any) {
  return (
    <div className={`${nodeBaseClasses} w-20 h-12 bg-yellow-500 border-2 border-yellow-700 justify-center`}>
      <div className={titleClasses}>NOT</div>
      <Handle type="target" position={Position.Left} id="in" className={handleClasses} />
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />
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
      nds.map((n) => {
        if (n.id === nodeId) {
          // Remove edges connected to handles that will no longer exist
          const oldInputs = n.data.inputs || 2;
          if (inputsValue < oldInputs) {
            setEdges((eds) => 
              eds.filter(edge => 
                !(edge.target === nodeId && 
                  edge.targetHandle && 
                  parseInt(edge.targetHandle.replace('in', '')) >= inputsValue)
              )
            );
          }
          
          return { ...n, data: { ...n.data, inputs: inputsValue } };
        }
        return n;
      })
    );
  }, [setNodes, setEdges]);

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
    <div className="flex h-screen">
      <div className="w-50 bg-gray-200 p-2">
        <div className="mb-3">
          <label>Board: </label>
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            className="w-full"
          >
            {Object.keys(boards).map((key) => (
              <option key={key} value={key}>
                {(boards as any)[key].name}
              </option>
            ))}
          </select>
        </div>

        <h3 className="font-bold">Blocks</h3>
        <div
          onDragStart={(e) => onDragStart(e, 'inputNode')}
          draggable
          className="p-1 m-0.5 bg-green-500 cursor-move"
        >
          INPUT
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'outputNode')}
          draggable
          className="p-1 m-0.5 bg-red-500 cursor-move"
        >
          OUTPUT
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'andNode')}
          draggable
          className="p-1 m-0.5 bg-blue-500 cursor-move"
        >
          AND
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'orNode')}
          draggable
          className="p-1 m-0.5 bg-purple-500 cursor-move"
        >
          OR
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'notNode')}
          draggable
          className="p-1 m-0.5 bg-yellow-500 cursor-move"
        >
          NOT
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'latchNode')}
          draggable
          className="p-1 m-0.5 bg-orange-500 cursor-move"
        >
          LATCH
        </div>
        <div
          onDragStart={(e) => onDragStart(e, 'timerNode')}
          draggable
          className="p-1 m-0.5 bg-cyan-500 cursor-move"
        >
          TIMER
        </div>

        <button onClick={handleDownload} className="mt-2 w-full bg-blue-500 text-white p-1 rounded">
          Download Project
        </button>
        <button onClick={handleUpload} className="mt-1 w-full bg-gray-500 text-white p-1 rounded">
          Load Project
        </button>
        <button onClick={uploadBytecode} className="mt-1 w-full bg-green-600 text-white p-1 rounded">
          Flash
        </button>
      </div>

      <div className="flex-1">
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