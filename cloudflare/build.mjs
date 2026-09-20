import {cp, mkdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
const root = dirname(fileURLToPath(import.meta.url));
await rm(join(root, 'dist'), {recursive: true, force: true});
await mkdir(join(root, 'dist'), {recursive: true});
await cp(join(root, 'public'), join(root, 'dist'), {recursive: true});
console.log('GovJob India static frontend built in dist/');
