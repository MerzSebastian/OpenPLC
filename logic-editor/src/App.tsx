import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { defaultProject } from './sample-project';

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

// Block definitions for the sidebar
const blockTypes = [
  { type: 'inputNode', label: 'INPUT', color: 'bg-green-500' },
  { type: 'outputNode', label: 'OUTPUT', color: 'bg-red-500' },
  { type: 'andNode', label: 'AND', color: 'bg-blue-500' },
  { type: 'orNode', label: 'OR', color: 'bg-purple-500' },
  { type: 'notNode', label: 'NOT', color: 'bg-yellow-500' },
  { type: 'latchNode', label: 'LATCH', color: 'bg-orange-500' },
  { type: 'pulseNode', label: 'PULSE (beta)', color: 'bg-cyan-500' },
  { type: 'toggleNode', label: 'TOGGLE', color: 'bg-pink-500' },
];

// === Node Definitions ===
function LatchNode({ data, id }: any) {
  return (
    <div className={`${nodeBaseClasses} w-30 h-25 bg-orange-500 border-2 border-orange-800`}>
      <div className={titleClasses}>LATCH</div>
      <Handle type="target" position={Position.Left} id="set" className={handleClasses} style={{ top: '35%' }} />
      <Handle type="target" position={Position.Left} id="reset" className={handleClasses} style={{ top: '55%' }} />
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />
      <div className='absolute left-1 top-[35%] -mt-3 text-sm'>set</div>
      <div className='absolute left-1 top-[55%] -mt-3 text-sm'>reset</div>
      <div className="mt-8 text-xs flex">
        Initial:
        <select
          value={data.initialState || 0}
          onChange={(e) => data.onChangeInitialState(id, parseInt(e.target.value))}
          className={`${inputClasses} w-12 ml-2`}
        >
          <option value={0}>LOW</option>
          <option value={1}>HIGH</option>
        </select>
      </div>
    </div>
  );
}

function ToggleNode({ data, id }: any) {
  return (
    <div className={`${nodeBaseClasses} w-30 h-15 bg-pink-500 border-2 border-pink-800`}>
      <div className={titleClasses}>TOGGLE</div>
      <Handle type="target" position={Position.Left} id="in" className={handleClasses} />
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />

      <div className="mt-1 text-xs flex">
        Initial:
        <select
          value={data.initialState || 0}
          onChange={(e) => data.onChangeInitialState(id, parseInt(e.target.value))}
          className={`${inputClasses} ml-2 w-12`}
        >
          <option value={0}>LOW</option>
          <option value={1}>HIGH</option>
        </select>
      </div>
    </div>
  );
}

function PulseNode({ data, id }: any) {
  return (
    <div className={`${nodeBaseClasses} w-44 h-30 bg-cyan-500 border-2 border-cyan-800`}>
      <div className={titleClasses}>PULSE</div>
      <Handle type="source" position={Position.Right} id="out" className={handleClasses} />

      <div className="mt-1 text-xs space-y-1">
        <div className="flex items-center whitespace-nowrap">
          Pulse (ms):
          <input
            type="number"
            min="1"
            value={data.pulseLength || 1000}
            onChange={(e) => data.onChangePulseLength(id, parseInt(e.target.value))}
            className={`${inputClasses} ml-1 w-14`}
          />
        </div>
        <div className="flex items-center whitespace-nowrap">
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
      className={`${nodeBaseClasses} bg-blue-500 w-28 border-2 border-blue-700`}
      style={{ minHeight: dynamicHeight }}
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
      <div className="mt-1 text-xs flex">
        Inputs:
        <input
          type="number"
          min={2}
          max={8}
          value={inputs}
          onChange={(e) => data.onChangeInputs(id, parseInt(e.target.value))}
          className={`${inputClasses} w-8 ml-2`}
        />
      </div>
    </div>
  );
}

function OrNode({ data, id }: any) {
  const { inputs = 2 } = data;
  return (
    <div className={`${nodeBaseClasses} w-28 min-h-12 bg-purple-500 border-2 border-purple-700`}>
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
      <div className="mt-1 text-xs flex">
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
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Memoize nodeTypes to prevent recreation on each render
  const nodeTypes = useMemo(() => ({
    inputNode: InputNode,
    outputNode: OutputNode,
    andNode: AndNode,
    orNode: OrNode,
    notNode: NotNode,
    latchNode: LatchNode,
    pulseNode: PulseNode,
    toggleNode: ToggleNode,
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

  // Wrap your loadProjectData function with useCallback
  const loadProjectData = useCallback((data: any) => {
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
        onChangeInitialState: node.type === 'latchNode' || node.type === 'toggleNode' ? handleInitialStateChange : undefined,
        onChangePulseLength: node.type === 'pulseNode' ? handlePulseLengthChange : undefined,
        onChangeInterval: node.type === 'pulseNode' ? handleIntervalChange : undefined,
      },
    }));

    setNodes(updatedNodes);
    setEdges(data.edges);
    if (data.board) setSelectedBoard(data.board);
  }, [selectedBoard, handlePinChange, handleInputsChange, handleInitialStateChange, handlePulseLengthChange, handleIntervalChange, setNodes, setEdges]);

  // Then use it in your useEffect
  useEffect(() => {
    loadProjectData(defaultProject);
  }, [loadProjectData]); // Now loadProjectData is properly included

  const handleUpload = () => {
    uploadJson((data) => {
      if (data.nodes && data.edges) {
        loadProjectData(data);
      } else {
        alert('Invalid project file');
      }
    });
  };

  // Reset UI function
  const handleReset = () => {
    setNodes([]);
    setEdges([]);
    nodeIdCounter = 0;
    setUploadStatus('UI has been reset');
    setTimeout(() => setUploadStatus(null), 3000);
  };

  // Load default project function
  const loadDefaultProject = () => {
    loadProjectData(defaultProject);
    setUploadStatus('Default project loaded');
    setTimeout(() => setUploadStatus(null), 3000);
  };

  const getArduinoInoFile = async () => {
    const githubUrl = 'https://raw.githubusercontent.com/MerzSebastian/OpenPLC/refs/heads/main/arduino/arduino.ino';
    const response = await fetch(githubUrl);
    return await response.text();
  }

  const copyArduinoCode = async () => {
    await navigator.clipboard.writeText(await getArduinoInoFile());
    setUploadStatus('.ino copied to clipboard!');
  }

  const copyBytecode = async () => {
    try {
      const config = { nodes, edges, board: selectedBoard };
      const bytecode = generateBytecode(config as any);
      const bytecodeStr = bytecodeToString(bytecode);
      let inoContent = await getArduinoInoFile();

      // Replace "// #define WOKWI" with "#define WOKWI"
      inoContent = inoContent.replace(/^\s*\/\/\s*#define\s+WOKWI.*$/m, '#define WOKWI');

      // Replace the line with "byte myBytecode..."
      inoContent = inoContent.replace(
        /^\s*byte\s+myBytecode.*$/m,
        `byte myBytecode[] = {${bytecodeStr}};`
      );

      // Copy the modified ino content to clipboard
      await navigator.clipboard.writeText(inoContent);

      setUploadStatus('.ino copied to clipboard!');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setUploadStatus('Failed to copy modified .ino');
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };


  // WebSerial transmission function
  const uploadBytecodeViaWebSerial = async () => {
    if (!('serial' in navigator)) {
      setUploadStatus('WebSerial API not supported in this browser');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    try {
      // Request a port and open it
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate bytecode
      const config = { nodes, edges, board: selectedBoard };
      const bytecode = generateBytecode(config as any);

      // Create message with structure [START_BYTE][LENGTH][DATA...][CHECKSUM]
      const START_BYTE = 0x7E;
      const LENGTH = bytecode.length;

      // Calculate checksum
      let checksum = 0;
      for (let i = 0; i < bytecode.length; i++) {
        checksum = (checksum + bytecode[i]) % 256;
      }

      // Create message array
      const message = [START_BYTE, LENGTH, ...bytecode, checksum];

      // Convert to Uint8Array
      const data = new Uint8Array(message);

      // Write the data
      const writer = port.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();

      // Read response from Arduino
      const reader = port.readable.getReader();
      let responseReceived = false;
      let response = '';

      // Set a timeout for reading response
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout waiting for response')), 60000)
      );

      try {
        const readPromise = (async () => {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            response += new TextDecoder().decode(value);
            if (response.includes('SUCCESS') || response.includes('ERROR')) {
              responseReceived = true;
              break;
            }
          }
        })();

        await Promise.race([readPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error reading response:', error);
      } finally {
        reader.releaseLock();
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); //just to be safe
      // Close the port
      await port.close();

      if (responseReceived) {
        if (response.includes('SUCCESS')) {
          setUploadStatus('Upload successful!');
        } else if (response.includes('ERROR')) {
          setUploadStatus('Upload failed: Checksum error');
        } else {
          setUploadStatus('Upload completed but no valid response received');
        }
      } else {
        setUploadStatus('Upload completed but no response received (timeout)');
      }

      setTimeout(() => setUploadStatus(null), 5000);
    } catch (error) {
      console.error('WebSerial error:', error);
      setUploadStatus(`Upload failed: ${(error as any)?.message}`);
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 bg-gray-200 p-2">
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

        {/* Simplified block list using array map */}
        {blockTypes.map((block) => (
          <div
            key={block.type}
            onDragStart={(e) => onDragStart(e, block.type)}
            draggable
            className={`p-1 m-0.5 ${block.color} cursor-move`}
          >
            {block.label}
          </div>
        ))}

        <button onClick={handleUpload} className="mt-6 w-full bg-gray-500 text-white p-1 rounded">
          Load Project
        </button>
        <button onClick={handleDownload} className="mt-1 w-full bg-blue-500 text-white p-1 rounded">
          Download Project
        </button>
        <button onClick={handleReset} className="mt-1 w-full bg-red-500 text-white p-1 rounded">
          Reset Project
        </button>
        <button onClick={loadDefaultProject} className="mt-1 w-full bg-indigo-500 text-white p-1 rounded">
          Load Default Project
        </button>
        <button onClick={uploadBytecodeViaWebSerial} className="mt-6 w-full bg-purple-600 text-white p-1 rounded">
          Upload Project to Arduino
        </button>
        <button onClick={copyBytecode} className="mt-1 mb-5 w-full bg-green-600 text-white p-1 rounded">
          Copy Code for testing on Wokwi.com
        </button>
        <button onClick={copyArduinoCode} className="mt-1 w-full bg-orange-600 text-white p-1 rounded">
          Copy Arduino Code
        </button>
        When you want to test on Wokwi.com you can use see the default project <a className='text-blue-700' href='https://wokwi.com/projects/441553408946374657'>here</a>

        {uploadStatus && (
          <div className={`mt-2 p-2 text-center text-sm rounded ${uploadStatus.includes('success') || uploadStatus.includes('copied') || uploadStatus.includes('loaded') || uploadStatus.includes('reset')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}>
            {uploadStatus}
          </div>
        )}
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
              onChangeInitialState: n.type === 'latchNode' || n.type === 'toggleNode' ? handleInitialStateChange : undefined,
              onChangePulseLength: n.type === 'pulseNode' ? handlePulseLengthChange : undefined,
              onChangeInterval: n.type === 'pulseNode' ? handleIntervalChange : undefined,
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