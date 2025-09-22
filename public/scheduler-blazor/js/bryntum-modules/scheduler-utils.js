// src/SchedulerUtils.js
import ElementUtils from './element-utils.js';
import SchedulerEventUtils from './scheduler-event-utils.js';
import SchedulerUIUtils from './scheduler-ui-utils.js';
import SchedulerEditorUtils from './scheduler-editor-utils.js';

export default class SchedulerUtils {
    static clearElement(elementId) {
        ElementUtils.clearElement(elementId);
    }

    static setRowHeight(scheduler, height) {
        var minHeight = 30;
        SchedulerUIUtils.setRowHeight(scheduler, height > minHeight ? height : minHeight);
    }

    static updateEventHighlighting(scheduler, regex) {
        SchedulerEventUtils.updateEventHighlighting(scheduler, regex);
    }

    static updateSchedulerUI(scheduler, className, add) {
        SchedulerUIUtils.updateSchedulerUI(scheduler, className, add);
    }

    static modifyEditor(scheduler) {
        SchedulerEditorUtils.modifyEditor(scheduler);
    }
    static modifyDependencyTooltip(scheduler) {
        const { features: { dependencies } } = scheduler;
        if (dependencies) {
            dependencies.tooltipTemplate = (dependencyModel) => {
                const { originalData } = dependencyModel;

                return originalData.tooltipLabel;
            };
        }
    } 
}
