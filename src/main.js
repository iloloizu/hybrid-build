import "./styles.css";
import { ui } from "./state.js";
import { connect } from "./storage.js";
import { renderPlan } from "./views/plan.js";
import { renderPoseGrid } from "./views/posegrid.js";
import { keep } from "./views/common.js";

// Re-render the plan when synced data arrives, unless the user is typing.
const safeRender = () => { if (ui.view === "plan" && !(document.activeElement && document.activeElement.tagName === "INPUT")) keep(renderPlan); };

if (location.hash === "#posegrid") renderPoseGrid();
else { renderPlan(); connect(safeRender); }
