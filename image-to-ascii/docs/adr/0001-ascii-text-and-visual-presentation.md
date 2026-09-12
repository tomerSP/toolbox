# Keep ASCII text separate from visual presentation

Image-to-ASCII targets reusable text as well as attractive artwork. Keep its
text format strictly printable ASCII; color, fonts, and character overlap belong
to visual presentation rather than the plain-text output contract. Unicode
blocks and Braille are outside the product boundary: they would expand the
character vocabulary beyond ASCII, while overlap cannot be faithfully preserved
in plain text.

This records the settled boundary in the
[Image-to-ASCII roadmap](../roadmap.md); it does not imply
that visual-export mode has shipped. Release scope, rendering choices, and
unresolved experiments remain in the roadmap.
