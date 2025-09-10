// Enhanced bytecode-gen.ts with Analog Range support
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

// Function to generate bytecode with dynamic input handling
export function generateBytecode(config: LogicConfig): number[] {
  const { nodes, edges } = config;
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
        if (currentNode.type === 'analogNode') return true;
        
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
    } else if (node.type === 'analogNode') {
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