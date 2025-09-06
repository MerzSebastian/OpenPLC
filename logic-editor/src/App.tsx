import React, { useCallback, useState } from 'react';
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

// === Node Definitions ===
function InputNode({ data }: any) {
  return (
    <div className="bg-green-200 border-2 border-green-600 rounded-lg p-2 text-center">
      <div>INPUT</div>
      <input
        type="checkbox"
        checked={data.value}
        onChange={(e) => data.onChange?.(e.target.checked)}
      />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

function OutputNode({ data }: any) {
  return (
    <div className="bg-red-200 border-2 border-red-600 rounded-lg p-2 text-center">
      <div>OUTPUT</div>
      <div>{data.value ? '1' : '0'}</div>
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}

function AndNode() {
  return (
    <div
      style={{
        width: 80,
        height: 50,
        backgroundColor: '#3b82f6', // blue
        border: '2px solid #1e40af',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
      }}
    >
      AND
      <Handle type="target" position={Position.Left} id="in1" style={{ top: 10, background: '#000' }} />
      <Handle type="target" position={Position.Left} id="in2" style={{ bottom: 10, background: '#000' }} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#000' }} />
    </div>
  );
}


function OrNode() {
  return (
    <div className="bg-purple-200 border-2 border-purple-600 rounded-lg p-2 text-center">
      <div>OR</div>
      <Handle type="target" position={Position.Left} id="in1" />
      <Handle type="target" position={Position.Left} id="in2" style={{ top: '75%' }} />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

function NotNode() {
  return (
    <div className="bg-yellow-200 border-2 border-yellow-600 rounded-lg p-2 text-center">
      <div>NOT</div>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}

// === Node Mapping ===
const nodeTypes = {
  inputNode: InputNode,
  outputNode: OutputNode,
  andNode: AndNode,
  orNode: OrNode,
  notNode: NotNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

// === App Component ===
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, data: { negated: false } }, eds)),
    []
  );

  const onDragStart = (event: any, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (event: any) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = rfInstance.project({ x: event.clientX - 200, y: event.clientY - 40 });

    const newNode = {
      id: getId(),
      type,
      position,
      data: { label: `${type}` },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onDragOver = (event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Export JSON
  const saveFlow = () => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem('logic-flow', JSON.stringify(flow));
      alert('Saved to localStorage');
    }
  };

  // Import JSON
  const loadFlow = () => {
    const flow = localStorage.getItem('logic-flow');
    if (flow) {
      const obj = JSON.parse(flow);
      setNodes(obj.nodes || []);
      setEdges(obj.edges || []);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-40 bg-gray-200 p-2">
        <div className="font-bold mb-2">Blocks</div>
        <div onDragStart={(e) => onDragStart(e, 'inputNode')} draggable className="p-1 bg-green-300 m-1 cursor-move">INPUT</div>
        <div onDragStart={(e) => onDragStart(e, 'outputNode')} draggable className="p-1 bg-red-300 m-1 cursor-move">OUTPUT</div>
        <div onDragStart={(e) => onDragStart(e, 'andNode')} draggable className="p-1 bg-blue-300 m-1 cursor-move">AND</div>
        <div onDragStart={(e) => onDragStart(e, 'orNode')} draggable className="p-1 bg-purple-300 m-1 cursor-move">OR</div>
        <div onDragStart={(e) => onDragStart(e, 'notNode')} draggable className="p-1 bg-yellow-300 m-1 cursor-move">NOT</div>

        <button onClick={saveFlow} className="mt-4 bg-gray-400 p-1 w-full">Save</button>
        <button onClick={loadFlow} className="mt-2 bg-gray-400 p-1 w-full">Load</button>
      </div>

      {/* Canvas */}
      <div className="flex-1" style={{ height: '80vh' }}>
        <ReactFlow
          nodes={nodes}
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
