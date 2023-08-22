import { version } from '../../package.json'
import fs from 'fs'
import { execSync } from "child_process";
import path from "node:path";
import chalk from 'chalk'
import { log } from 'console';
export function prettyObject(msg) {

    const obj = msg;
    if (typeof msg !== "string") {
      msg = JSON.stringify(msg, null, "  ");
    }
    if (msg === "{}") {
      return obj.toString();
    }
    if (msg.startsWith("```json")) {
      return msg;
    }
    return ["```json", msg, "```"].join("\n");
}


function compareVersions(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
  
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
  
      if (num1 > num2) {
        return 1;
      } else if (num1 < num2) {
        return -1;
      }
    }
  
    return 0;
}

export function checkVersion() {
    const latestVersion = execSync('npm view gptshell version --registry=http://registry.npmjs.org').toString().trim()
    if (compareVersions(version, latestVersion) == -1) {
        console.log(`${chalk.yellow('[Warning]')} You are using an old version of gptshell, please update to the latest version.\n`)
        console.log(`${chalk.green('[Upgrade Command]')} npm i gptshell@${latestVersion} -g --registry=http://registry.npmjs.org\n`)
    }
}


const tokenFilePath = path.join(__dirname, 'token.txt');

export function saveToken(token) {
  fs.writeFileSync(tokenFilePath, token);
  console.log('Token saved successfully.');
}

export function getToken() {
  if (fs.existsSync(tokenFilePath)) {
    return fs.readFileSync(tokenFilePath, 'utf-8');
  }
  return null;
}

export { version }