import chalk from "chalk";
import fse from "fs-extra";
import { google } from "googleapis";
import path from "path";
import ProgressBar from "progress";

import { Credentials, Message, SenderDetails } from "./types";

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
        maxResults: 10000,
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

    console.log("Gathering message data ...");

    const messageDataBar = new ProgressBar(
      "[:bar] :percent (:current / :total) :etas",
      {
        // total: allMessages.length,
        total: 100,
        width: 50,
      }
    );

    const allMessageData: Message[] = [];

    for (let i = 0; i < 100; i++) {
      // for (let i = 0; i < allMessages.length; i++) {
      const message = allMessages[i];

      if (!message.id) {
        throw new Error("No message id!");
      }

      const messageData = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      const data: Message = {
        date:
          messageData.data.payload?.headers?.find(
            (header) => header.name === "Date"
          )?.value || "",
        from:
          messageData.data.payload?.headers?.find(
            (header) => header.name === "From"
          )?.value || "",
        id: messageData.data.id || "",
        snippet: messageData.data.snippet || "",
        subject:
          messageData.data.payload?.headers?.find(
            (header) => header.name === "Subject"
          )?.value || "",
      };

      allMessageData.push(data);

      messageDataBar.tick();
    }

    console.log(chalk.green("Message data gathered successfully!"));
    console.log("");
    console.log("Sorting message data ...");

    const sortedMessageDataBar = new ProgressBar(
      "[:bar] :percent (:current / :total) :etas",
      {
        total: allMessageData.length,
        width: 50,
      }
    );

    const sortedMessageData: SenderDetails[] = [];

    for (let j = 0; j < allMessageData.length; j++) {
      const messageData = allMessageData[j];
      // * Determine if a sender is already known in the list
      const correspondingSenderDetailsIndex = sortedMessageData.findIndex(
        (sender) => sender.name === messageData.from
      );

      if (correspondingSenderDetailsIndex > -1) {
        // * If found, add to sender object
        sortedMessageData[correspondingSenderDetailsIndex].messages.push({
          ...messageData,
        });
        sortedMessageData[correspondingSenderDetailsIndex].numberOfMessages =
          sortedMessageData[correspondingSenderDetailsIndex].numberOfMessages +
          1;
      } else {
        // * If not found, create new sender object
        const newSenderDetails: SenderDetails = {
          messages: [{ ...messageData }],
          name: messageData.from,
          numberOfMessages: 1,
        };
        sortedMessageData.push(newSenderDetails);
      }
      sortedMessageDataBar.tick();
    }

    // * Sort by number of messages
    sortedMessageData.sort((a, b) => {
      if (a.numberOfMessages > b.numberOfMessages) {
        return -1;
      } else {
        return 1;
      }
    });

    await fse.writeJSON(
      path.join(__dirname, "../sortedMessageData.json"),
      sortedMessageData,
      {
        spaces: 2,
      }
    );

    console.log(chalk.green("Sorted Message Data stored successfully!"));

    // const messageData = [];

    // allMessages.forEach((message) => {});

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
