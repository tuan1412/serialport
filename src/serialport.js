class SerialPort {
  /**
   * @param {Object} options - Configuration options
   * @param {string|string[]} [options.terminators=['\r\n', '\n']] - Response termination character(s)
   * @param {number} [options.timeout=1000] - Default timeout in milliseconds
   */
  constructor(options = {}) {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isReading = false;
    
    // Configure terminators - can be single string or array of strings
    this.terminators = options.terminators || ['\r\n', '\n'];
    if (!Array.isArray(this.terminators)) {
      this.terminators = [this.terminators];
    }
    
    // Sort terminators by length (longest first) to handle multi-char terminators correctly
    this.terminators.sort((a, b) => b.length - a.length);
    
    // Default timeout is 1 second
    this.defaultTimeout = options.timeout || 1000;
  }

  /**
   * Check if Web Serial API is supported
   * @returns {boolean}
   */
  static isSupported() {
    return 'serial' in navigator;
  }

  /**
   * Connect to a serial port
   * @param {Object} options - Connection options
   * @param {number} options.baudRate - Baud rate (default: 9600)
   * @returns {Promise<void>}
   */
  async connect(options = { baudRate: 9600 }) {
    if (!SerialPort.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open(options);
      
      // Create reader and writer
      const textDecoder = new TextDecoderStream();
      const textEncoder = new TextEncoderStream();

      this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);

      this.reader = textDecoder.readable.getReader();
      this.writer = textEncoder.writable.getWriter();
    } catch (error) {
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  /**
   * Disconnect from the serial port
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
      await this.readableStreamClosed.catch(() => {});
    }

    if (this.writer) {
      await this.writer.close();
      await this.writableStreamClosed;
    }

    if (this.port) {
      await this.port.close();
    }

    this.reader = null;
    this.writer = null;
    this.port = null;
  }

  /**
   * Write command to serial port and wait for response with configured terminator
   * @param {string} command - Command to send
   * @param {number} timeout - Timeout in milliseconds (default: this.defaultTimeout)
   * @returns {Promise<{success: boolean, response: string}>} - Response object
   */
  async writeAndWaitForOK(command, timeout = this.defaultTimeout) {
    if (!this.port || !this.writer || !this.reader) {
      throw new Error('Serial port is not connected');
    }

    // Write command with newline if it doesn't have one
    const commandToSend = command.endsWith('\n') ? command : command + '\n';
    await this.writer.write(commandToSend);

    try {
      const response = await this._readUntilTerminator(timeout);
      const hasOK = response.includes('OK');
      return {
        success: hasOK,
        response: response.trim()
      };
    } catch (error) {
      if (error.name === 'TimeoutError') {
        return {
          success: false,
          response: 'Timeout'
        };
      }
      throw error;
    }
  }

  /**
   * Read from serial port until a configured terminator is found
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string>}
   * @private
   */
  async _readUntilTerminator(timeout) {
    return new Promise((resolve, reject) => {
      let buffer = '';
      let timeoutId;

      const readChunk = async () => {
        try {
          const { value, done } = await this.reader.read();
          if (done) {
            reject(new Error('Serial port closed'));
            return;
          }

          buffer += value;
          
          // Check for each configured terminator
          for (const terminator of this.terminators) {
            const endIndex = buffer.indexOf(terminator);
            if (endIndex !== -1) {
              clearTimeout(timeoutId);
              // Get the complete response including the terminator
              const response = buffer.substring(0, endIndex + terminator.length);
              resolve(response);
              return;
            }
          }

          readChunk();
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      };

      timeoutId = setTimeout(() => {
        const error = new Error('Timeout waiting for response');
        error.name = 'TimeoutError';
        reject(error);
      }, timeout);

      readChunk();
    });
  }
}

export default SerialPort; 