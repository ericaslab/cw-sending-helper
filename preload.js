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

    // Variables to track key states and intervals
    let leftCtrlPressed = false;
    let rightCtrlPressed = false;
    let intervalId = null;

    // Function to handle iambic keying
    const handleIambicKeying = () => {
        if (leftCtrlPressed && rightCtrlPressed) {
            clearInterval(intervalId);
            let toggle = true;
            intervalId = setInterval(() => {
                if (!leftCtrlPressed || !rightCtrlPressed) {
                    clearInterval(intervalId);
                    return;
                }
                if (toggle) {
                    morseCode += '.';
                    playTone(100); // Play dit sound for 100ms
                } else {
                    morseCode += '-';
                    playTone(300); // Play dah sound for 300ms
                }
                toggle = !toggle;

                // Optionally, display the Morse code input
                const morseCodeElement = document.getElementById('morse-code');
                if (morseCodeElement) {
                    morseCodeElement.innerText = morseCode;
                }
            }, 400); // Adjust interval duration as needed
        }
    };

    // Function to handle single key keying
    const handleSingleKeyKeying = (key) => {
        clearInterval(intervalId);
        if (key === 'dit') {
            playTone(100); // Play dit sound immediately for 100ms
            morseCode += '.';
        } else if (key === 'dah') {
            playTone(300); // Play dah sound immediately for 300ms
            morseCode += '-';
        }

        intervalId = setInterval(() => {
            if (key === 'dit' && leftCtrlPressed) {
                morseCode += '.';
                playTone(100); // Play dit sound for 100ms
            } else if (key === 'dah' && rightCtrlPressed) {
                morseCode += '-';
                playTone(300); // Play dah sound for 300ms
            } else {
                clearInterval(intervalId);
            }

            // Optionally, display the Morse code input
            const morseCodeElement = document.getElementById('morse-code');
            if (morseCodeElement) {
                morseCodeElement.innerText = morseCode;
            }
        }, key === 'dit' ? 200 : 600); // Adjust interval duration as needed
    };

    // Add event listeners for keyboard input
    window.addEventListener('keydown', (event) => {
        if (event.code === 'ControlLeft' && !leftCtrlPressed) {
            leftCtrlPressed = true;
            if (!rightCtrlPressed) {
                handleSingleKeyKeying('dit');
            } else {
                handleIambicKeying();
            }
            console.log('Left Ctrl key pressed (dit)');
        } else if (event.code === 'ControlRight' && !rightCtrlPressed) {
            rightCtrlPressed = true;
            if (!leftCtrlPressed) {
                handleSingleKeyKeying('dah');
            } else {
                handleIambicKeying();
            }
            console.log('Right Ctrl key pressed (dah)');
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.code === 'ControlLeft') {
            leftCtrlPressed = false;
            console.log('Left Ctrl key released');
        } else if (event.code === 'ControlRight') {
            rightCtrlPressed = false;
            console.log('Right Ctrl key released');
        }

        if (!leftCtrlPressed && !rightCtrlPressed) {
            clearInterval(intervalId);
        } else if (leftCtrlPressed && rightCtrlPressed) {
            handleIambicKeying();
        }
    });
});