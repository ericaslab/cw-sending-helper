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
 
    // Variables to track key states and intervals
    let leftCtrlPressed = false;
    let rightCtrlPressed = false;
    let intervalId = null;
    let keyQueue = null;
    let cwElementLength = 100; // Length of a single Morse code element in milliseconds
    let ditLength = cwElementLength * 1; // Length of a dit, one element
    let dahLength = cwElementLength * 3; // Length of a dah, three elements
    let spaceLength = cwElementLength * 1; // Length of a space, one element
    let isPlaying = false;
    let keyPlaying = null;


    // Function to play SideTone
    const playTone = (key) => {
        if (isPlaying) { // If a sound is already playing, queue the key
            if (keyQueue === null && key !== keyPlaying) {
                keyQueue = key;
            }
            return; 
        }

        isPlaying = true; // Set the flag to indicate a sound is playing
        keyPlaying = key;

        if (key === 'dit') {
            var duration = ditLength;
        }
        else if (key === 'dah') {
            var duration = dahLength;
        }

        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // 600 Hz
        oscillator.connect(audioContext.destination);
        oscillator.start();

        setTimeout(() => {
            oscillator.stop();

            setTimeout(() => {
                isPlaying = false; // Clear the flag when the sound stops
                keyPlaying = null;

                if (key === 'dit') {
                    morseCode += '.';
                }
                else if (key === 'dah') {
                    morseCode += '-';
                }
                const morseCodeElement = document.getElementById('morse-code');
                if (morseCodeElement) {
                    morseCodeElement.innerText = morseCode;
                }
            }, spaceLength);
        }, duration);
    };

    // Check if we need to play the queued key
    setInterval(() => {
        if (keyQueue && !isPlaying) {
            playTone(keyQueue);
            keyQueue = null;
        }
    }, 10); // Check every 10 milliseconds

    // Function to handle hitting both paddles at the same time
    const handleSqueezeKeying = () => {
        console.log('Squeeze keying started');
        if (leftCtrlPressed && rightCtrlPressed) {
            clearInterval(intervalId);
            let toggle = true;
            intervalId = setInterval(() => {
                if (!leftCtrlPressed || !rightCtrlPressed) {
                    clearInterval(intervalId);
                    console.log('Squeeze keying stopped');
                    return;
                }
                if (toggle) {
                    morseCode += '.';
                    playTone(ditLength); // Play dit sound for 100ms
                    console.log('Squeeze dit played');
                } else {
                    morseCode += '-';
                    playTone(dahLength); // Play dah sound for 300ms
                    console.log('Squeeze dah played');
                }
                toggle = !toggle;

                // Optionally, display the Morse code input
                const morseCodeElement = document.getElementById('morse-code');
                if (morseCodeElement) {
                    morseCodeElement.innerText = morseCode;
                }
            }, 400); // Adjust interval duration as needed
        }
        console.log('Squeeze keying stopped');
    };

    // Function to handle single key keying
    const handleSinglePaddleKeying = (key) => {
        clearInterval(intervalId);
        console.log('Single key keying started');
        console.log('KeyQueue: ' + keyQueue);
        console.log('KeyPlaying: ' + keyPlaying);

        if (key === 'dit') {
            playTone(key); 
        } 
        else if (key === 'dah') {
            playTone(key); 
        }
            
        intervalId = setInterval(() => {
            if (key === 'dit' && leftCtrlPressed) {
                playTone(key);
            } else if (key === 'dah' && rightCtrlPressed) {
                playTone(key); 
            } else {
                clearInterval(intervalId);
            }

        }, key === 'dit' ? ditLength/4.5 : dahLength/4.5 ); // Adjust interval duration as needed
        console.log('Single key keying stopped');
    };

    async function connectSerial() {
        try {
            // Request a port and handle the permission prompt
            const port = await navigator.serial.requestPort({
                filters: [{ usbVendorId: 0x1a86 }] // Adjust the filter as needed
            });

            if (!port) {
                console.error('No port selected by the user.');
                return;
            }


            await port.open({ baudRate: 1200 });
            console.log('Port opened successfully');

            // Create a writer to send data to the serial port
            const writer = port.writable.getWriter();

            // Send the hex commands \x00\x02 to initialize the Winkeyer
            const command = new Uint8Array([0x00, 0x02]);
            await writer.write(command);
            console.log('Initialization command sent');

            // Release the writer lock
            writer.releaseLock();

            const reader = port.readable.getReader();
            const decoder = new TextDecoderStream();
            const inputDone = port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable;

            const readerStream = inputStream.getReader();

            while (true) {
                const { value, done } = await readerStream.read();
                if (done) {
                    // Allow the serial port to be closed later.
                    readerStream.releaseLock();
                    break;
                }
                // Process the received data and append it to morseCode
                morseCode += value;
                const morseCodeElement = document.getElementById('morse-code');
                if (morseCodeElement) {
                    morseCodeElement.textContent = morseCode;
                }
            }
        } catch (error) {
            console.error('Error connecting to serial port:', error);
        }
    }

    // Add event listener to the connect button
    const connectButton = document.getElementById('connect-button');
    connectButton.addEventListener('click', connectSerial);

    // Add event listeners for keyboard input
    window.addEventListener('keydown', (event) => {
        if ((event.code === 'ControlLeft' || event.key === ',') && !leftCtrlPressed) {
            leftCtrlPressed = true;
            if (!rightCtrlPressed) {
                handleSinglePaddleKeying('dit');
            } else {
                handleSinglePaddleKeying('dit');
                //handleSqueezeKeying();   // Temp disabled Squeeze Keying for testing
            }
            console.log('Left Ctrl key or comma pressed (dit)');
        } else if ((event.code === 'ControlRight' || event.key === '.') && !rightCtrlPressed) {
            rightCtrlPressed = true;
            if (!leftCtrlPressed) {
                handleSinglePaddleKeying('dah');
            } else {
                handleSinglePaddleKeying('dah');
                //handleSqueezeKeying(); // Temp disabled Squeeze Keying for testing
            }
            console.log('Right Ctrl key or period pressed (dah)');
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.code === 'ControlLeft' || event.key === ',') {
            leftCtrlPressed = false;
            console.log('Left Ctrl key or comma released');
        } else if (event.code === 'ControlRight' || event.key === '.') {
            rightCtrlPressed = false;
            console.log('Right Ctrl key or period released');
        }

        if (!leftCtrlPressed && !rightCtrlPressed) {
            clearInterval(intervalId);
        } else if (leftCtrlPressed && rightCtrlPressed) {
            // Add any additional logic if needed when both keys are pressed
        }
    });

});