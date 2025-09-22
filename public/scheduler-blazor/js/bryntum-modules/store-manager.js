class StoreManager {
    constructor(store) {
        this.store = store;
    }

    async updateRecords(records) {
        const newRecords = records.filter(record => !this.store.getById(record.id));
        await this.store.add(newRecords);

        const recordsToRemove = this.store.records.filter(record =>
            !records.some(r => r.id === record.id)
        );
        await this.store.remove(recordsToRemove);

        const orderMap = new Map(records.map((record, index) => [record.id, index]));
        await this.store.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));
    }

    async updateOrCreateRecord(record) {
        const existingRecord = this.store.getById(record.id);
        if (existingRecord) {
            existingRecord.set(record);
        } else {
            await this.store.add(record);
        }
    }
}

export default StoreManager;