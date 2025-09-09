#include <EEPROM.h>

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
#define OP_TOGGLE 18

const int MAX_INSTRUCTIONS = 300;
const int MAX_VARIABLES = 60;

// EEPROM addresses
#define EEPROM_SIGNATURE 0
#define EEPROM_LENGTH 2
#define EEPROM_DATA 4

// Signature to identify valid data in EEPROM
#define EEPROM_SIG_VALUE 0x55AA

// Global variables for program execution
byte instructions[MAX_INSTRUCTIONS];
int instructionLength = 0;
int variables[MAX_VARIABLES];

// Global variables for timer states
unsigned long previousMillis[MAX_VARIABLES] = {0};
bool timerState[MAX_VARIABLES] = {false};

// Global variables for toggle states
bool toggleState[MAX_VARIABLES] = {false};
bool toggleInitialized[MAX_VARIABLES] = {false};
bool prevInputState[MAX_VARIABLES] = {false};

// Global variables for debouncing
unsigned long lastDebounceTime[MAX_VARIABLES] = {0};
int lastButtonState[MAX_VARIABLES] = {LOW};  // Store the last stable button state

// WebSerial message structure
#define START_BYTE 0x7E

// #define WOKWI // uncomment when using wokwi

void setup() {
  Serial.begin(9600);
  
  // Check if we should load from WebSerial or use fixed bytecode
#ifdef WOKWI
  // For Wokwi simulation, use fixed bytecode
  byte myBytecode[] = {1, 3, 1, 4, 1, 2, 2, 5, 1, 6, 3, 3, 0, 3, 4, 1, 3, 2, 2, 3, 6, 3, 17, 4, 100, 0, 232, 3, 18, 2, 5, 0, 16, 1, 3, 6, 0, 11, 4, 0, 6, 4, 5, 7, 4, 5, 7};

  instructionLength = sizeof(myBytecode) / sizeof(myBytecode[0]);
  for (int i = 0; i < instructionLength; i++) {
    instructions[i] = myBytecode[i];
  }

  Serial.print("Loaded ");
  Serial.print(instructionLength);
  Serial.println(" instructions for Wokwi simulation");
#else
  // For real Arduino, try to load from EEPROM first
  loadFromEEPROM();
  
  // If no valid program in EEPROM, wait for WebSerial transmission
  if (instructionLength == 0) {
    Serial.println("READY");
  } else {
    Serial.print("Loaded ");
    Serial.print(instructionLength);
    Serial.println(" instructions from EEPROM");
  }
#endif
}

void loop() {
#ifndef WOKWI
  // Check for WebSerial data
  if (Serial.available() > 0) {
    processWebSerial();
  }
#endif

  // Execute instructions if we have any
  if (instructionLength > 0) {
    executeInstructions();
  }
}

void processWebSerial() {
  // Wait for start byte
  if (Serial.read() != START_BYTE) {
    return;
  }

  // Wait for length byte
  while (Serial.available() < 1);
  byte length = Serial.read();

  // Wait for all data bytes
  while (Serial.available() < length);

  byte data[length];
  byte checksum = 0;

  // Read data and calculate checksum
  for (int i = 0; i < length; i++) {
    data[i] = Serial.read();
    checksum = (checksum + data[i]) % 256;
  }

  // Wait for and read checksum
  while (Serial.available() < 1);
  byte receivedChecksum = Serial.read();

  // Verify checksum
  if (checksum == receivedChecksum) {
    // Copy data to instructions
    instructionLength = min(length, MAX_INSTRUCTIONS);
    for (int i = 0; i < instructionLength; i++) {
      instructions[i] = data[i];
    }
    
    // Save to EEPROM
    saveToEEPROM();
    
    // Reset all state variables
    resetStateVariables();

    Serial.println("SUCCESS: Bytecode loaded and saved to EEPROM");
  } else {
    Serial.println("ERROR: Checksum mismatch");
  }
  
  // Clear any remaining data in the serial buffer
  while (Serial.available() > 0) {
    Serial.read();
  }
}

void saveToEEPROM() {
  // Write signature
  EEPROM.put(EEPROM_SIGNATURE, EEPROM_SIG_VALUE);
  
  // Write instruction length
  EEPROM.put(EEPROM_LENGTH, instructionLength);
  
  // Write instructions
  for (int i = 0; i < instructionLength; i++) {
    EEPROM.write(EEPROM_DATA + i, instructions[i]);
  }
}

void loadFromEEPROM() {
  // Check signature
  uint16_t signature;
  EEPROM.get(EEPROM_SIGNATURE, signature);
  
  if (signature != EEPROM_SIG_VALUE) {
    // No valid program in EEPROM
    instructionLength = 0;
    return;
  }
  
  // Read instruction length
  EEPROM.get(EEPROM_LENGTH, instructionLength);
  
  // Limit to maximum allowed
  if (instructionLength > MAX_INSTRUCTIONS) {
    instructionLength = MAX_INSTRUCTIONS;
  }
  
  // Read instructions
  for (int i = 0; i < instructionLength; i++) {
    instructions[i] = EEPROM.read(EEPROM_DATA + i);
  }
  
  // Reset all state variables
  resetStateVariables();
}

void resetStateVariables() {
  for (int i = 0; i < MAX_VARIABLES; i++) {
    variables[i] = 0;
    previousMillis[i] = 0;
    timerState[i] = false;
    toggleState[i] = false;
    toggleInitialized[i] = false;
    prevInputState[i] = false;
    lastDebounceTime[i] = 0;
    lastButtonState[i] = LOW;
  }
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

        // Read the pin
        int reading = digitalRead(pin);

        // Improved debounce logic
        if (reading != lastButtonState[varIndex]) {
          // Reset the debouncing timer
          lastDebounceTime[varIndex] = millis();
        }

        if ((millis() - lastDebounceTime[varIndex]) > 30) {
          // Whatever the reading is at, it's been there for longer than the debounce
          // delay, so take it as the actual current state
          if (reading != variables[varIndex]) {
            variables[varIndex] = reading;
          }
        }

        // Save the reading for next time
        lastButtonState[varIndex] = reading;
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
        analogWrite(pin, variables[varIndex] / 4);  // Scale 0-1023 to 0-255
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

        // Handle interval timing
        if (currentMillis - previousMillis[outputVar] >= interval) {
          previousMillis[outputVar] = currentMillis;
          timerState[outputVar] = true;
        }

        // Handle pulse timing
        if (timerState[outputVar] && (currentMillis - previousMillis[outputVar] >= pulseLength)) {
          timerState[outputVar] = false;
        }

        variables[outputVar] = timerState[outputVar];
        break;
      }
      case OP_TOGGLE: {
        byte inputVar = instructions[pc++];
        byte outputVar = instructions[pc++];
        byte initialState = instructions[pc++];

        // Initialize on first run
        if (!toggleInitialized[outputVar]) {
          toggleState[outputVar] = initialState;
          toggleInitialized[outputVar] = true;
          prevInputState[outputVar] = variables[inputVar];
        }

        // Detect rising edge (transition from LOW to HIGH)
        if (variables[inputVar] && !prevInputState[outputVar]) {
          toggleState[outputVar] = !toggleState[outputVar];
        }

        // Store current input for next comparison
        prevInputState[outputVar] = variables[inputVar];

        // Set output to current toggle state
        variables[outputVar] = toggleState[outputVar];
        break;
      }
      case OP_ANALOG_RANGE: {
        byte pin = instructions[pc++];
        unsigned int min = instructions[pc++];
        min |= (instructions[pc++] << 8);
        unsigned int max = instructions[pc++];
        max |= (instructions[pc++] << 8);
        byte outputVar = instructions[pc++];
        
        int value = analogRead(pin);
        variables[outputVar] = (value >= min && value <= max) ? 1 : 0;
        break;
      }
    }
  }
}