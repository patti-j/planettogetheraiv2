// src/utils/SchedulerEventUtils.js
import { DomClassList } from '../build/schedulerpro.wc.module.js';
export default class SchedulerEventUtils {
    static updateEventHighlighting(scheduler, regex) {
        scheduler.eventStore.forEach(task => {
            let classes = task.cls.split(' ');
            if (regex && regex.test(task.name)) {
                if (!classes.includes('b-match')) {
                    classes.push('b-match');
                }
            } else {
                classes = classes.filter(c => c !== 'b-match');
            }
            task.cls = classes.join(' ');
        });
    }

    static renderEvent(eventStore, record, type) {
        if (!eventStore || !record?.originalData) {
            console.error('Invalid data or event store not provided');
            return 'Invalid data'; // Handle gracefully
        }

        const fromEvent = eventStore.getById(record.originalData.from);
        const toEvent = eventStore.getById(record.originalData.to);
        let event;

        if (!fromEvent || (type !== 'resourceFrom' && type !== 'operationName' && !toEvent)) {
            console.error('Events not found in store');
            return 'Event details missing';
        }

        switch (type) {
            case 'linked':
                return SchedulerEventUtils.getRenderedLink(fromEvent, toEvent);
            case 'resourceFrom':
                return fromEvent.originalData.resourceName;
            case 'resourceTo':
                return toEvent.originalData.resourceName;
            case 'startFrom':
            case 'startTo':
                event = type === 'startFrom' ? fromEvent : toEvent;
                return SchedulerEventUtils.formatDate(event.originalData.startDate);
            case 'endFrom':
            case 'endTo':
                event = type === 'endFrom' ? fromEvent : toEvent;
                return SchedulerEventUtils.formatDate(event.originalData.endDate);
            case 'durationFrom':
            case 'durationTo':
                event = type === 'durationFrom' ? fromEvent : toEvent;
                return event.originalData.blockDurationHrs + " h";
            case 'activityPercentFinishedFrom':
            case 'activityPercentFinishedTo':
                event = type === 'activityPercentFinishedFrom' ? fromEvent : toEvent;
                return event.originalData.activityPercentFinished + " %";
            case 'operationNameFrom':
            case 'operationNameTo':
                event = type === 'operationNameFrom' ? fromEvent : toEvent;
                return event.originalData.opName;
            default:
                return 'Invalid type';
        }
    }
    static formatDate(date) {
        try {
            const options = { year: 'numeric', month: 'short', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: true };
            return new Date(date).toLocaleString('en-US', options).replace(',', '');
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid date';
        }
    }
}
