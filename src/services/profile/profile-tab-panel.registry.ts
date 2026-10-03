import { createTabPanelRegistry } from "@wasnaker/core-web";

const panels = createTabPanelRegistry();

export const registerProfileTabPanel = panels.register;
export const getProfileTabPanel = panels.get;
