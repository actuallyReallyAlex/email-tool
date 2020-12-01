import chalk from "chalk";
import fse from "fs-extra";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import inquirer from "inquirer";
import path from "path";

const tokensPath = path.join(__dirname, "../../tokens.json");
const credentialsPath = path.join(__dirname, "../../credentials.json");

import { Credentials, Token } from "../types";

// TODO - Refactor to include stuff coming in from State
const addAccount = async (): Promise<{
  authentication: OAuth2Client;
  userEmail: string;
} | void> => {
  try {
    const credentials: Credentials = await fse.readJSON(credentialsPath);
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    });
    console.log(
      chalk.blue(`Authorize this application by visiting this url - ${authUrl}`)
    );
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "authCode",
        message: "Enter the code from that page here:",
      },
    ]);
    const response = await oAuth2Client.getToken(answer.authCode);
    oAuth2Client.setCredentials(response.tokens);

    // * Get email to save to tokens
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const profileResponse = await gmail.users.getProfile({ userId: "me" });
    const userEmail = profileResponse.data.emailAddress || "Email Not Found";

    const existingTokens: Token[] = await fse.readJSON(tokensPath);

    await fse.writeJSON(
      tokensPath,
      [...existingTokens, { ...response.tokens, emailAddress: userEmail }],
      { spaces: 2 }
    );

    console.log(chalk.green(`Application Authenticated for ${userEmail}!`));

    return { authentication: oAuth2Client, userEmail };
  } catch (error) {
    console.log(chalk.red(error));
  }
};

export default addAccount;
