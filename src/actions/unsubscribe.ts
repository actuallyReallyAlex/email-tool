import chalk, { black } from "chalk";
import { debug } from "console";
import fse from "fs-extra";
import path from "path";

import { Choices, SenderDetails } from "../types";

// TODO - This blacklist creation functionality should not be a part of the 'unsubscribe' functionality
const unsubscribe = async (): Promise<void> => {
  try {
    console.log(chalk.yellow("Creating list of blacklisted senders ..."));

    // * Read choices
    const choices: Choices = await fse.readJSON(
      path.join(__dirname, "../../choices.json")
    );
    const senderDetails: SenderDetails[] = await fse.readJSON(
      path.join(__dirname, "../../senderDetails.json")
    );

    // * Go through senderDetails and identify a new array of only blacklisted sender details
    const blacklist = senderDetails
      .filter((detail) => choices.blacklist.indexOf(detail.id) > -1)
      .map(({ id, name, unsubscribe }) => ({ id, name, unsubscribe }));

    // * Save list to disk (for now. Later actually perform the click on the http link or email to mail:to)
    await fse.writeJSON(
      path.join(__dirname, "../../blacklist.json"),
      blacklist,
      { spaces: 2 }
    );

    console.log(
      chalk.green("List of blacklisted senders created successfully!")
    );
  } catch (error) {}
};

export default unsubscribe;
