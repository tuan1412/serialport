# Serial-Lib

A modern JavaScript library for serial port communication in the browser using the Web Serial API.

## Features

- Easy connection to serial ports in the browser
- Write commands and wait for responses
- Automatic timeout handling
- Promise-based API
- Built-in "OK" response handling

## Installation

```bash
npm install serial-lib
```

## Usage

```javascript
import SerialLib from 'serial-lib';

// Create a new instance
const serial = new SerialLib();

// Check if Web Serial API is supported
if (!SerialLib.isSupported()) {
  console.error('Web Serial API is not supported in this browser');
}

// Connect to a serial port
try {
  await serial.connect({ baudRate: 9600 });
  console.log('Connected to serial port');
} catch (error) {
  console.error('Failed to connect:', error);
}

// Write a command and wait for OK response
try {
  const success = await serial.writeAndWaitForOK('AT');
  if (success) {
    console.log('Received OK response');
  } else {
    console.log('Timeout waiting for OK response');
  }
} catch (error) {
  console.error('Error:', error);
}

// Disconnect when done
await serial.disconnect();
```

## API Reference

### `SerialLib`

#### Constructor

```javascript
const serial = new SerialLib();
```

#### Static Methods

- `SerialLib.isSupported()`: Returns boolean indicating if Web Serial API is supported

#### Instance Methods

- `connect(options)`: Connect to a serial port
  - `options.baudRate`: Baud rate (default: 9600)
  - Returns: Promise<void>

- `disconnect()`: Disconnect from the serial port
  - Returns: Promise<void>

- `writeAndWaitForOK(command, timeout)`: Write a command and wait for OK response
  - `command`: String command to send
  - `timeout`: Timeout in milliseconds (default: 5000)
  - Returns: Promise<boolean>

## Browser Support

The Web Serial API is currently supported in:
- Chrome/Chromium-based browsers (version 89 or later)
- Edge (version 89 or later)

## License

MIT 