import { SchedulerPro, WidgetHelper } from '../build/schedulerpro.wc.module.js';
import SchedulerUtils from './scheduler-utils.js';
import SchedulerZoomManager from './scheduler-zoom-manager.js';
import DataManager from './data-manager.js';
import EventRenderer from './event-renderer.js';
import UIManager from './ui-manager.js';
import DependencyVisibilityManager from './dependency-visibility-manager.js';
import ConfigManager from './config.js';
import EventHandlingManager from './event-handling-manager.js'; // New manager for event handling

class SchedulerManager {
    constructor() {
        this.scheduler = null;
        this.configManager = new ConfigManager();
        this.dataManager = new DataManager(this);
        this.eventRenderer = new EventRenderer(this);
        this.uiManager = new UIManager(this);
        this.schedulerZoomManager = new SchedulerZoomManager(this);
        this.dependencyVisibilityManager = new DependencyVisibilityManager(this);
        this.eventHandlingManager = new EventHandlingManager(this); // New manager instance
    }

    async reInitializeScheduler() {
        if (this.configManager.hasValidConfig()) {
            SchedulerUtils.clearElement(this.configManager.elementId);
            await this.initializeSchedulerFromConfig();
        } else {
            throw new Error("Scheduler cannot be reinitialized because initial configuration parameters are missing.");
        }
    }

    async prepareScheduler() {
        this.mask = WidgetHelper.mask(document.body, 'Preparing scheduler data...');
    }

    async initializeScheduler(elementId, diskImage, presetDictionary) {
        this.closeMaskIfExists();

        this.configManager.storeConfig(elementId, diskImage, presetDictionary);
        await this.ensureSchedulerInitialized();
        return { success: true };
    }

    async ensureSchedulerInitialized() {
        const config = this.configManager.getConfig();
        this.eventHandlingManager.setupPresetConfigs(config.presetConfig);

        if (!this.scheduler) {
            await this.initializeSchedulerFromConfig();
        }

        await this.updateSchedulerDataWithMask(config);
        await this.updateSchedulerDependenciesWithMask(config);
    }

    async initializeSchedulerFromConfig() {
        const config = this.configManager.getConfig();
        this.mask = WidgetHelper.mask(document.body, 'Initializing scheduler...');

        try {
            await this.sleep(100);
            this.scheduler = new SchedulerPro({
                readOnly: true,
                appendTo: config.elementId,
                eventRenderer: this.eventRenderer.render,
                resourceTimeRangeRenderer({ resourceTimeRangeRecord, resourceRecord, renderData }) {
                    return resourceTimeRangeRecord.name;
                },
                ...config.presetConfig
            });
            this.dataManager.initialize();
            this.eventHandlingManager.setupEventListeners();
            this.uiManager.modifyEditor();
            this.uiManager.modifyDependencyTooltip(); 
        } catch (error) {
            console.error('Error initializing scheduler:', error);
        } finally {
            this.closeMaskIfExists();
        }
    }

    async updateSchedulerDataWithMask(config) {
        this.mask = WidgetHelper.mask(document.body, 'Loading data...');
        try {
            await this.dataManager.updateDataFromConfig(config);
            this.closeMaskIfExists();
            this.mask = WidgetHelper.mask(document.body, 'Loading capacity labels...');
            await this.dataManager.updateResourceTimeRangesFromConfig(config);
        } catch (error) {
            console.error('Error updating scheduler data:', error);
        } finally {
            this.closeMaskIfExists();
        }
    }

    async updateSchedulerDependenciesWithMask(config) {
        this.mask = WidgetHelper.mask(document.body, 'Loading dependencies...');
        try {
            await this.dataManager.updateDependenciesFromConfig(config);
        } catch (error) {
            console.error('Error updating scheduler dependencies:', error);
        } finally {
            this.closeMaskIfExists();
        }
    }

    closeMaskIfExists() {
        if (this.mask && this.mask.close) {
            this.mask.close();
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Method to emit column visibility states
    getColumnVisibility() {
        return Array.from(this.scheduler.columns.storage.values).map(column => ({
            id: column.field,
            hidden: column.hidden
        }));
    }
}

export default SchedulerManager;