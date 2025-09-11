// Enhanced bytecode-gen.ts with automatic OR node insertion
export const OP_SET_PIN_MODE_INPUT = 1;
export const OP_SET_PIN_MODE_OUTPUT = 2;
export const OP_READ_PIN = 3;
export const OP_WRITE_PIN = 4;
export const OP_READ_ANALOG_PIN = 5;
export const OP_WRITE_ANALOG_PIN = 6;
export const OP_NOT = 10;
export const OP_AND = 11;
export const OP_OR = 12;
export const OP_NAND = 13;
export const OP_NOR = 14;
export const OP_XOR = 15;
export const OP_LATCH = 16;
export const OP_PULSE = 17;
export const OP_TOGGLE = 18;
export const OP_ANALOG_RANGE = 19;
export const OP_ANALOG_COMPARE_GT = 20;
export const OP_ANALOG_COMPARE_GE = 21;
export const OP_ANALOG_COMPARE_LT = 22;
export const OP_ANALOG_COMPARE_LE = 23;
export const OP_ANALOG_COMPARE_EQ = 24;
export const OP_ANALOG_COMPARE_NE = 25;
export const OP_SHIFT_REGISTER = 26;
export const OP_DELAY = 30;

// Types for the logic configuration
interface Position {
  x: number;
  y: number;
}

interface NodeData {
  label: string;
  inputs?: number;
  pin?: string;
  min?: number;
  max?: number;
  initialState?: number;
  pulseLength?: number;
  interval?: number;
  comparisonType?: string;
  outputs?: number;
  initialOutput?: number;
}

interface Node {
  id: string;
  type: string;
  position: Position;
  data: NodeData;
  width?: number;
  height?: number;
  selected?: boolean;
  positionAbsolute?: Position;
  dragging?: boolean;
}

interface Edge {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  id: string;
}

interface LogicConfig {
  nodes: Node[];
  edges: Edge[];
  board: string;
}

function autoInsertORNodes(config: LogicConfig): LogicConfig {
  const { nodes, edges, board } = config;
  const newNodes = [...nodes];
  let newEdges = [...edges];

  // Build a map of target nodes to their incoming edges
  const targetNodeMap: Record<string, Edge[]> = {};

  for (const edge of newEdges) {
    if (!targetNodeMap[edge.target]) {
      targetNodeMap[edge.target] = [];
    }
    targetNodeMap[edge.target].push(edge);
  }

  // Find nodes with multiple inputs
  const nodesNeedingOR: {nodeId: string, edges: Edge[]}[] = [];

  for (const nodeId in targetNodeMap) {
    const edges = targetNodeMap[nodeId];
    const targetNode = newNodes.find(n => n.id === nodeId);
    if (!targetNode) continue;

    // For outputNode, consider all inputs regardless of handle
    if (targetNode.type === 'outputNode' && edges.length > 1) {
      const sortedEdges = [...edges].sort((a, b) => a.source.localeCompare(b.source));
      nodesNeedingOR.push({nodeId, edges: sortedEdges});
    } else {
      // For other nodes, check per handle
      const targetHandleMap: Record<string, Edge[]> = {};
      for (const edge of edges) {
        if (!targetHandleMap[edge.targetHandle]) {
          targetHandleMap[edge.targetHandle] = [];
        }
        targetHandleMap[edge.targetHandle].push(edge);
      }
      for (const handle in targetHandleMap) {
        const handleEdges = targetHandleMap[handle];
        if (handleEdges.length > 1) {
          const sortedEdges = [...handleEdges].sort((a, b) => a.source.localeCompare(b.source));
          nodesNeedingOR.push({nodeId, edges: sortedEdges});
        }
      }
    }
  }

  // Insert OR nodes for nodes with multiple inputs
  for (const {nodeId, edges} of nodesNeedingOR) {
    const targetNode = newNodes.find(n => n.id === nodeId);
    if (!targetNode) continue;

    // Create a new OR node
    const orNodeId = `auto_or_${nodeId}`;
    const orNode: Node = {
      id: orNodeId,
      type: 'orNode',
      data: { inputs: edges.length },
      position: { x: 0, y: 0 }
    } as Node;

    // Add the OR node
    newNodes.push(orNode);

    // Remove the original edges
    newEdges = newEdges.filter(e => !edges.includes(e));

    // Add edges from sources to OR node (in sorted order)
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      newEdges.push({
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: orNodeId,
        targetHandle: `in${i}`,
        id: `auto_edge_${edge.source}_to_${orNodeId}_in${i}`
      });
    }

    // Add edge from OR node to target node
    newEdges.push({
      source: orNodeId,
      sourceHandle: 'out',
      target: nodeId,
      targetHandle: 'in', // Use a single input handle for outputNode
      id: `auto_edge_${orNodeId}_to_${nodeId}_in`
    });
  }

  return { nodes: newNodes, edges: newEdges, board };
}

// Function to generate bytecode with dynamic input handling
export function generateBytecode(config: LogicConfig): number[] {
  // First, automatically insert OR nodes for multiple inputs
  const processedConfig = autoInsertORNodes(config);
  const { nodes, edges } = processedConfig;
  const instructions: number[] = [];

  // Build graph
  const graph: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const nodeDict: Record<string, Node> = {};

  for (const node of nodes) {
    const nodeId = node.id;
    graph[nodeId] = [];
    inDegree[nodeId] = 0;
    nodeDict[nodeId] = node;
  }

  for (const edge of edges) {
    const source = edge.source;
    const target = edge.target;
    graph[source].push(target);
    inDegree[target] += 1;
  }

  // Simple check: if an input node is connected to an analog node
  const inputUsesAnalog: Record<string, boolean> = {};
  
  for (const node of nodes) {
    if (node.type === 'inputNode') {
      // Check if this input is connected to any analog node
      const checkConnectedToAnalog = (nodeId: string, visited: Set<string> = new Set()): boolean => {
        if (visited.has(nodeId)) return false;
        visited.add(nodeId);
        
        const currentNode = nodeDict[nodeId];
        if (currentNode.type === 'analogRangeNode' || currentNode.type === 'analogComparerNode') return true;
        
        for (const neighbor of graph[nodeId]) {
          if (checkConnectedToAnalog(neighbor, visited)) return true;
        }
        
        return false;
      };
      
      inputUsesAnalog[node.id] = checkConnectedToAnalog(node.id);
    }
  }

  // Topological sort
  const queue: string[] = [];
  for (const [nodeId, deg] of Object.entries(inDegree)) {
    if (deg === 0) {
      queue.push(nodeId);
    }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift() as string;
    topologicalOrder.push(nodeId);
    for (const neighbor of graph[nodeId]) {
      inDegree[neighbor] -= 1;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Assign variable indices to non-output nodes
  const varIndexMap: Record<string, number> = {};
  let varCount = 0;
  for (const nodeId of topologicalOrder) {
    const node = nodeDict[nodeId];
    if (node.type !== 'outputNode') {
      varIndexMap[nodeId] = varCount;
      varCount += 1;
    }
  }

  // Set pin modes for input and output nodes
  for (const node of nodes) {
    if (node.type === 'inputNode' && node.data.pin) {
      const pin = parseInt(node.data.pin, 10);
      instructions.push(OP_SET_PIN_MODE_INPUT);
      instructions.push(pin);
    } else if (node.type === 'outputNode' && node.data.pin) {
      const pin = parseInt(node.data.pin, 10);
      instructions.push(OP_SET_PIN_MODE_OUTPUT);
      instructions.push(pin);
    }
  }

  // Generate instructions for each node in topological order
  for (const nodeId of topologicalOrder) {
    const node = nodeDict[nodeId];

    if (node.type === 'inputNode' && node.data.pin) {
      const pin = parseInt(node.data.pin, 10);
      const varIndex = varIndexMap[nodeId];
      
      // Use analog read if connected to an analog node
      if (inputUsesAnalog[nodeId]) {
        instructions.push(OP_READ_ANALOG_PIN);
      } else {
        instructions.push(OP_READ_PIN);
      }
      instructions.push(pin);
      instructions.push(varIndex);
    } else if (node.type === 'outputNode' && node.data.pin) {
      // Find the source node connected to this output
      let sourceNodeId: string | null = null;
      for (const edge of edges) {
        if (edge.target === nodeId) {
          sourceNodeId = edge.source;
          break;
        }
      }

      let sourceVar = 0; // Default to 0 if no source
      if (sourceNodeId && varIndexMap[sourceNodeId] !== undefined) {
        sourceVar = varIndexMap[sourceNodeId];
      }

      const pin = parseInt(node.data.pin, 10);
      instructions.push(OP_WRITE_PIN);
      instructions.push(pin);
      instructions.push(sourceVar);
    } else if (node.type === 'analogRangeNode') {
      // Handle analog range node
      const inputVars: number[] = [];
      for (const edge of edges) {
        if (edge.target === nodeId) {
          const sourceNodeId = edge.source;
          if (varIndexMap[sourceNodeId] !== undefined) {
            inputVars.push(varIndexMap[sourceNodeId]);
          }
        }
      }

      if (inputVars.length >= 1 && varIndexMap[nodeId] !== undefined) {
        const min = node.data.min || 0;
        const max = node.data.max || 1023;
        
        instructions.push(OP_ANALOG_RANGE);
        instructions.push(inputVars[0]); // Input variable
        instructions.push(min & 0xFF);   // Min value low byte
        instructions.push((min >> 8) & 0xFF); // Min value high byte
        instructions.push(max & 0xFF);   // Max value low byte
        instructions.push((max >> 8) & 0xFF); // Max value high byte
        instructions.push(varIndexMap[nodeId]); // Output variable
      }
    } else {
      // Logic gate node
      const gateType = node.type;

      // Handle different node types
      switch (gateType) {
        case 'notNode': {
          const inputVars: number[] = [];
          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                inputVars.push(varIndexMap[sourceNodeId]);
              }
            }
          }

          if (inputVars.length >= 1 && varIndexMap[nodeId] !== undefined) {
            instructions.push(OP_NOT);
            instructions.push(inputVars[0]);
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'andNode': {
          const inputVars: number[] = [];
          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                inputVars.push(varIndexMap[sourceNodeId]);
              }
            }
          }

          if (inputVars.length >= 2 && varIndexMap[nodeId] !== undefined) {
            instructions.push(OP_AND);
            instructions.push(inputVars.length);
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'nandNode': {
          const inputVars: number[] = [];
          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                inputVars.push(varIndexMap[sourceNodeId]);
              }
            }
          }

          if (inputVars.length >= 2 && varIndexMap[nodeId] !== undefined) {
            instructions.push(OP_NAND);
            instructions.push(inputVars.length);
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'norNode': {
          const inputVars: number[] = [];
          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                inputVars.push(varIndexMap[sourceNodeId]);
              }
            }
          }

          if (inputVars.length >= 2 && varIndexMap[nodeId] !== undefined) {
            instructions.push(OP_NOR);
            instructions.push(inputVars.length);
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'xorNode': {
          const inputVars: number[] = [];
          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                inputVars.push(varIndexMap[sourceNodeId]);
              }
            }
          }

          if (inputVars.length >= 2 && varIndexMap[nodeId] !== undefined) {
            instructions.push(OP_XOR);
            instructions.push(inputVars.length);
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'analogComparerNode': {
          // Find inputs A and B
          let aVar = -1;
          let bVar = -1;

          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                if (edge.targetHandle === 'a') {
                  aVar = varIndexMap[sourceNodeId];
                } else if (edge.targetHandle === 'b') {
                  bVar = varIndexMap[sourceNodeId];
                }
              }
            }
          }

          if (aVar >= 0 && bVar >= 0 && varIndexMap[nodeId] !== undefined) {
            const comparisonType = node.data.comparisonType || '>';
            let opcode;

            switch (comparisonType) {
              case '>': opcode = OP_ANALOG_COMPARE_GT; break;
              case '>=': opcode = OP_ANALOG_COMPARE_GE; break;
              case '<': opcode = OP_ANALOG_COMPARE_LT; break;
              case '<=': opcode = OP_ANALOG_COMPARE_LE; break;
              case '==': opcode = OP_ANALOG_COMPARE_EQ; break;
              case '!=': opcode = OP_ANALOG_COMPARE_NE; break;
              default: opcode = OP_ANALOG_COMPARE_GT;
            }

            instructions.push(opcode);
            instructions.push(aVar);
            instructions.push(bVar);
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'shiftRegisterNode': {
          // Find data, clock, and reset inputs
          let dataVar = -1;
          let clockVar = -1;
          let resetVar = -1;

          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                if (edge.targetHandle === 'data') {
                  dataVar = varIndexMap[sourceNodeId];
                } else if (edge.targetHandle === 'clock') {
                  clockVar = varIndexMap[sourceNodeId];
                } else if (edge.targetHandle === 'reset') {
                  resetVar = varIndexMap[sourceNodeId];
                }
              }
            }
          }

          // If reset is not connected, use a special value (255) to indicate no reset
          if (resetVar === -1) {
            resetVar = 255; // Special value meaning "no reset connected"
          }

          if (dataVar >= 0 && clockVar >= 0 && varIndexMap[nodeId] !== undefined) {
            const outputs = node.data.outputs || 4;
            const initialState = node.data.initialState || 0;

            instructions.push(OP_SHIFT_REGISTER);
            instructions.push(dataVar);
            instructions.push(clockVar);
            instructions.push(resetVar); // This can be 255 now
            instructions.push(outputs);
            instructions.push(initialState);
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'orNode': {
          const inputVars: number[] = [];
          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                inputVars.push(varIndexMap[sourceNodeId]);
              }
            }
          }

          if (inputVars.length >= 2 && varIndexMap[nodeId] !== undefined) {
            instructions.push(OP_OR);
            instructions.push(inputVars.length);
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(varIndexMap[nodeId]);
          }
          break;
        }
        case 'latchNode': {
          // Find set and reset inputs
          let setVar = -1;
          let resetVar = -1;

          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                if (edge.targetHandle === 'set') {
                  setVar = varIndexMap[sourceNodeId];
                } else if (edge.targetHandle === 'reset') {
                  resetVar = varIndexMap[sourceNodeId];
                }
              }
            }
          }

          if (setVar >= 0 && resetVar >= 0 && varIndexMap[nodeId] !== undefined) {
            const outputVar = varIndexMap[nodeId];
            const initialState = node.data.initialState || 0;

            instructions.push(OP_LATCH);
            instructions.push(setVar);
            instructions.push(resetVar);
            instructions.push(outputVar);
            instructions.push(initialState);
          }
          break;
        }
        case 'pulseNode': {
          if (varIndexMap[nodeId] !== undefined) {
            const outputVar = varIndexMap[nodeId];
            const pulseLength = node.data.pulseLength || 1000;
            const interval = node.data.interval || 5000;

            instructions.push(OP_PULSE);
            instructions.push(outputVar);
            instructions.push(pulseLength & 0xFF);
            instructions.push((pulseLength >> 8) & 0xFF);
            instructions.push(interval & 0xFF);
            instructions.push((interval >> 8) & 0xFF);
          }
          break;
        }
        case 'toggleNode': {
          const inputVars: number[] = [];

          for (const edge of edges) {
            if (edge.target === nodeId) {
              const sourceNodeId = edge.source;
              if (varIndexMap[sourceNodeId] !== undefined) {
                inputVars.push(varIndexMap[sourceNodeId]);
              }
            }
          }

          if (inputVars.length >= 1 && varIndexMap[nodeId] !== undefined) {
            const outputVar = varIndexMap[nodeId];
            const initialState = node.data.initialState || 0;

            instructions.push(OP_TOGGLE);
            instructions.push(inputVars[0]); // Input variable
            instructions.push(outputVar);    // Output variable
            instructions.push(initialState); // Initial state
          }
          break;
        }
      }
    }
  }

  return instructions;
}

// Utility function to convert bytecode to a string for sending to Arduino
export function bytecodeToString(bytecode: number[]): string {
  return bytecode.join(',');
}