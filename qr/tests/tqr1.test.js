(function () {
  'use strict';

  if (typeof TQR1 === 'undefined' && typeof ActiveXObject !== 'undefined') {
    var files = new ActiveXObject('Scripting.FileSystemObject');
    eval(files.OpenTextFile('tqr1.js', 1).ReadAll());
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

  var minimal = TQR1.encode({ payload: [1, 2, 255] });
  equalBytes(minimal, [0x54, 0x51, 0x52, 0x31, 0, 3, 1, 2, 255], 'minimal container');
  assert(TQR1.isContainer(minimal), 'magic detection');
  assert(!TQR1.isContainer([0x54, 0x51, 0x52, 0x32]), 'version rejection');

  var unicodeFilename = 'caf\u00e9-\ud83d\ude00.txt';
  var metadata = TQR1.decode(TQR1.encode({
    payload: [10, 20],
    filename: unicodeFilename,
    mimeType: 'text/plain'
  }));
  assert(metadata.algorithm === 'stored', 'stored algorithm');
  assert(metadata.originalLength === 2, 'stored original length');
  assert(metadata.filename === unicodeFilename, 'UTF-8 filename');
  assert(metadata.mimeType === 'text/plain', 'MIME type');
  equalBytes(metadata.payload, [10, 20], 'stored payload');

  var compressed = TQR1.decode(TQR1.encode({
    algorithm: 'deflate-raw',
    originalLength: 16384,
    payload: [120, 1]
  }));
  assert(compressed.algorithm === 'deflate-raw', 'compressed algorithm');
  assert(compressed.originalLength === 16384, 'multi-byte varint');
  equalBytes(compressed.payload, [120, 1], 'compressed payload');

  var maximum = TQR1.decode(TQR1.encode({
    algorithm: 'deflate-raw',
    originalLength: 4294967295,
    payload: []
  }));
  assert(maximum.originalLength === 4294967295, 'maximum varint');

  throws(function () { TQR1.decode([0x54, 0x51, 0x52, 0x31, 0, 0x80]); }, 'truncated varint');
  throws(function () { TQR1.decode([0x54, 0x51, 0x52, 0x31, 0x10, 0]); }, 'reserved flags');
  throws(function () { TQR1.decode([0x54, 0x51, 0x52, 0x31, 0x02, 0]); }, 'unknown algorithm');
  throws(function () { TQR1.decode([0x54, 0x51, 0x52, 0x31, 0, 2, 1]); }, 'stored length mismatch');
  throws(function () {
    TQR1.decode([0x54, 0x51, 0x52, 0x31, 0x04, 0, 2, 0xc0, 0x80]);
  }, 'invalid UTF-8');
  throws(function () { TQR1.encode({ payload: [256] }); }, 'invalid payload byte');
  throws(function () {
    TQR1.encode({ payload: [1], originalLength: 2 });
  }, 'stored encode length mismatch');

  if (typeof WScript !== 'undefined') WScript.Echo('TQR1 checks passed');
  if (typeof document !== 'undefined') {
    var repeated = [];
    for (var i = 0; i < 4096; i++) repeated.push(65);
    TQR1.pack({ payload: repeated, filename: 'repeat.txt', mimeType: 'text/plain' })
      .then(function (packed) {
        if (packed.algorithm === 'stored') {
          assert(packed.reason === 'unsupported' || packed.reason === 'failed',
            'unavailable compression falls back to stored');
          return null;
        }
        assert(packed.algorithm === 'deflate-raw', 'compressible payload uses DEFLATE raw');
        assert(packed.bytes.length < repeated.length, 'compressed container is smaller');
        return TQR1.unpack(packed.bytes);
      })
      .then(function (unpacked) {
        if (!unpacked) return null;
        assert(unpacked.algorithm === 'deflate-raw', 'compressed algorithm round trip');
        assert(unpacked.filename === 'repeat.txt', 'compressed filename round trip');
        assert(unpacked.mimeType === 'text/plain', 'compressed MIME round trip');
        equalBytes(unpacked.payload, repeated, 'compressed payload round trip');
        return TQR1.pack({ payload: [1] });
      })
      .then(function (packed) {
        if (packed) {
          assert(packed.algorithm === 'stored', 'larger compression falls back to stored');
          assert(packed.reason === 'not-smaller', 'stored fallback reason');
        }
        document.body.textContent = 'TQR1 checks passed';
      })
      .then(null, function (err) {
        document.body.textContent = 'TQR1 checks failed: ' + err.message;
        document.body.style.color = 'red';
      });
  }
})();
