window.initKeydownListener = (shortcuts, componentReference) => {
    window.addEventListener('keydown', (event) => {
        shortcuts.forEach(section => {
            section.shortcuts.forEach(shortcut => {
                const keys = shortcut.key.split(' + ').map(k => k.toLowerCase().trim());
                const ctrlPressed = keys.includes('ctrl') ? event.ctrlKey : true;
                const altPressed = keys.includes('alt') ? event.altKey : true;
                const shiftPressed = keys.includes('shift') ? event.shiftKey : true;

                let keyPressed = keys.find(k => !['ctrl', 'alt', 'shift'].includes(k));

                // Normalize key names
                const normalizedKey = event.key.toLowerCase();
                const keyMappings = {
                    "arrowup": "up",
                    "arrowdown": "down",
                    "plus": "plus",
                    "add": "plus",
                    "+": "plus",
                    "subtract": "minus",
                    "-": "minus"
                };

                const mappedKey = keyMappings[normalizedKey] || normalizedKey;

                if (ctrlPressed && altPressed && shiftPressed && mappedKey === keyPressed) {
                    componentReference.invokeMethodAsync('ExecuteShortcut', shortcut.action);
                    event.preventDefault(); // Prevent default action if the shortcut is recognized
                }
            });
        });
    });
};
