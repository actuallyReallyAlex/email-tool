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

    // * Check if choices already exist
    const choicesExist = await fse.pathExists(
      path.join(__dirname, "../../choices.json")
    );

    let existingChoices: {
      blacklist: string[];
      whitelist: string[];
      remove: string[];
    } = {
      blacklist: [],
      whitelist: [],
      remove: [],
    };

    if (choicesExist) {
      existingChoices = await fse.readJSON(
        path.join(__dirname, "../../choices.json")
      );
    }

    // * For each sender, go through and "whitelist" / "blacklist" / "remove"
    const prompts = senderDetails
      .filter(
        (detail) =>
          !existingChoices.blacklist.includes(detail.id) &&
          !existingChoices.whitelist.includes(detail.id) &&
          !existingChoices.remove.includes(detail.id)
      )
      .map((detail, i, arr) => ({
        type: "list",
        message: `#${i + 1} / ${arr.length} - ${detail.name}`,
        name: detail.id,
        choices: [
          { name: "Blacklist", value: "blacklist" },
          { name: "Whitelist", value: "whitelist" },
          { name: "Remove", value: "remove" },
        ],
      }));

    const whitelist: string[] = [];
    const blacklist: string[] = [];
    const remove: string[] = [];

    // * Create list of un-choiced prompts

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const answer = await inquirer.prompt([prompt]);
      const id = Object.keys(answer)[0];
      const value = Object.values(answer)[0];
      switch (value) {
        case "blacklist":
          blacklist.push(id);
          break;
        case "whitelist":
          whitelist.push(id);
          break;
        case "remove":
          remove.push(id);
          break;
        default:
          break;
      }

      const choices = {
        whitelist,
        blacklist,
        remove,
      };

      const updatedChoices = { ...existingChoices, ...choices };

      await fse.writeJSON(
        path.join(__dirname, "../../choices.json"),
        updatedChoices,
        {
          spaces: 2,
        }
      );
    }

    console.log(chalk.green("Choices saved successfully!"));
  } catch (error) {
    console.error(chalk.red(error));
  }
};

export default sortMessages;
