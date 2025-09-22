class SchedulerZoomManager {
    constructor(schedulerManager) {
        this.schedulerManager = schedulerManager;
    }

    async zoomTo(config) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        // Depending on the config type, call the appropriate zoom method
        scheduler.zoomTo(config);
    }

    async zoomToTimeSpan({ startDate, endDate, centerDate = null }) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        const isInvalidDate = (d) => !d || isNaN(new Date(d).getTime());

        if (isInvalidDate(startDate) || isInvalidDate(endDate)) {
            console.error("zoomToTimeSpan: Invalid startDate or endDate", { startDate, endDate, centerDate });
            return;
        }

        const config = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            centerDate: centerDate ? new Date(centerDate) : undefined
        };
        console.error(config)
        scheduler.zoomTo(config);
    }

    async zoomIn(levels = 1, options = {}) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.zoomIn(levels, options);
    }

    async zoomOut(levels = 1, options = {}) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.zoomOut(levels, options);
    }

    async zoomInFull(options = {}) {
        if (!this.scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        this.scheduler.zoomInFull(options);
    }

    async zoomOutFull(options = {}) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.zoomOutFull(options);
    }

    async shift(amount, unit) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.shift(amount, unit);
    }

    async shiftNext(amount) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.shiftNext(amount);
    }

    async shiftPrevious(amount) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.shiftPrevious(amount);
    }

    async zoomToFit(options = {}) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.zoomToFit(options);
    }

    async zoomToLevel(preset, options = {}) {
        const { scheduler } = this.schedulerManager;

        if (!scheduler) {
            console.error("Scheduler instance not found.");
            return;
        }

        scheduler.zoomToLevel(preset, options);
    }

    getCurrentZoomSnapshot() {
        const { scheduler } = this.schedulerManager;
        if (!scheduler || !scheduler.timeAxisSubGridElement) return null;

        const scrollLeft = scheduler.timeAxisSubGridElement.scrollLeft;
        const clientWidth = scheduler.timeAxisSubGridElement.clientWidth;

        // Ajuste para coordenadas internas del scheduler
        const originOffset = scheduler.getCoordinateFromDate(scheduler.timeAxis.startDate);

        const leftEdge = scrollLeft + originOffset + 1;
        const rightEdge = scrollLeft + originOffset + clientWidth - 1;

        const startDate = scheduler.getDateFromCoordinate(leftEdge);
        const endDate = scheduler.getDateFromCoordinate(rightEdge);

        return {
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString()
        };
    }




}

export default SchedulerZoomManager;
