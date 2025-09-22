class DependencyVisibilityManager {
    constructor(schedulerManager) {
        this.schedulerManager = schedulerManager;
    }

    hideAllDependencies() {
        this.processAllDependencies(this.hideDependency);
        if (this.selectedBlock != null) {
            this.processDependenciesForEvent(this.selectedBlock, this.showDependency);
        }
    }

    // Method to show dependencies for an event and all connected events
    showDependenciesForEvent(eventRecord) {
        this.selectedBlock = eventRecord;
        this.processAllDependencies(this.hideDependency);  // First, hide all dependencies to reset the state

        // Show dependencies for the main event
        this.processDependenciesForEvent(eventRecord, this.showDependency);

        // Create a set to track all events that need their dependencies shown to avoid duplication
        const dependencies = this.schedulerManager.scheduler.dependencyStore.getRange();
        const eventsToShow = new Set([eventRecord]);
        dependencies.forEach(dep => {
            if (dep.originalData.linkType.value == 1) {
                if (dep.originalData.fromEvent === eventRecord.originalData.id) {
                    eventsToShow.add(dep.toEvent);
                }
                if (dep.originalData.toEvent === eventRecord.originalData.id) {
                    eventsToShow.add(dep.fromEvent);
                }
            }
        });

        // Show dependencies for each connected event
        eventsToShow.forEach(event => {
            this.processDependenciesForEvent(event, this.showDependency);
        });
    }

    hideDependenciesForEvent( eventRecord ) {
        this.processDependenciesForEvent(eventRecord, this.hideDependency);
    }

    hideDependency(dep) {
        this.setDependencyVisibility(dep, 'none');
    }

    showDependency(dep) {
        this.setDependencyVisibility(dep, '');
    }

    // Helper method to process all dependencies with a given action
    processAllDependencies(action) {
        const dependencies = this.schedulerManager.scheduler.dependencyStore.getRange();
        dependencies.forEach(dep => action.call(this, dep));
    }

    // Helper method to set the visibility of a dependency
    setDependencyVisibility(dep, displayStyle) {
        const depElement = this.schedulerManager.scheduler.features.dependencies.getElementForDependency(dep);
        if (depElement) {
            depElement.style.display = displayStyle;
        }
    }

    // Helper method to process dependencies for a specific event with a given action
    processDependenciesForEvent(eventRecord, action) {
        const dependencies = this.schedulerManager.scheduler.dependencyStore.getRange();
        dependencies.forEach(dep => {
            if (dep.fromEvent === eventRecord || dep.toEvent === eventRecord) {
                action.call(this, dep);
            }
        });
    }
}

export default DependencyVisibilityManager;