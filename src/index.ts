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
    const response = await gmail.users.messages.list({ userId: "me" });
    if (!response.data.messages) {
      throw new Error("No messages on response");
    }

    const firstMessageId = response.data.messages[0].id;

    if (!firstMessageId) {
      throw new Error("Error in response");
    }

    const firstMessage = await gmail.users.messages.get({
      userId: "me",
      id: firstMessageId,
    });

    const subject = firstMessage.data.payload?.headers?.find(
      (header) => header.name === "Subject"
    )?.value;
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

    console.log(`Subject - ${chalk.green(subject)}`);
  } catch (error) {
    console.error(error);
  }
};

main();
