export function getBrowserTimeZoneOffset() {
    //const options = Intl.DateTimeFormat().resolvedOptions();
    //return options.timeZone;
    return new Date().getTimezoneOffset();
}