window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }

    // Variable to store Morse code input
    let morseCode = '';

    // Create an AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Function to play a 600 Hz sine wave for a short duration
    const playTone = (duration) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // 600 Hz
        oscillator.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, duration);
    };

    // Add event listeners for keyboard input
    window.addEventListener('keydown', (event) => {
        if (event.code === 'ControlLeft') {
            morseCode += '.';
            playTone(100); // Play dot sound for 100ms
            console.log('Left Ctrl key pressed (dot)');
        } else if (event.code === 'ControlRight') {
            morseCode += '-';
            playTone(300); // Play dash sound for 300ms
            console.log('Right Ctrl key pressed (dash)');
        }

        // Optionally, display the Morse code input
        const morseCodeElement = document.getElementById('morse-code');
        if (morseCodeElement) {
            morseCodeElement.innerText = morseCode;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.code === 'ControlLeft') {
            console.log('Left Ctrl key released');
        } else if (event.code === 'ControlRight') {
            console.log('Right Ctrl key released');
        }
    });
});