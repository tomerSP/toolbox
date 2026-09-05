var StructuredAppend = (function () {
  'use strict';

  function bytes(value) {
    return value instanceof Uint8Array ? value : new Uint8Array(value);
  }

  function parity(value) {
    var input = bytes(value);
    var result = 0;
    for (var i = 0; i < input.length; i++) result ^= input[i];
    return result;
  }

  function split(value, capacity, maximumParts) {
    var input = bytes(value);
    var max = maximumParts || 16;
    if (capacity < 1) throw new Error('Invalid part capacity');
    var count = Math.ceil(input.length / capacity);
    if (count < 2) count = 2;
    if (count > max) throw new Error('Too much data for ' + max + ' QR codes');

    var parts = [];
    var offset = 0;
    for (var i = 0; i < count; i++) {
      var remaining = input.length - offset;
      var size = Math.ceil(remaining / (count - i));
      parts.push(input.slice(offset, offset + size));
      offset += size;
    }
    return parts;
  }

  function sameBytes(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function Collection() {
    this.reset();
  }

  Collection.prototype.reset = function () {
    this.parity = null;
    this.count = 0;
    this.parts = [];
  };

  Collection.prototype.add = function (header, value) {
    if (!header || header.count < 1 || header.count > 16 ||
        header.index < 0 || header.index >= header.count ||
        header.parity < 0 || header.parity > 255) {
      throw new Error('Invalid Structured Append header');
    }

    var input = bytes(value);
    var replaced = false;
    if (this.parity !== header.parity || this.count !== header.count) {
      replaced = this.count !== 0;
      this.reset();
      this.parity = header.parity;
      this.count = header.count;
    }

    var duplicate = false;
    if (this.parts[header.index]) {
      if (!sameBytes(this.parts[header.index], input)) {
        throw new Error('Conflicting Structured Append part');
      }
      duplicate = true;
    } else {
      this.parts[header.index] = new Uint8Array(input);
    }

    var missing = [];
    var received = 0;
    for (var i = 0; i < this.count; i++) {
      if (this.parts[i]) received++;
      else missing.push(i + 1);
    }

    var combined = null;
    if (!missing.length) {
      var length = 0;
      for (var j = 0; j < this.parts.length; j++) length += this.parts[j].length;
      combined = new Uint8Array(length);
      var offset = 0;
      for (var k = 0; k < this.parts.length; k++) {
        combined.set(this.parts[k], offset);
        offset += this.parts[k].length;
      }
      if (parity(combined) !== this.parity) {
        throw new Error('Structured Append parity mismatch');
      }
    }

    return {
      parity: this.parity,
      count: this.count,
      received: received,
      missing: missing,
      duplicate: duplicate,
      replaced: replaced,
      bytes: combined
    };
  };

  return {
    Collection: Collection,
    parity: parity,
    split: split
  };
})();
