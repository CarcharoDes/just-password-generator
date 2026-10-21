document.addEventListener('DOMContentLoaded', () => {

    const lengthInput = document.getElementById('password-length');
    const chkUppercase = document.getElementById('chk-uppercase');
    const chkLowercase = document.getElementById('chk-lowercase');
    const chkNumbers = document.getElementById('chk-numbers');
    const presetSelect = document.getElementById('chars-preset');
    const specialCharsInput = document.getElementById('special-chars');
    const btnGenerate = document.getElementById('btn-generate');
    const resultDisplay = document.getElementById('result-display');
    const btnCopy = document.getElementById('btn-copy');
    const copyToast = document.getElementById('copy-toast');
    const strengthBar = document.getElementById('strength-bar');
    
    const chkShowPassword = document.getElementById('chk-show-password');

    const CHARS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789'
    };

    const PRESETS = {
        standard: '!@#\$%&()_?,',
        strict: '!@#\$_-',
        minimal: '!@*',
        custom: ''
    };

    lengthInput.addEventListener('change', () => {
        let value = parseInt(lengthInput.value, 10);
        if (isNaN(value) || value < 4) value = 4;
        if (value > 64) value = 64;
        lengthInput.value = value;
    });

    presetSelect.addEventListener('change', () => {
        const selectedPreset = presetSelect.value;
        if (selectedPreset !== 'custom') {
            specialCharsInput.value = PRESETS[selectedPreset];
        }
        validateControls();
    });

    specialCharsInput.addEventListener('input', () => {
        presetSelect.value = 'custom';
        validateControls();
    });

    [chkUppercase, chkLowercase, chkNumbers].forEach(element => {
        element.addEventListener('change', validateControls);
    });

    chkShowPassword.addEventListener('change', () => {
        if (chkShowPassword.checked) {
            resultDisplay.type = 'text';
        } else {
            resultDisplay.type = 'password';
        }
    });

    function validateControls() {
        const anyCheckboxChecked = chkUppercase.checked || chkLowercase.checked || chkNumbers.checked;
        const hasSpecialChars = specialCharsInput.value.length > 0;

        if (!anyCheckboxChecked && !hasSpecialChars) {
            btnGenerate.disabled = true;
        } else {
            btnGenerate.disabled = false;
        }
    }

    function getSecureRandomInt(max) {
        if (max <= 0) return 0;
        const byteLength = 1;
        const randomArray = new Uint8Array(byteLength);
        
        const safeMax = max > 256 ? 256 : max;
        const maxRange = 256 - (256 % safeMax);
        
        while (true) {
            window.crypto.getRandomValues(randomArray);
            if (randomArray[0] < maxRange) {
                return randomArray[0] % safeMax;
            }
        }
    }

    function secureShuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = getSecureRandomInt(i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function generatePassword() {
        const length = parseInt(lengthInput.value, 10);
        let rawPool = '';
        let guaranteedCharacters = [];

        if (chkUppercase.checked) {
            rawPool += CHARS.uppercase;
            guaranteedCharacters.push(CHARS.uppercase[getSecureRandomInt(CHARS.uppercase.length)]);
        }
        if (chkLowercase.checked) {
            rawPool += CHARS.lowercase;
            guaranteedCharacters.push(CHARS.lowercase[getSecureRandomInt(CHARS.lowercase.length)]);
        }
        if (chkNumbers.checked) {
            rawPool += CHARS.numbers;
            guaranteedCharacters.push(CHARS.numbers[getSecureRandomInt(CHARS.numbers.length)]);
        }
        
        const specialChars = specialCharsInput.value;
        if (specialChars.length > 0) {
            rawPool += specialChars;
            guaranteedCharacters.push(specialChars[getSecureRandomInt(specialChars.length)]);
        }

        const uniquePool = [...new Set(rawPool)].join('');

        if (guaranteedCharacters.length > length) {
            guaranteedCharacters = guaranteedCharacters.slice(0, length);
        }

        const remainingLength = length - guaranteedCharacters.length;
        for (let i = 0; i < remainingLength; i++) {
            const randomIndex = getSecureRandomInt(uniquePool.length);
            guaranteedCharacters.push(uniquePool[randomIndex]);
        }

        const shuffledPasswordArray = secureShuffle(guaranteedCharacters);
        const finalPassword = shuffledPasswordArray.join('');

        resultDisplay.value = finalPassword;

        chkShowPassword.disabled = false;

        updateStrengthBar(finalPassword, uniquePool.length);
    }

    function updateStrengthBar(password, poolSize) {
        if (!password || poolSize <= 1) {
            strengthBar.style.width = '0%';
            return;
        }

        const entropy = password.length * Math.log2(poolSize);
        let percentage = Math.min((entropy / 100) * 100, 100);
        
        strengthBar.style.width = `${percentage}%`;

        const factor = percentage / 100;
        const r = Math.round(234 + (59 - 234) * factor);
        const g = Math.round(114 + (130 - 114) * factor);
        const b = Math.round(43 + (246 - 43) * factor);

        strengthBar.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    async function copyToClipboard() {
        const password = resultDisplay.value;
        if (!password || password === 'The password will go here...') return;

        try {
            await navigator.clipboard.writeText(password);
            
            copyToast.classList.add('show');
            setTimeout(() => {
                copyToast.classList.remove('show');
            }, 2000);
        } catch (err) {
            console.error('Не вдалося скопіювати текст: ', err);
        }
    }

    btnGenerate.addEventListener('click', generatePassword);
    btnCopy.addEventListener('click', copyToClipboard);

    validateControls();
});
