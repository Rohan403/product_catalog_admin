/**
 * Slug generation utility.
 * Uses the `slugify` package with sensible defaults.
 */
'use strict';

const slugify = require('slugify');

/**
 * Convert a string into a URL-safe slug.
 * @param {string} text
 * @returns {string}
 */
function toSlug(text) {
  return slugify(text, {
    lower:      true,
    strict:     true,
    trim:       true,
    replacement: '-',
  });
}

module.exports = { toSlug };
