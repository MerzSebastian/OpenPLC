

// Types for the logic configuration
interface Position {
  x: number;
  y: number;
}

interface NodeData {
  label: string;
  inputs?: number;
  pin?: string;
}

interface Node {
  id: string;
  type: string;
  position: Position;
  data: NodeData;
  width: number;
  height: number;
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
// Enhanced bytecode-gen.ts with dynamic input handling
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
export const OP_DELAY = 30;

// Function to generate bytecode with dynamic input handling
export function generateBytecode(config: LogicConfig): number[] {
  const { nodes, edges } = config;
  const instructions: number[] = [];
  
  // Build graph and in-degree map
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
      instructions.push(OP_READ_PIN);
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
    } else {
      // Logic gate node
      const gateType = node.type;
      const inputVars: number[] = [];
      
      for (const edge of edges) {
        if (edge.target === nodeId) {
          const sourceNodeId = edge.source;
          if (varIndexMap[sourceNodeId] !== undefined) {
            inputVars.push(varIndexMap[sourceNodeId]);
          }
        }
      }
      
      if (varIndexMap[nodeId] === undefined) continue;
      
      const outputVar = varIndexMap[nodeId];
      
      // Handle dynamic number of inputs
      switch (gateType) {
        case 'notNode':
          if (inputVars.length >= 1) {
            instructions.push(OP_NOT);
            instructions.push(inputVars[0]);
            instructions.push(outputVar);
          }
          break;
        case 'andNode':
          if (inputVars.length >= 2) {
            instructions.push(OP_AND);
            instructions.push(inputVars.length); // Number of inputs
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(outputVar);
          }
          break;
        case 'orNode':
          if (inputVars.length >= 2) {
            instructions.push(OP_OR);
            instructions.push(inputVars.length); // Number of inputs
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(outputVar);
          }
          break;
        case 'nandNode':
          if (inputVars.length >= 2) {
            instructions.push(OP_NAND);
            instructions.push(inputVars.length); // Number of inputs
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(outputVar);
          }
          break;
        case 'norNode':
          if (inputVars.length >= 2) {
            instructions.push(OP_NOR);
            instructions.push(inputVars.length); // Number of inputs
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(outputVar);
          }
          break;
        case 'xorNode':
          if (inputVars.length >= 2) {
            instructions.push(OP_XOR);
            instructions.push(inputVars.length); // Number of inputs
            for (const inputVar of inputVars) {
              instructions.push(inputVar);
            }
            instructions.push(outputVar);
          }
          break;
      }
    }
  }
  
  return instructions;
}

// Utility function to convert bytecode to a string for sending to Arduino
export function bytecodeToString(bytecode: number[]): string {
  return bytecode.join(',');
}