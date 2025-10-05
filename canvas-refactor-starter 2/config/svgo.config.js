/**
 * SVGO config that preserves scaling behavior.
 * - KEEP viewBox (never enable removeViewBox)
 * - Optionally remove width/height (use removeDimensions) so viewBox controls size
 */
module.exports = {
  multipass: true,
  plugins: [
    // DO NOT enable 'removeViewBox' – it breaks scaling.
    // { name: 'removeViewBox', active: false },
    { name: 'removeDimensions', active: true },
    { name: 'cleanupAttrs', active: true },
    { name: 'convertStyleToAttrs', active: true },
    { name: 'removeUnknownsAndDefaults', active: true },
  ],
};
