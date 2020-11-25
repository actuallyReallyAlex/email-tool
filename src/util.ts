import fse from "fs-extra";
import { google } from "googleapis";
import path from "path";

import { Credentials } from "./types";

export const authorize = async (credentials: Credentials): Promise<any> => {
  try {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // * Check if we have previously stored a token.
    const token = await fse.readJSON(path.join(__dirname, "../token.json"));

    if (!token) {
      throw new Error("No token stored. Please configure tool before using.");
    }

    oAuth2Client.setCredentials(token);

    return oAuth2Client;
  } catch (error) {
    console.error(error);
  }
};
