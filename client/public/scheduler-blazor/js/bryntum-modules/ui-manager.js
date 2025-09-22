import SchedulerUtils from './scheduler-utils.js';
class UIManager {
    constructor(schedulerManager) {
        this.schedulerManager = schedulerManager;
    }
    async setFullScreen() {
        const elem = document.body;
        if (!elem) {
            console.error('Element body not found.');
            return;
        }

        // Define the handler for fullscreen change event
        elem.onfullscreenchange = this.fullscreenchanged;

        // Check if the document is currently in fullscreen mode
        if (document.fullscreenElement || document.mozFullScreenElement ||
            document.webkitFullscreenElement || document.msFullscreenElement) {
            // Exit fullscreen mode
            const exitFullScreen = document.exitFullscreen || document.mozCancelFullScreen ||
                document.webkitExitFullscreen || document.msExitFullscreen;
            if (exitFullScreen) {
                exitFullScreen.call(document);
            } else {
                console.error('Exiting fullscreen is not supported.');
            }
        } else {
            // Enter fullscreen mode
            const requestFullScreen = elem.requestFullscreen || elem.mozRequestFullScreen ||
                elem.webkitRequestFullscreen || elem.msRequestFullscreen;
            if (requestFullScreen) {
                requestFullScreen.call(elem);
            } else {
                console.error('Fullscreen API is not supported.');
            }
        }
    }

    fullscreenchanged(event) {
        const ganttContainer = document.getElementById('form-gantt-container');
        const gantt = document.getElementById('gantt-container');
        if (!ganttContainer) {
            console.error('Element with ID "gantt-container" not found.');
            return;
        }

        if (document.fullscreenElement) {
            // Store original styles
            this.originalStyles = {
                width: ganttContainer.style.width,
                height: ganttContainer.style.height,
                position: ganttContainer.style.position,
                top: ganttContainer.style.top,
                left: ganttContainer.style.left,
                ganttHeight: gantt.style.height
            };

            // Make the gantt-container occupy the full width of the body
            ganttContainer.style.width = '100vw';
            ganttContainer.style.height = '100vh';
            gantt.style.height = '93vh';
            ganttContainer.style.position = 'fixed';
            ganttContainer.style.top = '0';
            ganttContainer.style.left = '0';
        } else {
            // Revert gantt-container to its original state
            ganttContainer.style.width = this.originalStyles.width;
            ganttContainer.style.height = this.originalStyles.height;
            ganttContainer.style.position = this.originalStyles.position;
            ganttContainer.style.top = this.originalStyles.top;
            ganttContainer.style.left = this.originalStyles.left;
            gantt.style.height = this.originalStyles.ganttHeight;
        }
    }

    async adjustEventHeight(increase) {
        const { scheduler } = this.schedulerManager;
        if (scheduler) {
            const adjustment = increase ? 10 : -10;
            SchedulerUtils.setRowHeight(scheduler, scheduler.rowHeight + adjustment);
        } else {
            console.error('Scheduler not initialized');
        }
    }

    async increaseEventHeight() {
        await this.adjustEventHeight(true);
    }

    async decreaseEventHeight() {
        await this.adjustEventHeight(false);
    }

    async resizeRowsToFit() {
        const { scheduler } = this.schedulerManager;
        if (scheduler) {
            const availableHeight = scheduler.element.clientHeight - 160;
            SchedulerUtils.setRowHeight(scheduler, availableHeight / scheduler.resources.length);
        } else {
            console.error('Scheduler not initialized');
        }
    }

    async highlightEvents(value) {
        const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const { scheduler } = this.schedulerManager;
        if (scheduler && scheduler.eventStore) {
            SchedulerUtils.updateEventHighlighting(scheduler, new RegExp(escapedValue, 'i'));
            SchedulerUtils.updateSchedulerUI(scheduler, 'b-highlighting', escapedValue.length > 0);
        } else {
            console.error('Scheduler or event store not initialized');
        }
    }

    async changeBlockFontSize(value) {
        const className = '.event-section'; // Replace with the actual CSS class you want to modify
        const newFontSize = `${value}px`;

        // Iterate through all stylesheets
        for (const sheet of document.styleSheets) {
            // Iterate through all CSS rules in the stylesheet
            for (const rule of sheet.cssRules) {
                if (rule.selectorText === className) {
                    rule.style.fontSize = newFontSize;
                    console.log(`Font size of ${className} changed to ${newFontSize}`);
                    return;
                }
            }
        }

        console.warn(`CSS class ${className} not found`);
    }

    async modifyEditor() {
        const { scheduler } = this.schedulerManager;
        if (scheduler) {
            SchedulerUtils.modifyEditor(scheduler);
        } else {
            console.error('Scheduler not initialized');
        }
    }
    async modifyDependencyTooltip() {
        const { scheduler } = this.schedulerManager;
        if (scheduler) {
            SchedulerUtils.modifyDependencyTooltip(scheduler);
        } else {
            console.error('Scheduler not initialized');
        }
    }
}

export default UIManager;