import serial
ser = serial.Serial('COM3', 9600)  # Replace 'COM3' with your port
bytecode = [9, 2, 10, 4, 9, 3, 1, 2, 0, 1, 3, 1, 3, 0, 2, 4, 2, 1, 3, 2, 4, 3]
ser.write(bytearray(bytecode))
ser.close()