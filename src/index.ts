import chalk from "chalk";
import fse from "fs-extra";
import { google } from "googleapis";
import path from "path";
import { Credentials } from "./types";

import { authorize } from "./util";

const main = async () => {
  try {
    const credentials: Credentials = await fse.readJSON(
      path.join(__dirname, "../credentials.json")
    );
    const auth = await authorize(credentials);

    const gmail = google.gmail({ version: "v1", auth });

    const allMessages = [];
    let nextPageExists = true;
    let nextPageToken = undefined;

    console.log(chalk.yellow("Fetching messages ..."));
    while (nextPageExists) {
      const listOfMessages = await gmail.users.messages.list({
        userId: "me",
        q: "unsubscribe",
        pageToken: nextPageToken,
      });

      const batchMessages = listOfMessages.data.messages;
      const token: any = listOfMessages.data.nextPageToken;

      if (batchMessages) {
        allMessages.push(...batchMessages);
      }

      if (token) {
        nextPageToken = token;
      } else {
        nextPageToken = undefined;
        nextPageExists = false;
      }
    }

    console.log(
      `Total Number of Messages Containing 'Unsubscribe' - ${chalk.green(
        allMessages.length
      )}`
    );

    // const firstMessage = await gmail.users.messages.get({
    //   userId: "me",
    //   id: firstMessageId,
    // });

    // const subject = firstMessage.data.payload?.headers?.find(
    //   (header) => header.name === "Subject"
    // )?.value;
    // if (
    //   !firstMessage.data.payload?.parts ||
    //   !firstMessage.data.payload.parts[0].body?.data
    // ) {
    //   throw new Error("No parts!");
    // }
    // const message = Buffer.from(
    //   firstMessage.data.payload.parts[0].body.data,
    //   "base64"
    // ).toString("utf8");

    // console.log(`Subject - ${chalk.green(subject)}`);
  } catch (error) {
    console.error(error);
  }
};

main();
