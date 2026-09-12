# Image-to-ASCII language

Domain vocabulary for the toolbox's Image-to-ASCII tool.

## Language

**ASCII artwork**:
An image represented by an arrangement of printable ASCII characters.
_Avoid_: Unicode art, Braille art (different formats).

**Source image**:
The original image being represented as ASCII artwork.
_Avoid_: Upload (implies transferring the image away from the user's device).

**Character cell**:
The region of the artwork occupied by one character.

**Character density**:
The visual darkness of a character in a particular font.
_Avoid_: Detail (describes the artwork's complexity, not a character's darkness).

**Character map**:
The set of characters available to represent the source image.

**Tonal conversion**:
Representation of an image's brightness regions through character density.
_Avoid_: Structural glyph matching (represents shape within a character cell).

**Structural glyph matching**:
Representation of the shape within a character cell through the shape of a character.

**Text mode**:
ASCII artwork as plain text, independent of visual styling.
_Avoid_: Visual-export mode (includes presentation that plain text cannot preserve).

**Visual-export mode**:
ASCII artwork with visual presentation such as color, fonts, or character overlap.
_Avoid_: Text mode (does not carry that presentation).

**Character overlap**:
Horizontal or vertical overlap between neighboring characters in a visual presentation.
