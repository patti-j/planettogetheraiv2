class ConfigManager {
    constructor() {
        this.elementId = null;
        this.resources = null;
        this.events = null;
        this.dependencies = null;
        this.presetConfig = null;
        this.concurrencies = null;
    }

    storeConfig(elementId, diskImage, presetConfig) {
        this.elementId = elementId;
        diskImage.resources = (diskImage.resources || []).filter(resource => resource.visible && resource.enabled);
        this.events = diskImage.events;
        this.resources = diskImage.resources;
        this.dependencies = diskImage.dependencies;
        this.concurrencies = diskImage.concurrencies;
        this.presetConfig = presetConfig;
    }

    getConfig() {
        return {
            elementId: this.elementId,
            resources: this.resources,
            events: this.events,
            dependencies: this.dependencies,
            presetConfig: this.presetConfig,
            concurrencies: this.concurrencies
        };
    }

    hasValidConfig() {
        return this.elementId && this.resources && this.events && this.dependencies && this.presetConfig;
    }
}

export default ConfigManager;
