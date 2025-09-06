#include <EEPROM.h>

// Opcodes
#define OP_READ_PIN 1
#define OP_WRITE_PIN 2
#define OP_NOT 3
#define OP_AND 4
#define OP_OR 5
#define OP_NAND 6
#define OP_NOR 7
#define OP_XOR 8
#define OP_SET_PIN_MODE_INPUT 9
#define OP_SET_PIN_MODE_OUTPUT 10
#define OP_SET_PIN_MODE_ANALOG_INPUT 11
#define OP_SET_PIN_MODE_PWM_OUTPUT 12
#define OP_READ_ANALOG_PIN 13
#define OP_WRITE_ANALOG_PIN 14
#define OP_DELAY 15

const int MAX_INSTRUCTIONS = 100;
const int MAX_VARIABLES = 20;

byte instructions[MAX_INSTRUCTIONS];
int instructionLength = 0;
int variables[MAX_VARIABLES];

// Manual bytecode for testing (your example)
byte manualBytecode[] = {9, 2, 10, 4, 9, 3, 1, 2, 0, 1, 3, 1, 3, 0, 2, 4, 2, 1, 3, 2, 4, 3};

void setup() {
  Serial.begin(9600);
  
  // For Wokwi testing, use manual bytecode
  // For real use, comment this out and use EEPROM or serial
  setManualBytecode();
  
  // Uncomment below for normal operation
  // loadInstructionsFromEEPROM();
  // if (instructionLength == 0) {
  //   readInstructionsFromSerial();
  // }
}

void loop() {
  if (instructionLength > 0) {
    executeInstructions();
  }
  delay(10);
}

void setManualBytecode() {
  instructionLength = sizeof(manualBytecode) / sizeof(manualBytecode[0]);
  for (int i = 0; i < instructionLength; i++) {
    instructions[i] = manualBytecode[i];
  }
  Serial.println("Manual bytecode loaded");
}

void readInstructionsFromSerial() {
  Serial.println("Waiting for bytecode...");
  while (Serial.available() == 0) {
    delay(10);
  }
  
  instructionLength = 0;
  while (Serial.available() > 0 && instructionLength < MAX_INSTRUCTIONS) {
    instructions[instructionLength] = Serial.read();
    instructionLength++;
    delay(5); // Small delay for serial data to arrive
  }
  
  saveInstructionsToEEPROM();
  Serial.println("Bytecode received and saved");
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
      case OP_SET_PIN_MODE_ANALOG_INPUT: {
        byte pin = instructions[pc++];
        pinMode(pin, INPUT);
        break;
      }
      case OP_SET_PIN_MODE_PWM_OUTPUT: {
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
        // Scale from 0-1023 to 0-255 for PWM
        analogWrite(pin, variables[varIndex] / 4);
        break;
      }
      case OP_NOT: {
        byte inputVar = instructions[pc++];
        byte outputVar = instructions[pc++];
        variables[outputVar] = !variables[inputVar];
        break;
      }
      case OP_AND: {
        byte inputVar1 = instructions[pc++];
        byte inputVar2 = instructions[pc++];
        byte outputVar = instructions[pc++];
        variables[outputVar] = variables[inputVar1] && variables[inputVar2];
        break;
      }
      case OP_OR: {
        byte inputVar1 = instructions[pc++];
        byte inputVar2 = instructions[pc++];
        byte outputVar = instructions[pc++];
        variables[outputVar] = variables[inputVar1] || variables[inputVar2];
        break;
      }
      case OP_NAND: {
        byte inputVar1 = instructions[pc++];
        byte inputVar2 = instructions[pc++];
        byte outputVar = instructions[pc++];
        variables[outputVar] = !(variables[inputVar1] && variables[inputVar2]);
        break;
      }
      case OP_NOR: {
        byte inputVar1 = instructions[pc++];
        byte inputVar2 = instructions[pc++];
        byte outputVar = instructions[pc++];
        variables[outputVar] = !(variables[inputVar1] || variables[inputVar2]);
        break;
      }
      case OP_XOR: {
        byte inputVar1 = instructions[pc++];
        byte inputVar2 = instructions[pc++];
        byte outputVar = instructions[pc++];
        variables[outputVar] = variables[inputVar1] != variables[inputVar2];
        break;
      }
      case OP_DELAY: {
        byte delayTime = instructions[pc++];
        delay(delayTime * 10); // Delay in increments of 10ms
        break;
      }
    }
  }
}

void loadInstructionsFromEEPROM() {
  instructionLength = EEPROM.read(0);
  if (instructionLength > MAX_INSTRUCTIONS) {
    instructionLength = 0;
    return;
  }
  for (int i = 0; i < instructionLength; i++) {
    instructions[i] = EEPROM.read(i + 1);
  }
}

void saveInstructionsToEEPROM() {
  EEPROM.write(0, instructionLength);
  for (int i = 0; i < instructionLength; i++) {
    EEPROM.write(i + 1, instructions[i]);
  }
}