import StoreManager from './store-manager.js';
class DataManager {
    /**
     * @param {!SchedulerManager} schedulerManager
     */
    constructor(schedulerManager) {
        /** @private @const */
        this.schedulerManager_ = schedulerManager;

        /** @private {?Scheduler} */
        this.scheduler_ = null;

        /** @private {?StoreManager} */
        this.resourceManager_ = null;

        /** @private {?StoreManager} */
        this.eventManager_ = null;

        /** @private {?StoreManager} */
        this.dependencyManager_ = null;

        /** @private {?StoreManager} */
        this.resourceTimeRangeManager_ = null;
    }

    /** Initializes the DataManager by setting up the store managers. */
    initialize() {
        this.scheduler_ = this.schedulerManager_.scheduler;
        this.resourceManager_ = new StoreManager(this.scheduler_.resourceStore);
        this.eventManager_ = new StoreManager(this.scheduler_.eventStore);
        this.dependencyManager_ = new StoreManager(this.scheduler_.dependencyStore);
        this.resourceTimeRangeManager_ = new StoreManager(this.scheduler_.resourceTimeRangeStore);
    }

    /**
     * Updates data from the provided configuration.
     * @param {!Object} config The configuration object.
     * @return {Promise<void>}
     */
    async updateDependenciesFromConfig({ dependencies }) {
        if (!this.scheduler_) {
            console.error('Scheduler not initialized. Call initialize() before updating data.');
            return;
        }

        try {
            await this.updateDependencies_(dependencies);
            this.commitAndRefresh_();
        } catch (error) {
            console.error('Error updating data:', error);
        }
    }

    /**
     * Updates data from the provided configuration.
     * @param {!Object} config The configuration object.
     * @return {Promise<void>}
     */
    async updateResourceTimeRangesFromConfig({ concurrencies }) {
        if (!this.scheduler_) {
            console.error('Scheduler not initialized. Call initialize() before updating data.');
            return;
        }

        try {
            await this.updateResourceTimeRanges_(concurrencies);
            this.commitAndRefresh_();
        } catch (error) {
            console.error('Error updating data:', error);
        }
    }
    /**
     * Updates data from the provided configuration.
     * @param {!Object} config The configuration object.
     * @return {Promise<void>}
     */
    async updateDataFromConfig({ resources, events, presetConfig }) {
        if (!this.scheduler_) {
            console.error('Scheduler not initialized. Call initialize() before updating data.');
            return;
        }

        try {
            await this.resourceManager_.updateRecords(resources);
            await this.updateEvents_(events);
            this.updateFeaturesConfig_(presetConfig.features);
            this.commitAndRefresh_();
        } catch (error) {
            console.error('Error updating data:', error);
        }
    }

    /**
     * Updates dependencies in the store.
     * @param {!Array<!Object>} dependencies
     * @return {Promise<void>}
     * @private
     */
    async updateDependencies_(dependencies) {
        const dependenciesToRemove = this.scheduler_.dependencyStore.records;
        await this.scheduler_.dependencyStore.remove(dependenciesToRemove);

        for (const dependency of dependencies) {
            await this.dependencyManager_.updateOrCreateRecord(dependency);
        }

    }

    /**
     * Updates resource time ranges in the store.
     * @param {!Array<!Object>} resourceTimeRanges
     * @return {Promise<void>}
     * @private
     */
    async updateResourceTimeRanges_(resourceTimeRanges) {
        for (const resourceTimeRange of resourceTimeRanges) {
            await this.resourceTimeRangeManager_.updateOrCreateRecord(resourceTimeRange);
        }

        const resourceTimeRangesToRemove = this.scheduler_.resourceTimeRangeStore.records.filter(
            rtr => !resourceTimeRanges.some(r => r.id === rtr.id));
        await this.scheduler_.resourceTimeRangeStore.remove(resourceTimeRangesToRemove);
    }

    /**
     * Updates events in the store.
     * @param {!Array<!Object>} events
     * @return {Promise<void>}
     * @private
     */
    async updateEvents_(events) {
        for (const event of events) {
            await this.eventManager_.updateOrCreateRecord(event);
        }

        const eventsToRemove = this.scheduler_.eventStore.records.filter(
            evt => !events.some(e => e.id === evt.id));
        await this.scheduler_.eventStore.remove(eventsToRemove);
    }

    /**
     * Updates the feature configuration of the scheduler.
     * @param {!Object} features The feature configuration object.
     * @private
     */
    updateFeaturesConfig_(features) {
        if (features && typeof features === 'object') {
            this.scheduler_.features.eventTooltip.disabled = features.eventTooltip.disabled;
        } else {
            console.warn('Invalid features configuration.');
        }
    }

    /** Commits changes and refreshes the scheduler view. 
     * @private
     */
    commitAndRefresh_() {
        this.scheduler_.project.commit();
        if (this.scheduler_.refresh) {
            this.scheduler_.refresh();
        } else {
            console.warn('No method to refresh the view was found.');
        }
    }

    /**
     * Filters events based on the provided value.
     * @param {string} value The value to filter events by.
     * @return {Promise<void>}
     */
    async filterEvents(value) {
        const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (this.scheduler_?.eventStore) {
            try {
                this.scheduler_.eventStore.filter({
                    filters: event => new RegExp(escapedValue, 'i').test(event.name),
                    replace: true,
                });
            } catch (error) {
                console.error('Error filtering events:', error);
            }
        } else {
            console.error('Scheduler or event store not initialized');
        }
    }
}

export default DataManager;