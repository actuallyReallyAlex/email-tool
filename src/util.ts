import boxen, { Options as boxenOptions, BorderStyle } from "boxen";
import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
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

/**
 * Blank style applied to Boxen.
 */
export const blankBoxenStyle: boxenOptions = {
  borderStyle: {
    topLeft: " ",
    topRight: " ",
    bottomLeft: " ",
    bottomRight: " ",
    horizontal: " ",
    vertical: " ",
  },
  float: "center",
  padding: { top: 0, bottom: 0, right: 1, left: 1 },
};

/**
 * Default style applied to Boxen.
 */
export const defaultBoxenStyle: boxenOptions = {
  borderColor: "magentaBright",
  borderStyle: BorderStyle.Round,
  float: "center",
  padding: { top: 0, bottom: 0, right: 1, left: 1 },
};

/**
 * Uses Figlet to transform your text to ASCII.
 * @param {String} txt Text to be figlet-itized.
 * @param {Object} options Options object.
 * @returns {Promise} Resolves with text.
 */
const figletPromise = (txt: string, options: any): Promise<string> =>
  new Promise((resolve, reject) =>
    figlet.text(
      txt,
      options,
      (error: Error | null, result: string | undefined) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject({ error: "No result!" });
        }

        resolve(result);
      }
    )
  );

/**
 * Displays a title in the center of the terminal.
 * @param {String} title Title to be disaplayed.
 * @returns {Promise} Resolves after logging to the console.
 */
export const titleScreen = (title: string): Promise<void> =>
  new Promise(async (resolve, reject) => {
    try {
      const text: string = await figletPromise(title, {
        font: "Slant",
      });

      clear();
      console.log(boxen(chalk.blueBright(text), defaultBoxenStyle));
      resolve();
    } catch (e) {
      reject(e);
    }
  });

export default titleScreen;
