import fs from "fs";
import path from "path";
import readline from "readline";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "commissions");

const STATUS_MAP: Record<string, string> = {
  w: "waiting",
  s: "sketch",
  l: "lineart",
  c: "coloring",
  d: "completed",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

function formatDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month} ${day} ${year}`;
}

function getNextAvailableNumber(): string {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    return "0001";
  }

  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
  let maxId = 0;

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const match = entry.name.match(/^(\d{4})-/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }
  }

  return String(maxId + 1).padStart(4, "0");
}

async function createCommission() {
  const defaultNum = getNextAvailableNumber();
  const numInput = await ask(
    `Next available number: ${defaultNum}\nLeave blank if you will use this number: `,
  );
  const num = (numInput.trim() || defaultNum).padStart(4, "0");

  const typeInput = await ask("Type (s: Sticker, leave blank for Sticker): ");
  const type =
    typeInput.trim().toLowerCase() === "s" || !typeInput.trim()
      ? "Sticker"
      : typeInput.trim();

  const rawAlias = await ask("paste the client Telegram alias\n@");
  const clientAlias = rawAlias.trim().replace(/^@/, "");

  const character = await ask("name of the fur: ");

  const statusInput = await ask(
    "status (w: waiting, s: sketch, l: lineart, c: coloring, d: completed, leave blank for waiting): ",
  );
  const status = STATUS_MAP[statusInput.trim().toLowerCase()] || "waiting";

  const progressInput = await ask(
    "progress (number from 0 to 100, leave blank for 0): ",
  );
  const progress = parseInt(progressInput.trim(), 10) || 0;

  const description = await ask(
    "short description if available (write a brief description): ",
  );

  const folderName = `${num}-${clientAlias}`;
  const folderPath = path.join(CONTENT_DIR, folderName);
  const filePath = path.join(folderPath, "index.md");

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const currentDate = formatDate(new Date());

  const fileContent = `---
id: "#${num}"
character: "${character.trim()}"
clientAlias: "${clientAlias}"
type: "${type}"
progress: ${progress}
updatedAt: "${currentDate}"
status: "${status}"
---

${description.trim()}
`;

  fs.writeFileSync(filePath, fileContent, "utf-8");
  console.log(
    `\n Successfully created commission track at: ${path.relative(
      process.cwd(),
      filePath,
    )}\n`,
  );
}

async function modifyCommission() {
  const targetId = await ask("write the 4 numbers start: XXXX\n> ");
  const formattedId = targetId.trim().padStart(4, "0");

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("No commissions directory found.");
    return;
  }

  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });
  const targetFolder = entries.find(
    (e) => e.isDirectory() && e.name.startsWith(`${formattedId}-`),
  );

  if (!targetFolder) {
    console.log(`\n Commission #${formattedId} not found.`);
    return;
  }

  const folderPath = path.join(CONTENT_DIR, targetFolder.name);
  const filePath = path.join(folderPath, "index.md");

  if (!fs.existsSync(filePath)) {
    console.log(`\n index.md missing in ${targetFolder.name}`);
    return;
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");

  const frontmatterMatch = rawContent.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/,
  );
  if (!frontmatterMatch) {
    console.log(`\n Could not parse frontmatter in ${filePath}`);
    return;
  }

  const frontmatterBlock = frontmatterMatch[1];
  let bodyContent = frontmatterMatch[2].trim();

  const data: Record<string, string> = {};
  frontmatterBlock.split(/\r?\n/).forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      value = value.replace(/^["']|["']$/g, "");
      data[key] = value;
    }
  });

  console.log(
    `\nModifying #${formattedId} (${
      data.character || "Unknown"
    }) — Press enter to keep current value.`,
  );

  let isChanged = false;

  // 1. Status
  const currentStatus = data.status || "waiting";
  const newStatusInput = await ask(
    `status [current: ${currentStatus}] (w: waiting, s: sketch, l: lineart, c: coloring, d: completed): `,
  );
  if (newStatusInput.trim()) {
    const mappedStatus = STATUS_MAP[newStatusInput.trim().toLowerCase()];
    if (mappedStatus && mappedStatus !== currentStatus) {
      data.status = mappedStatus;
      isChanged = true;
    }
  }

  // 2. Progress
  const currentProgress = data.progress || "0";
  const newProgressInput = await ask(
    `progress [current: ${currentProgress}]: `,
  );
  if (newProgressInput.trim()) {
    const parsedProgress = parseInt(newProgressInput.trim(), 10);
    if (!isNaN(parsedProgress) && String(parsedProgress) !== currentProgress) {
      data.progress = String(parsedProgress);
      isChanged = true;
    }
  }

  // 3. Description
  console.log(`current description: "${bodyContent}"`);
  const newDescInput = await ask("new description: ");
  if (newDescInput.trim() && newDescInput.trim() !== bodyContent) {
    bodyContent = newDescInput.trim();
    isChanged = true;
  }

  if (isChanged) {
    data.updatedAt = formatDate(new Date());

    const updatedFrontmatter = `---
id: "${data.id}"
character: "${data.character}"
clientAlias: "${data.clientAlias}"
type: "${data.type}"
progress: ${data.progress}
updatedAt: "${data.updatedAt}"
status: "${data.status}"
---`;

    const updatedContent = `${updatedFrontmatter}\n\n${bodyContent}\n`;
    fs.writeFileSync(filePath, updatedContent, "utf-8");
    console.log(
      `\n Updated commission #${formattedId} (updatedAt set to ${data.updatedAt})\n`,
    );
  } else {
    console.log(`\n No changes made to #${formattedId}.\n`);
  }
}

async function main() {
  console.log("=== Commission Manager ===");
  console.log("1. Create a commission track");
  console.log("2. Modify a commission track");

  const choice = await ask("\nSelect option (1 or 2): ");

  if (choice.trim() === "1") {
    await createCommission();
  } else if (choice.trim() === "2") {
    await modifyCommission();
  } else {
    console.log("Invalid option.");
  }

  rl.close();
}

main();
