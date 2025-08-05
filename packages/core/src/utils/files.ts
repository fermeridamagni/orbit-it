import fs from 'node:fs';

export const dirExists = (path: string): boolean => {
  return fs.existsSync(path);
};

/**
 * @description Reads a JSON file and returns the parsed content
 * @param file - The path to the JSON file
 * @returns The parsed JSON content
 */
export const readJsonFile = async (filePath: string) => {
  const data = await fs.promises.readFile(filePath, 'utf8');
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
  // Write the file asynchronously
  // Use 'utf8' encoding to ensure the file is written as a text file
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

/**
 * @description Reads a Markdown file asynchronously
 * @param filePath - The path to the Markdown file
 * @returns A promise that resolves to the content of the Markdown file
 */
export const readMdFile = async (filePath: string) => {
  // Read the file asynchronously
  // Use 'utf8' encoding to ensure the file is read as a text file
  const data = await fs.promises.readFile(filePath, 'utf8');
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
  // Write the file asynchronously
  // Use 'utf8' encoding to ensure the file is written as a text file
  await fs.promises.writeFile(filePath, data, 'utf8');
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
  await fs.promises.appendFile(filePath, data, 'utf8');
};
