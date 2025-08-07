import fs from 'node:fs';
import path from 'node:path';

export const dirExists = (foundPath: string): boolean => {
  return fs.existsSync(foundPath);
};

/**
 * @description Reads a JSON file and returns the parsed content
 * @param file - The path to the JSON file
 * @returns The parsed JSON content
 */
export const readJsonFile = async (filePath: string) => {
  const data = await fs.promises.readFile(filePath, {
    encoding: 'utf8',
  });

  return JSON.parse(data);
};

/**
 * @description Reads a file asynchronously and returns the parsed JSON content
 * @param filePath - The path to the JSON file
 * @returns A promise that resolves to the parsed JSON content
 */
export const writeJsonFile = async (
  filePath: string,
  data: object
): Promise<void> => {
  const fullpath = path.resolve(filePath);
  const dir = path.dirname(fullpath);

  // Ensure the directory exists
  if (!dirExists(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  // Write the file asynchronously
  // Use 'utf8' encoding to ensure the file is written as a text file
  await fs.promises.writeFile(fullpath, JSON.stringify(data, null, 2), {
    encoding: 'utf8',
  });
};

/**
 * @description Reads a Markdown file asynchronously
 * @param filePath - The path to the Markdown file
 * @returns A promise that resolves to the content of the Markdown file
 */
export const readMdFile = async (filePath: string) => {
  // Read the file asynchronously
  // Use 'utf8' encoding to ensure the file is read as a text file
  const data = await fs.promises.readFile(filePath, {
    encoding: 'utf8',
  });

  return data;
};

/**
 * @description Writes data to a file asynchronously
 * @param filePath - The path to the file
 * @param data - The data to write to the file
 * @returns A promise that resolves when the write operation is complete
 */
export const writeMdFile = async (
  filePath: string,
  data: string
): Promise<void> => {
  const fullpath = path.resolve(filePath);
  const dir = path.dirname(fullpath);

  // Ensure the directory exists
  if (!dirExists(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  // Write the file asynchronously
  // Use 'utf8' encoding to ensure the file is written as a text file
  await fs.promises.writeFile(fullpath, data, {
    encoding: 'utf8',
  });
};

/**
 * @description Appends data to a file asynchronously
 * @param filePath - The path to the file
 * @param data - The data to append to the file
 * @returns A promise that resolves when the append operation is complete
 */
export const appendMdFile = async (
  filePath: string,
  data: string
): Promise<void> => {
  // Append to the file asynchronously
  // Use 'utf8' encoding to ensure the file is written as a text file
  await fs.promises.appendFile(filePath, data, {
    encoding: 'utf8',
  });
};

/**
 * @description Writes a yml file asynchronously
 * @param filePath - The path to the yml file
 * @param data - The data to write to the yml file
 * @returns A promise that resolves when the write operation is complete
 */
export const writeYmlFile = async (
  filePath: string,
  data: string
): Promise<void> => {
  const fullpath = path.resolve(filePath);
  const dir = path.dirname(fullpath);

  // Ensure the directory exists
  if (!dirExists(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  // Write the file asynchronously
  // Use 'utf8' encoding to ensure the file is written as a text file
  await fs.promises.writeFile(fullpath, data, {
    encoding: 'utf8',
  });
};
