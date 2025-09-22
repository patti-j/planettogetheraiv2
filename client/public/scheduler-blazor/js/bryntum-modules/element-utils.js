// src/utils/ElementUtils.js
export default class ElementUtils {
    static clearElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = ''; // Clear the inner HTML to remove existing content
        }
    }
}
