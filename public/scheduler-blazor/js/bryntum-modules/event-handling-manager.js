export default class EventHandlingManager {
    constructor(schedulerManager) {
        this.schedulerManager = schedulerManager;
    }

    setupPresetConfigs({ features }) {
        // Define a common template function
        const tooltipTemplate = ({ eventRecord }) => eventRecord.tooltipHTML;
        features.eventTooltip.template = tooltipTemplate;
    }

    setupEventListeners() {
        const { scheduler, dependencyVisibilityManager } = this.schedulerManager;
        // Setup event listeners for click events
        scheduler.on('eventSelectionChange', ({ action, selected, deselected, selection }) => {
            if (action == "clear")
                dependencyVisibilityManager.hideDependenciesForEvent(deselected[0]);
            else
                dependencyVisibilityManager.showDependenciesForEvent(selected[0]);
        });

        // Setup event listeners for when dependencies are drawn
        scheduler.on('dependenciesDrawn', () => {
            dependencyVisibilityManager.hideAllDependencies();
        });
    }
}