import chalk from "chalk";
import fse from "fs-extra";
import { OAuth2Client } from "google-auth-library";
import inquirer from "inquirer";
import path from "path";

import { authenticate } from "../util";

import { Credentials, Token } from "../types";

// TODO - Refactor to include stuff coming in from State
const selectAccount = async (): Promise<{
  authentication: OAuth2Client;
  labelId: string;
  userEmail: string;
} | void> => {
  try {
    const tokensPath = path.join(__dirname, "../../tokens.json");
    const credentialsPath = path.join(__dirname, "../../credentials.json");

    const credentials: Credentials = await fse.readJSON(credentialsPath);
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const tokens: Token[] = await fse.readJSON(tokensPath);

    const chosenAccount = await inquirer.prompt([
      {
        type: "list",
        message: "Select an account",
        name: "account",
        choices: tokens.map((token, i) => ({
          name: token.emailAddress,
          value: i,
        })),
      },
    ]);

    // TODO - Issue is that authenticate() is expecting the token as the last param, but you are passing just the email address
    // * Possible fix - change the way the choices array is mapped, to include a value that corresponds to the index of the chosen token

    const result: {
      authentication: OAuth2Client;
      userEmail: string;
    } | void = await authenticate(
      client_id,
      client_secret,
      redirect_uris[0],
      tokens[chosenAccount.account]
    );
    if (!result) {
      throw new Error("No result!");
    }
    return {
      ...result,
      labelId: tokens[chosenAccount.account].labelId,
    };
  } catch (error) {
    console.error(chalk.red(error));
  }
};

export default selectAccount;
