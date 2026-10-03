import { createTabPanelRegistry } from "@wasnaker/core-web";

const panels = createTabPanelRegistry();

export const registerSettingsTabPanel = panels.register;
export const getSettingsTabPanel = panels.get;
