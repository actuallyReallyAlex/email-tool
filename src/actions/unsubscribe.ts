import chalk from "chalk";
import fse from "fs-extra";
import { google } from "googleapis";
import path from "path";
import ProgressBar from "progress";

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

    const gmail = google.gmail({ version: "v1", auth: state.authentication });
    const unsubscribeBar = new ProgressBar(
      "[:bar] :percent (:current / :total) :etas",
      {
        total: blacklist.filter(
          (element) => element.unsubscribe.mailto !== null
        ).length,
        width: 50,
      }
    );
    let successfulUnsubscribes = 0;

    for (let i = 0; i < blacklist.length; i++) {
      // TODO - Figure out why async/await isn't working in this for loop
      const element = blacklist[i];

      if (element.unsubscribe.mailto) {
        const subject = "Unsubscribe User";
        const messageParts = [
          `From: John Doe <${state.userEmail}>`,
          `To: ${element.name}`,
          "Content-Type: text/html; charset=utf-8",
          "MIME-Version: 1.0",
          `Subject: ${subject}`,
          "",
          "Unsubscribe this user immediately. Thank you.",
        ];
        const message = messageParts.join("\n");
        const encodedMessage = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        // TODO - Fix async not really working
        // ? Use promises.all?
        // TODO - Once unsubscribed, add to a list of unsubscribed senders so you don't repeat yourself
        gmail.users.messages
          .send({
            requestBody: {
              raw: encodedMessage,
            },
            userId: "me",
          })
          .then((res) => {
            // * Success => res.status === 200;
            if (res.status !== 200) {
              console.log(res);
              debugger;
              return;
            }
            // * Move to "Email Tool" label/folder
            gmail.users.messages
              .batchModify({
                requestBody: {
                  addLabelIds: [state.labelId],
                  ids: senderDetails
                    .find((detail) => detail.id === element.id)
                    ?.messages.map((message) => message.id),
                  removeLabelIds: ["INBOX"],
                },
                userId: "me",
              })
              .then((val) => {
                if (i === 0) {
                  debugger;
                }
                successfulUnsubscribes += 1;
                unsubscribeBar.tick();
              })
              .catch((err) => {
                console.error(chalk.red(err));
                debugger;
              });
          })
          .catch((err) => {
            console.error(chalk.red(err));
            debugger;
          });
      }
    }
    console.log(
      chalk.green(
        `Successfully unscubscribed from ${successfulUnsubscribes} senders!`
      )
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

export default unsubscribe;
