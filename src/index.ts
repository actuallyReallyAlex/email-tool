import chalk from "chalk";
import clear from "clear";
import EventEmitter from "events";

import { displayMainMenu, interpretMenuAction } from "./menu";
import { titleScreen } from "./util";

import { AppState } from "./types";

const main = async (): Promise<void> => {
  const menuActionEmitter = new EventEmitter.EventEmitter();
  menuActionEmitter.on("actionCompleted", async (state: AppState) => {
    await titleScreen("Email Tool");
    await displayMainMenu(state);
    await interpretMenuAction(state);
  });

  // * Application State
  const state: AppState = {
    menuAction: null,
    menuActionEmitter,
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

// * Handle local development with `npm start`
if (process.argv[3] === "start") main();

export default main;
