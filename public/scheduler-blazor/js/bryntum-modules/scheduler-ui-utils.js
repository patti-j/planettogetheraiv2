// src/utils/SchedulerUIUtils.js
export default class SchedulerUIUtils {
    static updateSchedulerUI(scheduler, className, add) {
        scheduler.element.classList.toggle(className, add);
    }

    static setRowHeight(scheduler, height) {
        scheduler.rowHeight = Math.max(20, height);
        scheduler.refresh();
    }
}
