import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

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

  const defaultInputFilePath = 'urls.txt';
  const inputFilePathRaw =
    await ask(rl, `Enter input urls file path [${defaultInputFilePath}]:`) || defaultInputFilePath;
  const inputFilePath = path.resolve(inputFilePathRaw);

  const defaultOutputFilePath = 'output.txt';
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

  console.log(`Testing ${urls.length} urls...`);
  const testResults = await Promise.all(urlsPacked.map(testUrl));
  const output = urlsPacked
    .map((url, index) => {
      const urlResult = testResults[index];
      switch (urlResult) {
        case true:
          return `${url}: OK`;
        default:
        case false:
          return `${url}: ERROR`;
      }
    })
    .join('\n');
  console.log('Done.\n');

  console.log(`Saving results to ${outputFilePathRaw}...`);
  await fs.writeFile(outputFilePath, output);
  console.log('Done.\n');

  console.log('Goodbye!');
  rl.close();
};

export default main;

if (require.main === module) {
  main();
}