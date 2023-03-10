import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

const modifyFilePath = (
  filePath: string,
  modify: (absoluteDirPath: string, fileName: string, fileExt: string) => string
): string => {
  const absoluteDirPath = path.dirname(filePath);
  const fileExt = path.extname(filePath);
  const fileName = path.basename(filePath).replace(fileExt, '');
  return modify(absoluteDirPath, fileName, fileExt);
};

const testUrl = async (url: string): Promise<boolean> => {
  try {
    await fetch(url);
    return true;
  } catch (error) {
    return false;
  }
};

const ask = (rl: readline.Interface, query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => resolve(answer));
  });
};

const main = async (): Promise<void> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('DNS Testing Tool\n');

  const defaultInputFilePath = 'urls.txt';
  const inputFilePathRaw =
    await ask(rl, `Enter input urls file path [${defaultInputFilePath}]:`) || defaultInputFilePath;
  const inputFilePath = path.resolve(inputFilePathRaw);

  const defaultOutputFilePath = 'output.csv';
  const outputFilePathRaw = 
    await ask(rl, `Enter output results file path [${defaultOutputFilePath}]:`) || defaultOutputFilePath;
  const outputFilePath = path.resolve(outputFilePathRaw);

  console.log();
  console.log(`Input:  ${inputFilePath}`);
  console.log(`Output: ${outputFilePath}`);
  console.log();

  console.log(`Loading ${inputFilePathRaw}...`);
  const buffer = await fs.readFile(inputFilePath)
    .catch((error) => {
      console.error(error.message);
      process.exit();
    });
  const text = buffer.toString('utf8');
  const urls = text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return ''; // Removed in filter
      }
      return line.startsWith('https://') ? trimmed : `https://${trimmed}`;
    })
    .filter((line) => !!line && line.includes('.'));
  console.log('Done.\n');

  const urlsRequireDupes = urls
    .filter((url) => url.includes('01'))
    .map((url) => url.replace('01', '{instanceId}'));
  
  const urlDupes = urlsRequireDupes.flatMap((url) => {
    return Array
      .from({ length: 8 })
      .map((_, index) => url.replace('{instanceId}', `0${index + 1}`));
  });
  
  const urlsPacked = urls.concat(urlDupes);

  console.log(`Testing ${urlsPacked.length} urls...`);
  const testResults = await Promise.all(urlsPacked.map(testUrl));
  console.log('Done.\n');

  console.log(`Saving results to ${outputFilePathRaw}...`);
  const delim = outputFilePathRaw.endsWith('.csv') ? ',' : ': ';
  const output = urlsPacked
    .map((url, index) => {
      const urlResult = testResults[index];
      switch (urlResult) {
        case true:
          return `${url}${delim}OK`;
        case false:
          return `${url}${delim}ERROR`;
        default:
          return `${url}${delim}null`;
      }
    })
    .join('\n');
  await fs.writeFile(outputFilePath, output);
  console.log('Done.\n');

  const outputErrorsFilePath = modifyFilePath(
    outputFilePath,
    (fileDir, fileName, fileExt) => path.resolve(`${fileDir}/${fileName}_errors${fileExt}`)
  );
  console.log(`Saving error-only results to ${path.basename(outputErrorsFilePath)}...`);
  const outputErrors = urlsPacked
    .filter((_url, index) => {
      const urlResult = testResults[index];
      return urlResult === false;
    })
    .join('\n');
  await fs.writeFile(outputErrorsFilePath, outputErrors);
  console.log('Done.\n');

  console.log('Goodbye!');
  rl.close();
};

export default main;

if (require.main === module) {
  main();
}