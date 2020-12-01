import chalk from "chalk";
import EventEmitter from "events";
import fse from "fs-extra";
import { OAuth2Client } from "google-auth-library";
import path from "path";

import { displayMainMenu, interpretMenuAction } from "./menu";
import { authenticate, titleScreen } from "./util";

import { AppState, Credentials, Token } from "./types";
import addAccount from "./actions/addAccount";
import selectAccount from "./actions/selectAccount";

const main = async (): Promise<void> => {
  const menuActionEmitter = new EventEmitter.EventEmitter();
  menuActionEmitter.on("actionCompleted", async (state: AppState) => {
    await titleScreen("Email Tool");
    await displayMainMenu(state);
    await interpretMenuAction(state);
  });

  const outputDirectory = path.join(__dirname, "../output");

  // * Ensure output directory
  await fse.ensureDir(outputDirectory);

  // * Read tokens
  let tokens: Token[] = await fse.readJSON(
    path.join(__dirname, "../tokens.json")
  );

  const credentials: Credentials = await fse.readJSON(
    path.join(__dirname, "../credentials.json")
  );
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  let oAuth2Client: OAuth2Client;
  let userEmail: string = "";

  if (tokens.length === 0) {
    // * Initial setup
    const result: {
      authentication: OAuth2Client;
      userEmail: string;
    } | void = await addAccount();
    if (!result) {
      throw new Error("No result!");
    }
    oAuth2Client = result.authentication;
    userEmail = result.userEmail;
  } else if (tokens.length === 1) {
    const result: {
      authentication: OAuth2Client;
      userEmail: string;
    } | void = await authenticate(
      client_id,
      client_secret,
      redirect_uris[0],
      tokens[0]
    );
    if (!result) {
      throw new Error("No result!");
    }
    oAuth2Client = result.authentication;
    userEmail = result.userEmail;
  } else {
    // * User picks an account
    const result: {
      authentication: OAuth2Client;
      userEmail: string;
    } | void = await selectAccount();
    if (!result) {
      throw new Error("No result!");
    }
    oAuth2Client = result.authentication;
    userEmail = result.userEmail;
  }

  // * Application State
  const state: AppState = {
    authentication: oAuth2Client,
    menuAction: null,
    menuActionEmitter,
    numberOfAccounts: tokens.length,
    outputDirectory,
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
