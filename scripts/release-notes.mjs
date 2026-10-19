#!/usr/bin/env node
/**
 * Prints the CHANGELOG.md section of a version, without its heading, for the
 * GitHub release notes.
 *
 * Usage: node scripts/release-notes.mjs 2.1.3
 */
import { readFileSync } from 'node:fs';

const version = process.argv[2];
if (!version) {
    console.error('Usage: node scripts/release-notes.mjs <version>');
    process.exit(1);
}
const sections = readFileSync('CHANGELOG.md', 'utf8').split(/^## /m);
const section = sections.find(s => s.startsWith(`[${version}]`) || s.startsWith(`${version} `));
if (!section) {
    console.error(`No CHANGELOG.md section for ${version}`);
    process.exit(1);
}
process.stdout.write(section.slice(section.indexOf('\n') + 1).trim() + '\n');
