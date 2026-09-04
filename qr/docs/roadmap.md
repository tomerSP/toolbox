# QR roadmap

Planning for the QR subsite. The shipped page and vendored library remain the
source of truth for current behavior.

## Current state

- Encodes text, URLs, Wi-Fi credentials, and small files.
- Files are wrapped in base64 `data:` URIs, reducing the practical capacity to
  about 2 KB.
- Text uses Numeric, Alphanumeric, or Byte mode based on the full payload.
- Non-ASCII text is encoded as UTF-8.
- Files can use compatible base64 `data:` URIs or higher-capacity raw bytes.
- Packed files preserve metadata and use DEFLATE raw when it reduces total size.
- Packed encoding falls back to stored bytes when compression is unavailable,
  fails, or makes the container larger.
- Decodes QR codes from uploaded images as text or downloadable raw bytes.
- Copies generated QR images and pastes QR images through the clipboard.

## Product boundary

Keep two modes visibly separate:

- **Standard:** output should work with ordinary QR scanners.
- **Packed:** compressed, framed output that only this site promises to decode.

Never present Packed output as universally compatible.

## Capacity

At QR version 40 and error-correction level L, the byte-mode ceiling is 2,953
bytes.

| Encoding | Approximate payload | Compatibility |
| --- | ---: | --- |
| Base64 `data:` URI | 2,187 bytes | Ordinary scanners |
| Raw bytes | 2,953 bytes | Scannable, but generic apps may not reconstruct the file |
| DEFLATE, typical text/data | 6–9 KB before compression | This site's decoder |
| Structured Append | Up to 16 symbols | Scanner support varies |

Compression usually saves 2–3× on text and structured data. It provides little
benefit for JPEG, PNG, ZIP, MP4, and other already-compressed formats. Small
inputs can grow, so Packed mode must store the original whenever compression is
not smaller.

## Packed format

Use a small versioned container:

```text
magic     "TQR1"       4 bytes
flags                  algorithm, filename present, MIME type present
origLen   varint       original byte length
[name]    varint length + UTF-8 bytes
[mime]    varint length + UTF-8 bytes
payload                stored or compressed bytes
```

Flags use bits 0–1 for the algorithm (`0` stored, `1` DEFLATE raw), bit 2 for
the filename, and bit 3 for the MIME type. Bits 4–7 are reserved and must be
zero. Lengths are unsigned LEB128 varints limited to 32 bits. Decoders reject
unknown algorithms, reserved flags, invalid UTF-8 metadata, and truncated data.

Use `deflate-raw` through the browser's `CompressionStream`. QR error
correction already protects the encoded stream, so gzip or zlib wrapper bytes
are unnecessary.

## Delivery sequence

### F1 — Use QR capacity better

- [x] Select Numeric, Alphanumeric, or Byte mode for whole payloads.
- [x] Keep the capacity meter aligned with that mode and correction level.
- [x] Add raw-byte file encoding with an honest compatibility explanation.

### F2 — Packed round trip

- [x] Implement and test the versioned `TQR1` container codec.
- [x] Add stored Packed file encoding and restore its metadata when decoding.
- [x] Add `TQR1` encoding with `deflate-raw` and stored fallback.
- [x] Vendor a QR reader with its license.
- [x] Decode uploaded images in-browser as text or raw bytes.
- [x] Add clipboard copy and paste for QR images.
- [x] Restore file metadata from Packed codes.
- [x] Separate Standard, Packed, and Raw file formats visibly in the UI.
- Consider camera input only after image upload is reliable.

### F3 — Multiple codes

- Implement QR Structured Append, limited to 16 symbols.
- Show set identity, part count, and missing parts during decoding.
- Test interoperability, while guaranteeing reconstruction in this site.

## Parked

- **Brotli:** modest improvement does not yet justify a vendored encoder.
- **rMQR:** lower capacity, limited relevance, and unsupported by the current
  encoder.
- **Server storage or paid APIs:** outside the site's offline, free-hosting
  constraints.
- **Custom multi-code framing:** prefer the QR Structured Append standard.

## Open questions

- Should Packed mode share this page with Standard mode or become a separate
  subsite for clearer search intent?
- Is Packed mode useful enough to justify a decoder and private format?
- Is camera decoding worth its permissions and testing surface after upload
  decoding ships?
