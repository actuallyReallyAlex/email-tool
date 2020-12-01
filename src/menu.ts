import boxen from "boxen";
import chalk from "chalk";
import inquirer from "inquirer";

import addAccount from "./actions/addAccount";
import findMessages from "./actions/findMessages";
import selectAccount from "./actions/selectAccount";
import sortMessages from "./actions/sortMessages";
import unsubscribe from "./actions/unsubscribe";

import { blankBoxenStyle } from "./constants";
import { titleScreen } from "./util";

import { AppState, MenuAction } from "./types";
import { OAuth2Client } from "google-auth-library";

/**
 * Displays Main Menu to user.
 * @param {AppState} state State of application.
 * @returns {Promise} Resolves with menuAction value.
 */
export const displayMainMenu = (state: AppState): Promise<MenuAction> =>
  new Promise(async (resolve, reject) => {
    try {
      console.log("");
      console.log(chalk.blue(`User Email - ${state.userEmail}`));
      console.log("");
      const { menuAction } = await inquirer.prompt([
        {
          type: "list",
          message: "Main Menu",
          name: "menuAction",
          choices: [
            { value: "findMessages", name: "Find Messages" },
            { value: "sortMessages", name: "Sort Messages" },
            { value: "unsubscribe", name: "Unsubscribe" },
            new inquirer.Separator(),
            { value: "about", name: "About" },
            {
              value: "selectAccount",
              name: "Select Account",
              disabled: state.numberOfAccounts === 1,
            },
            { value: "addAccount", name: "Add Account" },
            { value: "exit", name: "Exit" },
            new inquirer.Separator(),
          ],
        },
      ]);
      state.menuAction = menuAction;
      resolve(menuAction);
    } catch (e) {
      reject(e);
    }
  });

/**
 * Pauses the process execution and waits for the user to hit a key.
 * @returns {Promise} Resolves when user has entered a keystroke.
 * @async
 */
const keypress = async (): Promise<void> => {
  try {
    process.stdin.setRawMode(true);
    return new Promise((resolve, reject) => {
      try {
        process.stdin.resume();
        process.stdin.once("data", () => {
          process.stdin.setRawMode(false);
          resolve();
        });
      } catch (e) {
        return reject(e);
      }
    });
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * Interprets user selected menu action.
 * @param {AppState} state State of application.
 * @returns {Promise}
 */
export const interpretMenuAction = async (state: AppState): Promise<void> => {
  try {
    if (state.menuAction === null) {
      throw new Error("menuAction can not be `null`");
    }
    // TODO - Refactor - many "actions" are doing almost the same thing
    const actions = {
      about: async (state: AppState): Promise<void> => {
        await titleScreen("Email Tool");
        console.log(
          boxen(chalk.blueBright(`Author: `) + "Alex Lee", blankBoxenStyle)
        );

        console.log("Press any key to return to Main Menu ...");
        await keypress();
        state.menuActionEmitter.emit("actionCompleted", state);
      },
      addAccount: async (state: AppState): Promise<void> => {
        await titleScreen("Email Tool");

        const result: {
          authentication: OAuth2Client;
          userEmail: string;
        } | void = await addAccount();

        if (!result) {
          throw new Error("No result!");
        }

        state.authentication = result.authentication;
        state.userEmail = result.userEmail;
        state.numberOfAccounts = state.numberOfAccounts + 1;

        console.log("Press any key to return to Main Menu ...");
        await keypress();
        state.menuActionEmitter.emit("actionCompleted", state);
      },
      exit: (state: AppState): void => process.exit(),
      findMessages: async (state: AppState): Promise<void> => {
        await titleScreen("Email Tool");

        await findMessages(state);

        console.log("Press any key to return to Main Menu ...");
        await keypress();
        state.menuActionEmitter.emit("actionCompleted", state);
      },
      selectAccount: async (state: AppState): Promise<void> => {
        await titleScreen("Email Tool");

        const result: {
          authentication: OAuth2Client;
          userEmail: string;
        } | void = await selectAccount();

        if (!result) {
          throw new Error("No result!");
        }

        state.authentication = result.authentication;
        state.userEmail = result.userEmail;

        state.menuActionEmitter.emit("actionCompleted", state);
      },
      sortMessages: async (state: AppState): Promise<void> => {
        await titleScreen("Email Tool");

        await sortMessages(state);

        console.log("Press any key to return to Main Menu ...");
        await keypress();
        state.menuActionEmitter.emit("actionCompleted", state);
      },
      unsubscribe: async (state: AppState): Promise<void> => {
        await titleScreen("Email Tool");

        await unsubscribe(state);

        console.log("Press any key to return to Main Menu ...");
        await keypress();
        state.menuActionEmitter.emit("actionCompleted", state);
      },
    };

    await actions[state.menuAction](state);
  } catch (e) {
    throw new Error(e);
  }
};
