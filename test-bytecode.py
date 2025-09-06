import json

# Define opcodes
OP_READ_PIN = 1
OP_WRITE_PIN = 2
OP_NOT = 3
OP_AND = 4
OP_OR = 5
OP_NAND = 6
OP_NOR = 7
OP_XOR = 8
OP_SET_PIN_MODE_INPUT = 9
OP_SET_PIN_MODE_OUTPUT = 10

# Load JSON configuration
data = json.load(open('C:/Users/KErbal/Downloads/my-logic-project(4).json'))  # Replace with your JSON file path

nodes = data['nodes']
edges = data['edges']

# Build graph and in-degree map
graph = {}
in_degree = {}
node_dict = {}
for node in nodes:
    node_id = node['id']
    graph[node_id] = []
    in_degree[node_id] = 0
    node_dict[node_id] = node

for edge in edges:
    source = edge['source']
    target = edge['target']
    graph[source].append(target)
    in_degree[target] += 1

# Topological sort
queue = [node_id for node_id, deg in in_degree.items() if deg == 0]
topological_order = []
while queue:
    node_id = queue.pop(0)
    topological_order.append(node_id)
    for neighbor in graph[node_id]:
        in_degree[neighbor] -= 1
        if in_degree[neighbor] == 0:
            queue.append(neighbor)

# Assign variable indices to non-output nodes
var_index_map = {}
var_count = 0
for node_id in topological_order:
    node = node_dict[node_id]
    if node['type'] != 'outputNode':
        var_index_map[node_id] = var_count
        var_count += 1

# Generate instructions
instructions = []

# Set pin modes for input and output nodes
for node in nodes:
    if node['type'] == 'inputNode':
        pin = int(node['data']['pin'])
        instructions.append(OP_SET_PIN_MODE_INPUT)
        instructions.append(pin)
    elif node['type'] == 'outputNode':
        pin = int(node['data']['pin'])
        instructions.append(OP_SET_PIN_MODE_OUTPUT)
        instructions.append(pin)

# Generate instructions for each node in topological order
for node_id in topological_order:
    node = node_dict[node_id]
    if node['type'] == 'inputNode':
        pin = int(node['data']['pin'])
        var_index = var_index_map[node_id]
        instructions.append(OP_READ_PIN)
        instructions.append(pin)
        instructions.append(var_index)
    elif node['type'] == 'outputNode':
        # Find the source node connected to this output
        source_node_id = None
        for edge in edges:
            if edge['target'] == node_id:
                source_node_id = edge['source']
                break
        if source_node_id is None:
            source_var = 0  #Default to 0 if no source
        else:
            source_var = var_index_map[source_node_id]
        pin = int(node['data']['pin'])
        instructions.append(OP_WRITE_PIN)
        instructions.append(pin)
        instructions.append(source_var)
    else:
        # Logic gate node
        gate_type = node['type']
        input_vars = []
        for edge in edges:
            if edge['target'] == node_id:
                source_node_id = edge['source']
                input_vars.append(var_index_map[source_node_id])
        output_var = var_index_map[node_id]
        if gate_type == 'notNode':
            instructions.append(OP_NOT)
            instructions.append(input_vars[0])
            instructions.append(output_var)
        elif gate_type == 'andNode':
            instructions.append(OP_AND)
            instructions.append(input_vars[0])
            instructions.append(input_vars[1])
            instructions.append(output_var)
        elif gate_type == 'orNode':
            instructions.append(OP_OR)
            instructions.append(input_vars[0])
            instructions.append(input_vars[1])
            instructions.append(output_var)
        # Add other gate types as needed (e.g., NAND, NOR, XOR)

# Output the instructions as a byte array
print("Bytecode instructions:", instructions)
# You can send this byte array to Arduino via serial