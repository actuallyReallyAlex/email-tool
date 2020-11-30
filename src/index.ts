import chalk from "chalk";
import EventEmitter from "events";
import fse from "fs-extra";
import { google } from "googleapis";
import path from "path";

import { displayMainMenu, interpretMenuAction } from "./menu";
import { authorize, titleScreen } from "./util";

import { AppState, Credentials } from "./types";

const main = async (): Promise<void> => {
  const menuActionEmitter = new EventEmitter.EventEmitter();
  menuActionEmitter.on("actionCompleted", async (state: AppState) => {
    await titleScreen("Email Tool");
    await displayMainMenu(state);
    await interpretMenuAction(state);
  });

  const credentials: Credentials = await fse.readJSON(
    path.join(__dirname, "../credentials.json")
  );
  const auth = await authorize(credentials);
  const gmail = google.gmail({ version: "v1", auth });
  const profileResponse = await gmail.users.getProfile({ userId: "me" });
  const userEmail = profileResponse.data.emailAddress || "Email Not Found";

  // * Application State
  const state: AppState = {
    menuAction: null,
    menuActionEmitter,
    userEmail,
  };

  try {
    await titleScreen("Email Tool");
    await displayMainMenu(state);
    await interpretMenuAction(state);
  } catch (e) {
    console.error(chalk.red("ERROR"));
    console.log(state);
    console.error(chalk.red(e));
  }
};

main();
