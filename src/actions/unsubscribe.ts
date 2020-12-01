import chalk, { black } from "chalk";
import { debug } from "console";
import fse from "fs-extra";
import path from "path";

import { AppState, Choices, SenderDetails } from "../types";

// TODO - This blacklist creation functionality should not be a part of the 'unsubscribe' functionality
const unsubscribe = async (state: AppState): Promise<void> => {
  try {
    console.log(chalk.yellow("Creating list of blacklisted senders ..."));
    const choicesPath = path.join(
      __dirname,
      `../../output/${state.userEmail}/choices.json`
    );
    const senderDetailsPath = path.join(
      __dirname,
      `../../output/${state.userEmail}/senderDetails.json`
    );
    const blacklistPath = path.join(
      __dirname,
      `../../output/${state.userEmail}/blacklist.json`
    );

    // * Read choices
    const choices: Choices = await fse.readJSON(choicesPath);
    const senderDetails: SenderDetails[] = await fse.readJSON(
      senderDetailsPath
    );

    // * Go through senderDetails and identify a new array of only blacklisted sender details
    const blacklist = senderDetails
      .filter((detail) => choices.blacklist.indexOf(detail.id) > -1)
      .map(({ id, name, unsubscribe }) => ({ id, name, unsubscribe }));

    // * Save list to disk (for now. Later actually perform the click on the http link or email to mail:to)
    await fse.writeJSON(blacklistPath, blacklist, { spaces: 2 });

    console.log(
      chalk.green("List of blacklisted senders created successfully!")
    );
  } catch (error) {}
};

export default unsubscribe;
