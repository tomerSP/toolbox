var TQR1 = function () {
  'use strict';

  var MAGIC = [0x54, 0x51, 0x52, 0x31]; // TQR1
  var ALGORITHM = { stored: 0, 'deflate-raw': 1 };
  var ALGORITHM_MASK = 0x03;
  var HAS_FILENAME = 0x04;
  var HAS_MIME = 0x08;
  var RESERVED_MASK = 0xf0;
  var MAX_UINT32 = 4294967295;

  function fail(message) {
    throw new Error(message);
  }

  function isInteger(value) {
    return typeof value === 'number' && isFinite(value) &&
      Math.floor(value) === value && value >= 0 && value <= MAX_UINT32;
  }

  function copyBytes(bytes, label) {
    if (!bytes || typeof bytes.length !== 'number') fail(label + ' must be byte data.');
    var copy = [];
    for (var i = 0; i < bytes.length; i++) {
      if (!isInteger(bytes[i]) || bytes[i] > 255) fail(label + ' contains an invalid byte.');
      copy.push(bytes[i]);
    }
    return copy;
  }

  function writeVarint(value, output) {
    if (!isInteger(value)) fail('Varint value is outside the supported range.');
    do {
      var byte = value % 128;
      value = Math.floor(value / 128);
      output.push(byte | (value ? 0x80 : 0));
    } while (value);
  }

  function readVarint(bytes, state) {
    var value = 0;
    var factor = 1;
    for (var i = 0; i < 5; i++) {
      if (state.offset >= bytes.length) fail('TQR1 container ends inside a varint.');
      var byte = bytes[state.offset++];
      if (i === 4 && byte > 0x0f) fail('TQR1 varint is outside the supported range.');
      value += (byte & 0x7f) * factor;
      if (!(byte & 0x80)) return value;
      factor *= 128;
    }
    fail('TQR1 varint is too long.');
  }

  function utf8Encode(text) {
    var output = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
        var low = text.charCodeAt(i + 1);
        if (low >= 0xdc00 && low <= 0xdfff) {
          code = 0x10000 + ((code - 0xd800) * 0x400) + low - 0xdc00;
          i++;
        } else {
          code = 0xfffd;
        }
      } else if (code >= 0xd800 && code <= 0xdfff) {
        code = 0xfffd;
      }

      if (code < 0x80) {
        output.push(code);
      } else if (code < 0x800) {
        output.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        output.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        output.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      }
    }
    return output;
  }

  function utf8Decode(bytes) {
    var output = '';
    var i = 0;
    while (i < bytes.length) {
      var first = bytes[i++];
      var code;
      var count;
      var minimum;
      if (first < 0x80) {
        code = first;
        count = 0;
        minimum = 0;
      } else if (first >= 0xc2 && first <= 0xdf) {
        code = first & 0x1f;
        count = 1;
        minimum = 0x80;
      } else if (first >= 0xe0 && first <= 0xef) {
        code = first & 0x0f;
        count = 2;
        minimum = 0x800;
      } else if (first >= 0xf0 && first <= 0xf4) {
        code = first & 0x07;
        count = 3;
        minimum = 0x10000;
      } else {
        fail('TQR1 metadata is not valid UTF-8.');
      }

      if (i + count > bytes.length) fail('TQR1 metadata is not valid UTF-8.');
      for (var j = 0; j < count; j++) {
        var next = bytes[i++];
        if ((next & 0xc0) !== 0x80) fail('TQR1 metadata is not valid UTF-8.');
        code = (code * 64) + (next & 0x3f);
      }
      if (code < minimum || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
        fail('TQR1 metadata is not valid UTF-8.');
      }
      if (code < 0x10000) {
        output += String.fromCharCode(code);
      } else {
        code -= 0x10000;
        output += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
      }
    }
    return output;
  }

  function readText(bytes, state) {
    var length = readVarint(bytes, state);
    if (length > bytes.length - state.offset) fail('TQR1 metadata extends past the container.');
    var value = utf8Decode(bytes.slice(state.offset, state.offset + length));
    state.offset += length;
    return value;
  }

  function isContainer(bytes) {
    return !!bytes && bytes.length >= MAGIC.length &&
      bytes[0] === MAGIC[0] && bytes[1] === MAGIC[1] &&
      bytes[2] === MAGIC[2] && bytes[3] === MAGIC[3];
  }

  function encode(options) {
    options = options || {};
    var payload = copyBytes(options.payload, 'Payload');
    var algorithmName = options.algorithm || 'stored';
    var algorithm = ALGORITHM[algorithmName];
    if (typeof algorithm === 'undefined') fail('Unsupported TQR1 algorithm.');

    var originalLength = typeof options.originalLength === 'undefined'
      ? payload.length
      : options.originalLength;
    if (!isInteger(originalLength)) fail('Original length is outside the supported range.');
    if (algorithm === ALGORITHM.stored && originalLength !== payload.length) {
      fail('Stored payload length does not match original length.');
    }

    var filename = typeof options.filename === 'string' ? options.filename : '';
    var mimeType = typeof options.mimeType === 'string' ? options.mimeType : '';
    var filenameBytes = filename ? utf8Encode(filename) : [];
    var mimeBytes = mimeType ? utf8Encode(mimeType) : [];
    var flags = algorithm |
      (filenameBytes.length ? HAS_FILENAME : 0) |
      (mimeBytes.length ? HAS_MIME : 0);
    var output = MAGIC.slice();
    output.push(flags);
    writeVarint(originalLength, output);
    if (filenameBytes.length) {
      writeVarint(filenameBytes.length, output);
      output = output.concat(filenameBytes);
    }
    if (mimeBytes.length) {
      writeVarint(mimeBytes.length, output);
      output = output.concat(mimeBytes);
    }
    return output.concat(payload);
  }

  function decode(input) {
    var bytes = copyBytes(input, 'Container');
    if (!isContainer(bytes)) fail('Not a TQR1 container.');
    if (bytes.length < 6) fail('TQR1 container is truncated.');

    var state = { offset: MAGIC.length };
    var flags = bytes[state.offset++];
    if (flags & RESERVED_MASK) fail('TQR1 container uses reserved flags.');
    var algorithm = flags & ALGORITHM_MASK;
    if (algorithm !== ALGORITHM.stored && algorithm !== ALGORITHM['deflate-raw']) {
      fail('TQR1 container uses an unsupported algorithm.');
    }

    var originalLength = readVarint(bytes, state);
    var filename = flags & HAS_FILENAME ? readText(bytes, state) : '';
    var mimeType = flags & HAS_MIME ? readText(bytes, state) : '';
    var payload = bytes.slice(state.offset);
    if (algorithm === ALGORITHM.stored && payload.length !== originalLength) {
      fail('Stored TQR1 payload length does not match its header.');
    }

    return {
      algorithm: algorithm === ALGORITHM.stored ? 'stored' : 'deflate-raw',
      originalLength: originalLength,
      filename: filename,
      mimeType: mimeType,
      payload: payload
    };
  }

  function streamError(message, code) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  function transformBytes(bytes, Constructor, unsupportedMessage) {
    if (typeof Constructor === 'undefined') {
      return Promise.reject(streamError(unsupportedMessage, 'unsupported'));
    }

    var stream;
    try {
      stream = new Constructor('deflate-raw');
    } catch (err) {
      return Promise.reject(streamError(unsupportedMessage, 'unsupported'));
    }

    var reader = stream.readable.getReader();
    var writer = stream.writable.getWriter();
    var chunks = [];
    var total = 0;

    function readNext() {
      return reader.read().then(function (result) {
        if (result.done) {
          var output = new Uint8Array(total);
          var offset = 0;
          chunks.forEach(function (chunk) {
            output.set(chunk, offset);
            offset += chunk.length;
          });
          return Array.prototype.slice.call(output);
        }
        chunks.push(result.value);
        total += result.value.length;
        return readNext();
      });
    }

    var outputPromise = readNext();
    var inputPromise = writer.write(new Uint8Array(bytes))
      .then(function () { return writer.close(); });
    return Promise.all([outputPromise, inputPromise])
      .then(function (results) { return results[0]; });
  }

  function pack(options) {
    options = options || {};
    var payload = copyBytes(options.payload, 'Payload');
    var stored = encode({
      payload: payload,
      filename: options.filename,
      mimeType: options.mimeType
    });

    if (typeof CompressionStream === 'undefined') {
      return Promise.resolve({ bytes: stored, algorithm: 'stored', reason: 'unsupported' });
    }

    return transformBytes(payload, CompressionStream,
      'This browser cannot create DEFLATE raw streams.')
      .then(function (compressed) {
        var packed = encode({
          algorithm: 'deflate-raw',
          originalLength: payload.length,
          payload: compressed,
          filename: options.filename,
          mimeType: options.mimeType
        });
        return packed.length < stored.length
          ? { bytes: packed, algorithm: 'deflate-raw', reason: 'smaller' }
          : { bytes: stored, algorithm: 'stored', reason: 'not-smaller' };
      }, function (err) {
        return {
          bytes: stored,
          algorithm: 'stored',
          reason: err && err.code === 'unsupported' ? 'unsupported' : 'failed'
        };
      });
  }

  function unpack(input) {
    var container = decode(input);
    if (container.algorithm === 'stored') return Promise.resolve(container);

    return transformBytes(container.payload,
      typeof DecompressionStream === 'undefined' ? undefined : DecompressionStream,
      'This browser cannot open DEFLATE raw streams.')
      .then(function (payload) {
        if (payload.length !== container.originalLength) {
          fail('Decompressed TQR1 payload length does not match its header.');
        }
        container.payload = payload;
        return container;
      });
  }

  return {
    decode: decode,
    encode: encode,
    isContainer: isContainer,
    pack: pack,
    unpack: unpack
  };
}();
