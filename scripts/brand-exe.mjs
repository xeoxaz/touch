import path from "node:path";
import { rcedit } from "rcedit";

const projectRoot = path.resolve(import.meta.dirname, "..");
const executablePath = path.join(projectRoot, "dist", "touch.exe");
const iconPath = path.join(projectRoot, "clipboard.ico");

await rcedit(executablePath, {
  icon: iconPath,
  "version-string": {
    FileDescription: "Touch Clipboard Todo CLI",
    ProductName: "Touch"
  }
});

console.log(`Branded ${executablePath} with ${iconPath}`);