import chalk from "chalk";
import fse from "fs-extra";
import inquirer from "inquirer";
import path from "path";

import { SenderDetails } from "../types";

const sortMessages = async (): Promise<void> => {
  try {
    // * Read senderDetails
    const senderDetails: SenderDetails[] = await fse.readJSON(
      path.join(__dirname, "../../senderDetails.json")
    );

    // * For each sender, go through and "whitelist" / "blacklist" / "remove"
    const prompts = senderDetails.map((detail) => ({
      type: "list",
      message: detail.name,
      name: detail.id,
      choices: [
        { name: "Blacklist", value: "blacklist" },
        { name: "Whitelist", value: "whitelist" },
        { name: "Remove", value: "remove" },
      ],
    }));
    const answers = await inquirer.prompt(prompts);

    const keys = Object.keys(answers);

    const whitelist: string[] = [];
    const blacklist: string[] = [];
    const remove: string[] = [];

    const choices = {
      whitelist,
      blacklist,
      remove,
    };

    keys.forEach((key) => {
      const answer: "blacklist" | "whitelist" | "remove" = answers[key];

      switch (answer) {
        case "blacklist":
          blacklist.push(key);
          break;
        case "whitelist":
          whitelist.push(key);
          break;
        case "remove":
          remove.push(key);
          break;
        default:
          break;
      }
    });

    await fse.writeJSON(path.join(__dirname, "../../choices.json"), choices, {
      spaces: 2,
    });
  } catch (error) {
    console.error(chalk.red(error));
  }
};

export default sortMessages;
