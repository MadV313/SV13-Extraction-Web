import fs from 'node:fs';
import path from 'node:path';
import { verifyKnowledgeDir, copyDir } from './knowledge-lib.mjs';

const sourceArg = process.argv[2];
if (!sourceArg) {
  console.error('Usage: node tools/sync-knowledge.mjs "C:\\...\\SV13_Knowledge\\Latest"');
  process.exit(2);
}
const source = path.resolve(sourceArg);
const root = path.resolve(import.meta.dirname, '..');
const dest = path.join(root, 'knowledge', 'Latest');
verifyKnowledgeDir(source);
const staging = path.join(root, 'knowledge', '.Latest-staging');
copyDir(source, staging);
verifyKnowledgeDir(staging);
fs.rmSync(dest, { recursive: true, force: true });
fs.renameSync(staging, dest);
console.log('SV13 knowledge synced successfully');
console.log('From:', source);
console.log('To:  ', dest);
