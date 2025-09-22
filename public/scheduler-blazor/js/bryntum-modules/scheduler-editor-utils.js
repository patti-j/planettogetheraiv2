import SchedulerEventUtils from './scheduler-event-utils.js';

export default class SchedulerEditorUtils {
    static modifyEditor(scheduler) {
        const { eventStore, features: { taskEdit } } = scheduler;
        if (taskEdit) {
            taskEdit.items = SchedulerEditorUtils.configureEditorTabs(eventStore);
        }
    }

    static configureEditorTabs(eventStore) {
        return {
            generalTab: {
                items: SchedulerEditorUtils.createGeneralTabItems()
            },
            successorsTab: SchedulerEditorUtils.createEditorTabConfig('successor', eventStore),
            predecessorsTab: SchedulerEditorUtils.createEditorTabConfig('predecessor', eventStore),
            notesTab: false,
            advancedTab: {
                items: SchedulerEditorUtils.createAdvancedTabItems()
            },
        };
    }

    static createGeneralTabItems() {
        return {
            jobName: {
                type: 'textfield',
                label: 'Job Name',
                name: 'name'
            },
            opName: {
                type: 'textfield',
                label: 'Operation Name',
                name: 'opName'

            },
            resourcesField: {
                label: 'Assigned Resource',
            },
            percentDone: { name: 'activityPercentFinished' },
            nameField: false,
            effortField: false,
            colorField: false
        };
    }

    static createAdvancedTabItems() {
        return {
            OPNeedDate: {
                type: 'textfield',
                label: 'Operation NeedDate',
                name: 'name'
            },
            blockLocked: {
                type: 'checkbox',
                label: 'Locked',
                name: 'blockLocked'
            },
            OPDesc: {
                type: 'textfield',
                label: 'Operation Description',
                name: 'opDesc'
            },
            activityRequiredFinishQty: {
                type: 'textfield',
                label: 'Required Finish Qty',
                name: 'activityRequiredFinishQty'
            },
            opMaterialsList: {
                type: 'textfield',
                label: 'Materials List',
                name: 'opMaterialsList'
            },
            customer: {
                type: 'textfield',
                label: 'Customer',
                name: 'customer'
            },
            calendarField: false,
            manuallyScheduledField: false,
            schedulingModeField: false,
            effortDrivenField: false,
            rollupField: false,
            schedulingDirectionField: false,
            inactiveField: false,
            ignoreResourceCalendarField: false,
            constraintDateField: false,
            constraintTypeField: false
        };
    }
    static createEditorTabConfig(type, eventStore) {
        return {
            items: {
                grid: {
                    columns: {
                        data: SchedulerEditorUtils.createGridColumns(type, eventStore)
                    }
                }
            }
        };
    }

    static createGridColumns(type, eventStore) {
        return {
            name: { hidden: true },
            type: { hidden: true },
            lag: { hidden: true },
            opname: {
                width: 200,
                text: "Operation Name",
                renderer: ({ record }) =>
                    type === 'successor'
                        ? SchedulerEventUtils.renderEvent(eventStore, record, 'operationNameTo')
                        : SchedulerEventUtils.renderEvent(eventStore, record, 'operationNameFrom')
            },
            assignedResource: {
                width: 200,
                text: "Assigned Resource",
                renderer: ({ record }) =>
                    type === 'successor'
                        ? SchedulerEventUtils.renderEvent(eventStore, record, 'resourceTo')
                        : SchedulerEventUtils.renderEvent(eventStore, record, 'resourceFrom')
            },
            start: {
                width: 200,
                text: "Start",
                renderer: ({ record }) =>
                    type === 'successor'
                        ? SchedulerEventUtils.renderEvent(eventStore, record, 'startTo')
                        : SchedulerEventUtils.renderEvent(eventStore, record, 'startFrom')
            },
            end: {
                width: 200,
                text: "End",
                renderer: ({ record }) =>
                    type === 'successor'
                        ? SchedulerEventUtils.renderEvent(eventStore, record, 'endTo')
                        : SchedulerEventUtils.renderEvent(eventStore, record, 'endFrom')
            },
            duration: {
                width: 100,
                text: "Duration",
                renderer: ({ record }) =>
                    type === 'successor'
                        ? SchedulerEventUtils.renderEvent(eventStore, record, 'durationTo')
                        : SchedulerEventUtils.renderEvent(eventStore, record, 'durationFrom')
            },
            complete: {
                width: 100,
                text: "% Complete",
                renderer: ({ record }) =>
                    type === 'successor'
                        ? SchedulerEventUtils.renderEvent(eventStore, record, 'activityPercentFinishedTo')
                        : SchedulerEventUtils.renderEvent(eventStore, record, 'activityPercentFinishedFrom')
            }
        };
    }
}
