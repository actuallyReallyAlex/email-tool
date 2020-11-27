import chalk from "chalk";
import fse from "fs-extra";
import { google } from "googleapis";
import path from "path";
import ProgressBar from "progress";
import { v4 as uuid } from "uuid";

import { Credentials, Message, SenderDetails } from "../types";

import { authorize } from "../util";

const findMessages = async (): Promise<void> => {
  try {
    const credentials: Credentials = await fse.readJSON(
      path.join(__dirname, "../../credentials.json")
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

    const numberOfOperations = allMessages.length;
    // * const numberOfOperations = 10;

    const messageDataBar = new ProgressBar(
      "[:bar] :percent (:current / :total) :etas",
      {
        total: numberOfOperations,
        width: 50,
      }
    );

    const allMessageData: Message[] = [];

    for (let i = 0; i < numberOfOperations; i++) {
      const message = allMessages[i];

      if (!message.id) {
        throw new Error("No message id!");
      }

      const messageData = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      // TODO - Refactor this so you're not performing so many operations
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
        unsubscribeUrl:
          messageData.data.payload?.headers?.find(
            (header) => header.name === "List-Unsubscribe"
          )?.value || null,
      };

      allMessageData.push(data);

      messageDataBar.tick();
    }

    console.log(chalk.green("Message data gathered successfully!"));
    console.log("");
    console.log("Creating sender details report...");

    const senderDetailsBar = new ProgressBar(
      "[:bar] :percent (:current / :total) :etas",
      {
        total: allMessageData.length,
        width: 50,
      }
    );

    const senderDetailsData: SenderDetails[] = [];

    for (let j = 0; j < allMessageData.length; j++) {
      const messageData = allMessageData[j];
      // * Determine if a sender is already known in the list
      const correspondingSenderDetailsIndex = senderDetailsData.findIndex(
        (sender) => sender.name === messageData.from
      );

      if (correspondingSenderDetailsIndex > -1) {
        // * If found, add to sender object
        senderDetailsData[correspondingSenderDetailsIndex].messages.push({
          ...messageData,
        });
        senderDetailsData[correspondingSenderDetailsIndex].numberOfMessages =
          senderDetailsData[correspondingSenderDetailsIndex].numberOfMessages +
          1;
      } else {
        // * If not found, create new sender object
        const newSenderDetails: SenderDetails = {
          id: uuid(),
          messages: [{ ...messageData }],
          name: messageData.from,
          numberOfMessages: 1,
          unsubscribe: {
            http:
              messageData.unsubscribeUrl
                ?.split(",")
                .find((val) => val.match(/http/) !== null) || null,
            mailto:
              messageData.unsubscribeUrl
                ?.split(",")
                .find((val) => val.match(/mailto/) !== null) || null,
          },
          unsubscribeUrl: messageData.unsubscribeUrl,
        };
        senderDetailsData.push(newSenderDetails);
      }
      senderDetailsBar.tick();
    }

    // * Sort by number of messages
    senderDetailsData.sort((a, b) => {
      if (a.numberOfMessages > b.numberOfMessages) {
        return -1;
      } else {
        return 1;
      }
    });

    await fse.writeJSON(
      path.join(__dirname, "../../senderDetails.json"),
      senderDetailsData,
      {
        spaces: 2,
      }
    );

    console.log(chalk.green("Sender Details report created successfully!"));
  } catch (error) {
    console.error(error);
  }
};

export default findMessages;
