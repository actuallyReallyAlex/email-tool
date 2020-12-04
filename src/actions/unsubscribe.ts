import chalk from "chalk";
import fse from "fs-extra";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import path from "path";
import ProgressBar from "progress";

import { AppState, Choices, SenderDetails } from "../types";

const buildPaths = (
  userEmail: string
): {
  choicesPath: string;
  senderDetailsPath: string;
  unsubscribedSendersPath: string;
} => {
  return {
    choicesPath: path.join(__dirname, `../../output/${userEmail}/choices.json`),
    senderDetailsPath: path.join(
      __dirname,
      `../../output/${userEmail}/senderDetails.json`
    ),
    unsubscribedSendersPath: path.join(
      __dirname,
      `../../output/${userEmail}/unsubscribedSenders.json`
    ),
  };
};

const readLists = async (
  choicesPath: string,
  senderDetailsPath: string,
  unsubscribedSendersPath: string
): Promise<{
  choices: Choices;
  senderDetails: SenderDetails[];
  unsubscribedSenders: string[];
} | void> => {
  try {
    const choicesList: Choices = await fse.readJSON(choicesPath);
    const senderDetailsList: SenderDetails[] = await fse.readJSON(
      senderDetailsPath
    );
    let unsubscribedSendersList: string[] = [];
    const unsubscribedSendersExists = await fse.pathExists(
      unsubscribedSendersPath
    );
    if (unsubscribedSendersExists) {
      unsubscribedSendersList = await fse.readJSON(unsubscribedSendersPath);
    }
    return {
      choices: choicesList,
      senderDetails: senderDetailsList,
      unsubscribedSenders: unsubscribedSendersList,
    };
  } catch (error) {
    console.error(chalk.red(error));
    debugger;
  }
};

const createEncodedMessage = (userEmail: string, name: string): string => {
  const subject = "Unsubscribe User";
  const messageParts = [
    `From: <${userEmail}>`,
    `To: ${name}`,
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
  return encodedMessage;
};

const sendUnsubscribeEmail = async (
  userEmail: string,
  name: string,
  auth: OAuth2Client
): Promise<void> => {
  try {
    const encodedMessage = createEncodedMessage(userEmail, name);

    const gmail = google.gmail({ version: "v1", auth });

    const res = await gmail.users.messages.send({
      requestBody: {
        raw: encodedMessage,
      },
      userId: "me",
    });

    if (res.status !== 200) {
      console.log(res);
      debugger;
      return;
    }
  } catch (error) {
    console.error(chalk.red(error));
    debugger;
  }
};

const adjustLabels = async (
  auth: OAuth2Client,
  labelId: string,
  ids: string[]
): Promise<void> => {
  try {
    const gmail = google.gmail({ version: "v1", auth });

    const res = await gmail.users.messages.batchModify({
      requestBody: {
        addLabelIds: [labelId],
        ids,
        removeLabelIds: ["INBOX"],
      },
      userId: "me",
    });

    if (res.status !== 204) {
      console.error(chalk.red(res));
      debugger;
      return;
    }
  } catch (error) {
    console.error(chalk.red(error));
    debugger;
  }
};

const unsubscribe = async (state: AppState): Promise<void> => {
  try {
    const {
      choicesPath,
      senderDetailsPath,
      unsubscribedSendersPath,
    } = buildPaths(state.userEmail);

    // * Read choices
    const listsResult = await readLists(
      choicesPath,
      senderDetailsPath,
      unsubscribedSendersPath
    );

    if (!listsResult) {
      throw new Error("No listResult!");
    }

    const { choices, senderDetails, unsubscribedSenders } = listsResult;

    // * Go through senderDetails and identify a new array of only blacklisted sender details
    const blacklist = senderDetails
      .filter(
        (detail) =>
          choices.blacklist.indexOf(detail.id) > -1 &&
          unsubscribedSenders.indexOf(detail.id) === -1
      )
      .map(({ id, name, unsubscribe }) => ({ id, name, unsubscribe }));

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

    // * Send Unsubscribe mail to mailto

    // TODO - Don't promise.all - this causes too many requests at the same time.
    for (let j = 0; j < blacklist.length; j++) {
      const element = blacklist[j];

      if (element.unsubscribe.mailto) {
        // * Send unsubscribe email
        await sendUnsubscribeEmail(
          state.userEmail,
          element.name,
          state.authentication
        );
      }

      // * Move to "Email Tool" label/folder
      const ids = senderDetails
        .find((detail) => detail.id === element.id)
        ?.messages.map((message) => message.id);

      if (!ids) {
        throw new Error("No ids!");
      }

      await adjustLabels(state.authentication, state.labelId, ids);

      successfulUnsubscribes += 1;
      unsubscribedSenders.push(element.id);
      unsubscribeBar.tick();
    }

    await fse.writeJSON(unsubscribedSendersPath, unsubscribedSenders, {
      spaces: 2,
    });

    console.log(
      chalk.green(
        `Successfully unscubscribed from ${successfulUnsubscribes} senders!`
      )
    );
  } catch (error) {
    console.error(chalk.red(error));
    debugger;
  }
};

export default unsubscribe;
