import { readdir } from 'node:fs/promises';
import { join, sep } from 'node:path';
import { FilePath } from './types';

// import type { Dirent } from 'node:fs';

const readDirectory = async (directory: string, ext?:string): Promise<FilePath[]> => {
    const files = await readdir(directory, {withFileTypes: true})
    const filesPromises = files.map(async (file) => {
        try {
            const absolutePath = join(directory, file.name);
            // const fileStat = await fs.stat(absolutePath)
            if (file.isDirectory()) {
                return await readDirectory(absolutePath, ext);
            }
            
            if(!ext) {
                return {path: directory, name: file.name}; 
            }

            const check = file.name.split(".").slice(-1)[0] === ext

            if (check) return {path: directory, name: file.name};

            return false;

        } catch (err) {
            // error handling
            return [];
        }
    });
    const filesWithArrays = await Promise.all(filesPromises)
    // const flatArray = filesWithArrays.reduce<string[]>((acc, fileOrArray) => fileOrArray ? acc.concat(fileOrArray) : acc, []);
    const flatArray = filesWithArrays.reduce<FilePath[]>((acc, fileOrArray) => fileOrArray ? acc.concat(fileOrArray) : acc, []);
    return flatArray;
}

export {readDirectory}