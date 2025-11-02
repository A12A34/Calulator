// Calculator logic and UI wiring
// Implements: basic operations, percent, backspace, clear, equals,
// advanced unary ops (negate, sqrt, square, reciprocal), constants (π, e),
// memory (MC, MR, M+, M-), mode toggle, and keyboard support.

(function () {
    'use strict';
    const buttonsContainer = document.querySelector('.buttons-dev');
    const display = document.getElementById('displayScreen');
    const basicMode = document.getElementById('basic-mode');
    const advancedMode = document.getElementById('advanced-mode');
    const modeSelect = document.getElementById('modechange');

    const state = {
        displayValue: '0',
        firstOperand: null,
        operator: null,
        waitingForSecondOperand: false,
        memory: 0,
    };

    // Utils
    const MAX_DISPLAY_LENGTH = 16;

    function formatNumber(n) {
        if (!isFinite(n)) return 'Error';
        // Round to avoid floating garbage, keep significant digits
        const rounded = Math.round(n * 1e12) / 1e12;
        // Use toString for small ints, otherwise toPrecision if too long
        let s = String(rounded);
        if (s.length > MAX_DISPLAY_LENGTH) {
            s = Number(rounded).toExponential(10);
        }
        return s;
    }

    function updateDisplay() {
        display.textContent = state.displayValue;
    }

    function resetCalculator() {
        state.displayValue = '0';
        state.firstOperand = null;
        state.operator = null;
        state.waitingForSecondOperand = false;
    }

    function inputDigit(digit) {
        const { displayValue, waitingForSecondOperand } = state;
        if (waitingForSecondOperand) {
            state.displayValue = digit;
            state.waitingForSecondOperand = false;
        } else {
            state.displayValue = displayValue === '0' ? digit : displayValue + digit;
        }
    }

    function inputDecimal() {
        if (state.waitingForSecondOperand) {
            state.displayValue = '0.';
            state.waitingForSecondOperand = false;
            return;
        }
        if (!state.displayValue.includes('.')) {
            state.displayValue += '.';
        }
    }

    function backspace() {
        if (state.waitingForSecondOperand) {
            state.displayValue = '0';
            state.waitingForSecondOperand = false;
            return;
        }
        if (state.displayValue.length > 1) {
            state.displayValue = state.displayValue.slice(0, -1);
        } else {
            state.displayValue = '0';
        }
    }

    function inputPercent() {
        const value = parseFloat(state.displayValue);
        if (isNaN(value)) return;
        state.displayValue = formatNumber(value / 100);
    }

    function calculate(first, second, operator) {
        switch (operator) {
            case 'add':
                return first + second;
            case 'subtract':
                return first - second;
            case 'multiply':
                return first * second;
            case 'divide':
                if (second === 0) return Infinity; // handled as Error by formatNumber
                return first / second;
            default:
                return second;
        }
    }

    function handleOperator(nextOperator) {
        const inputValue = parseFloat(state.displayValue);
        if (isNaN(inputValue)) return;

        if (state.operator && state.waitingForSecondOperand) {
            // Allow operator change before entering second operand
            state.operator = nextOperator;
            return;
        }

        if (state.firstOperand === null) {
            state.firstOperand = inputValue;
        } else if (state.operator) {
            const result = calculate(state.firstOperand, inputValue, state.operator);
            const formatted = formatNumber(result);
            state.displayValue = formatted;
            state.firstOperand = formatted === 'Error' ? null : parseFloat(formatted);
            if (formatted === 'Error') {
                state.operator = null;
                state.waitingForSecondOperand = false;
                return;
            }
        }

        state.waitingForSecondOperand = true;
        state.operator = nextOperator;
    }

    function equals() {
        if (state.operator === null || state.waitingForSecondOperand) return;
        const inputValue = parseFloat(state.displayValue);
        const result = calculate(state.firstOperand, inputValue, state.operator);
        const formatted = formatNumber(result);
        state.displayValue = formatted;
        state.firstOperand = null;
        state.operator = null;
        state.waitingForSecondOperand = false;
    }

    // Advanced unary operations
    const unaryOps = {
        negate: (x) => -x,
        sqrt: (x) => (x < 0 ? NaN : Math.sqrt(x)),
        square: (x) => x * x,
        reciprocal: (x) => (x === 0 ? Infinity : 1 / x),
    };

    function applyUnary(op) {
        const value = parseFloat(state.displayValue);
        if (isNaN(value)) return;
        const result = unaryOps[op](value);
        const formatted = formatNumber(result);
        state.displayValue = formatted;
        if (formatted === 'Error') {
            resetCalculator();
            state.displayValue = 'Error';
        } else {
            // After unary, it's a new entry if we were waiting for second operand
            state.waitingForSecondOperand = false;
        }
    }

    // Constants
    function setConstant(constant) {
        const value = constant === 'pi' ? Math.PI : Math.E;
        state.displayValue = formatNumber(value);
        state.waitingForSecondOperand = false;
    }

    // Memory functions
    function memoryClear() {
        state.memory = 0;
    }
    function memoryRecall() {
        state.displayValue = formatNumber(state.memory);
        state.waitingForSecondOperand = false;
    }
    function memoryPlus() {
        const v = parseFloat(state.displayValue);
        if (!isNaN(v)) state.memory += v;
    }
    function memoryMinus() {
        const v = parseFloat(state.displayValue);
        if (!isNaN(v)) state.memory -= v;
    }

    // Build Advanced Mode Buttons
    function buildAdvancedButtons() {
        const defs = [
            { label: '±', action: 'negate' },
            { label: '√', action: 'sqrt' },
            { label: 'x²', action: 'square' },
            { label: '1/x', action: 'reciprocal' },
            { label: 'π', action: 'pi' },
            { label: 'e', action: 'e' },
            { label: 'MC', action: 'mem-clear' },
            { label: 'MR', action: 'mem-recall' },
            { label: 'M+', action: 'mem-plus' },
            { label: 'M-', action: 'mem-minus' },
        ];
        const frag = document.createDocumentFragment();
        defs.forEach((d) => {
            const btn = document.createElement('button');
            btn.className = 'button';
            btn.textContent = d.label;
            btn.setAttribute('data-action', d.action);
            frag.appendChild(btn);
        });
        advancedMode.appendChild(frag);
    }

    // Mode toggle
    function setMode(mode) {
        if (mode === 'advanced') {
            advancedMode.style.display = 'contents';
        } else {
            advancedMode.style.display = 'none';
        }
    }

    // Event handling
    buttonsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const number = target.getAttribute('data-number');
        const action = target.getAttribute('data-action');

        if (number !== null) {
            if (state.displayValue.length >= MAX_DISPLAY_LENGTH && !state.waitingForSecondOperand) {
                return; // prevent overflow
            }
            inputDigit(number);
            updateDisplay();
            return;
        }

        if (!action) return;

        switch (action) {
            case 'decimal':
                inputDecimal();
                break;
            case 'clear':
                resetCalculator();
                break;
            case 'backspace':
                backspace();
                break;
            case 'percent':
                inputPercent();
                break;
            case 'add':
            case 'subtract':
            case 'multiply':
            case 'divide':
                handleOperator(action);
                break;
            case 'equals':
                equals();
                break;
            case 'negate':
            case 'sqrt':
            case 'square':
            case 'reciprocal':
                applyUnary(action);
                break;
            case 'pi':
                setConstant('pi');
                break;
            case 'e':
                setConstant('e');
                break;
            case 'mem-clear':
                memoryClear();
                break;
            case 'mem-recall':
                memoryRecall();
                break;
            case 'mem-plus':
                memoryPlus();
                break;
            case 'mem-minus':
                memoryMinus();
                break;
            default:
                break;
        }
        updateDisplay();
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        if (/^[0-9]$/.test(key)) {
            inputDigit(key);
            updateDisplay();
            return;
        }
        switch (key) {
            case '.':
                inputDecimal();
                break;
            case '+':
                handleOperator('add');
                break;
            case '-':
                handleOperator('subtract');
                break;
            case '*':
            case 'x':
            case 'X':
                handleOperator('multiply');
                break;
            case '/':
                handleOperator('divide');
                break;
            case 'Enter':
            case '=':
                // Some keyboards send '=' with shift
                equals();
                break;
            case 'Backspace':
                backspace();
                break;
            case 'Escape':
                resetCalculator();
                break;
            case '%':
                inputPercent();
                break;
            default:
                return; // don't update display unnecessarily
        }
        updateDisplay();
    });

    // Init
    buildAdvancedButtons();
    setMode(modeSelect.value || 'basic');
    modeSelect.addEventListener('change', (e) => setMode(e.target.value));
    updateDisplay();
})();

