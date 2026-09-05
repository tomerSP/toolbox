(function () {
  'use strict';

  if (typeof Uint8Array === 'undefined') {
    var Uint8Array = function (value) {
      var length = typeof value === 'number' ? value : value.length;
      this.length = length;
      for (var i = 0; i < length; i++) this[i] = typeof value === 'number' ? 0 : value[i];
    };
    Uint8Array.prototype.slice = function (start, end) {
      var result = new Uint8Array(Math.max(0, end - start));
      for (var i = 0; i < result.length; i++) result[i] = this[start + i];
      return result;
    };
    Uint8Array.prototype.set = function (value, offset) {
      for (var i = 0; i < value.length; i++) this[offset + i] = value[i];
    };
  }

  if (typeof StructuredAppend === 'undefined' && typeof ActiveXObject !== 'undefined') {
    var files = new ActiveXObject('Scripting.FileSystemObject');
    eval(files.OpenTextFile('structured-append.js', 1).ReadAll());
  }

  function assert(value, message) {
    if (!value) throw new Error(message);
  }

  function equalBytes(actual, expected, message) {
    assert(actual.length === expected.length, message + ' length');
    for (var i = 0; i < expected.length; i++) {
      assert(actual[i] === expected[i], message + ' byte ' + i);
    }
  }

  function throws(callback, message) {
    try {
      callback();
    } catch (err) {
      return;
    }
    throw new Error(message);
  }

  assert(StructuredAppend.parity([1, 2, 3, 255]) === 255, 'XOR parity');

  var parts = StructuredAppend.split([0, 1, 2, 3, 4], 3, 16);
  assert(parts.length === 2, 'minimum part count');
  equalBytes(parts[0], [0, 1, 2], 'balanced first part');
  equalBytes(parts[1], [3, 4], 'balanced second part');
  throws(function () { StructuredAppend.split([1, 2, 3], 1, 2); }, 'maximum parts');

  var collection = new StructuredAppend.Collection();
  var header = { count: 3, parity: 7 };
  var status = collection.add({ count: 3, parity: 7, index: 1 }, [3, 4]);
  assert(status.received === 1, 'received count');
  assert(status.missing.join(',') === '1,3', 'missing parts');
  status = collection.add({ count: 3, parity: 7, index: 0 }, [1, 2]);
  assert(status.received === 2, 'out-of-order collection');
  status = collection.add({ count: 3, parity: 7, index: 2 }, [3]);
  assert(status.bytes !== null, 'complete collection');
  equalBytes(status.bytes, [1, 2, 3, 4, 3], 'reassembled bytes');

  status = collection.add({ count: 3, parity: 7, index: 2 }, [3]);
  assert(status.duplicate, 'duplicate detection');
  throws(function () {
    collection.add({ count: 3, parity: 7, index: 2 }, [9]);
  }, 'conflicting part');

  status = collection.add({ count: 2, parity: 0, index: 0 }, [5]);
  assert(status.replaced && status.received === 1, 'new set replacement');
  throws(function () {
    collection.add({ count: 0, parity: 0, index: 0 }, []);
  }, 'invalid header');

  if (typeof WScript !== 'undefined') WScript.Echo('Structured Append checks passed');
  if (typeof document !== 'undefined') document.body.textContent = 'Structured Append checks passed';
})();
