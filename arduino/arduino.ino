// Simplified Opcodes
#define OP_SET_PIN_MODE_INPUT 1
#define OP_SET_PIN_MODE_OUTPUT 2
#define OP_READ_PIN 3
#define OP_WRITE_PIN 4
#define OP_READ_ANALOG_PIN 5
#define OP_WRITE_ANALOG_PIN 6
#define OP_NOT 10
#define OP_AND 11
#define OP_OR 12
#define OP_NAND 13
#define OP_NOR 14
#define OP_XOR 15
#define OP_LATCH 16
#define OP_PULSE 17
#define OP_DELAY 30

const int MAX_INSTRUCTIONS = 100;
const int MAX_VARIABLES = 20;

// global variables for timer states
unsigned long previousMillis[MAX_VARIABLES] = {0};
bool timerState[MAX_VARIABLES] = {false};

byte instructions[MAX_INSTRUCTIONS];
int instructionLength = 0;
int variables[MAX_VARIABLES];

void setup() {
  Serial.begin(9600);
  
  // Directly assign your bytecode to the instructions array
  byte myBytecode[] = {1,3,1,4,1,2,2,5,1,6,3,3,0,3,4,1,3,2,2,3,6,3,16,1,3,4,0,11,3,2,0,4,5,4,5,5};
  
  // Copy the bytecode to the instructions array
  instructionLength = sizeof(myBytecode) / sizeof(myBytecode[0]);
  for (int i = 0; i < instructionLength; i++) {
    instructions[i] = myBytecode[i];
  }
  
  Serial.print("Loaded ");
  Serial.print(instructionLength);
  Serial.println(" instructions");
}

void loop() {
  if (instructionLength > 0) {
    executeInstructions();
  }
  delay(10);
}

void executeInstructions() {
  int pc = 0;
  while (pc < instructionLength) {
    byte opcode = instructions[pc++];
    
    switch (opcode) {
      case OP_SET_PIN_MODE_INPUT: {
        byte pin = instructions[pc++];
        pinMode(pin, INPUT);
        break;
      }
      case OP_SET_PIN_MODE_OUTPUT: {
        byte pin = instructions[pc++];
        pinMode(pin, OUTPUT);
        break;
      }
      case OP_READ_PIN: {
        byte pin = instructions[pc++];
        byte varIndex = instructions[pc++];
        variables[varIndex] = digitalRead(pin);
        break;
      }
      case OP_WRITE_PIN: {
        byte pin = instructions[pc++];
        byte varIndex = instructions[pc++];
        digitalWrite(pin, variables[varIndex]);
        break;
      }
      case OP_READ_ANALOG_PIN: {
        byte pin = instructions[pc++];
        byte varIndex = instructions[pc++];
        variables[varIndex] = analogRead(pin);
        break;
      }
      case OP_WRITE_ANALOG_PIN: {
        byte pin = instructions[pc++];
        byte varIndex = instructions[pc++];
        analogWrite(pin, variables[varIndex] / 4); // Scale 0-1023 to 0-255
        break;
      }
      case OP_NOT: {
        byte inputVar = instructions[pc++];
        byte outputVar = instructions[pc++];
        variables[outputVar] = !variables[inputVar];
        break;
      }
      case OP_AND: {
        byte numInputs = instructions[pc++];
        bool result = true;
        for (byte i = 0; i < numInputs; i++) {
          byte inputVar = instructions[pc++];
          result = result && variables[inputVar];
        }
        byte outputVar = instructions[pc++];
        variables[outputVar] = result;
        break;
      }
      case OP_OR: {
        byte numInputs = instructions[pc++];
        bool result = false;
        for (byte i = 0; i < numInputs; i++) {
          byte inputVar = instructions[pc++];
          result = result || variables[inputVar];
        }
        byte outputVar = instructions[pc++];
        variables[outputVar] = result;
        break;
      }
      case OP_NAND: {
        byte numInputs = instructions[pc++];
        bool result = true;
        for (byte i = 0; i < numInputs; i++) {
          byte inputVar = instructions[pc++];
          result = result && variables[inputVar];
        }
        byte outputVar = instructions[pc++];
        variables[outputVar] = !result;
        break;
      }
      case OP_NOR: {
        byte numInputs = instructions[pc++];
        bool result = false;
        for (byte i = 0; i < numInputs; i++) {
          byte inputVar = instructions[pc++];
          result = result || variables[inputVar];
        }
        byte outputVar = instructions[pc++];
        variables[outputVar] = !result;
        break;
      }
      case OP_XOR: {
        byte numInputs = instructions[pc++];
        bool result = false;
        for (byte i = 0; i < numInputs; i++) {
          byte inputVar = instructions[pc++];
          result = result != variables[inputVar];
        }
        byte outputVar = instructions[pc++];
        variables[outputVar] = result;
        break;
      }
      case OP_DELAY: {
        byte delayTime = instructions[pc++];
        delay(delayTime * 10);
        break;
      }
      case OP_LATCH: {
        byte setVar = instructions[pc++];
        byte resetVar = instructions[pc++];
        byte outputVar = instructions[pc++];
        byte initialState = instructions[pc++];
        
        static bool latchInitialized[MAX_VARIABLES] = {false};
        static bool latchState[MAX_VARIABLES] = {false};
        
        // Initialize on first run
        if (!latchInitialized[outputVar]) {
          latchState[outputVar] = initialState;
          latchInitialized[outputVar] = true;
        }
        
        // Set/reset logic
        if (variables[setVar] && !variables[resetVar]) {
          latchState[outputVar] = true;
        } else if (!variables[setVar] && variables[resetVar]) {
          latchState[outputVar] = false;
        }
        // If both are high, behavior depends on implementation
        // Here we'll make it toggle (like a JK flip-flop)
        else if (variables[setVar] && variables[resetVar]) {
          latchState[outputVar] = !latchState[outputVar];
        }
        
        variables[outputVar] = latchState[outputVar];
        break;
      }
      case OP_PULSE: {
        byte outputVar = instructions[pc++];
        unsigned int pulseLength = instructions[pc++];
        pulseLength |= (instructions[pc++] << 8);
        unsigned int interval = instructions[pc++];
        interval |= (instructions[pc++] << 8);
        
        unsigned long currentMillis = millis();
        
        if (currentMillis - previousMillis[outputVar] >= interval) {
          previousMillis[outputVar] = currentMillis;
          timerState[outputVar] = true;
        }
        
        if (timerState[outputVar] && (currentMillis - previousMillis[outputVar] >= pulseLength)) {
          timerState[outputVar] = false;
        }
        
        variables[outputVar] = timerState[outputVar];
        break;
      }
    }
  }
}