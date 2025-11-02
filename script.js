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
        exprTokens: [],
        currentToken: '',
        degMode: false,
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
        const exprEl = document.getElementById('expressionDisplay');
        if (exprEl) {
            exprEl.textContent = state.exprTokens.join(' ') + (state.currentToken ? ' ' + state.currentToken : '');
        }
    }

    function resetCalculator() {
        state.displayValue = '0';
        state.firstOperand = null;
        state.operator = null;
        state.waitingForSecondOperand = false;
    }

    function inputDigit(digit) {
        // Build a token (part of an expression)
        if (state.currentToken === '0') state.currentToken = digit; else state.currentToken += digit;
        state.displayValue = state.currentToken;
    }

    function inputDecimal() {
        if (!state.currentToken) {
            state.currentToken = '0.';
        } else if (!state.currentToken.includes('.')) {
            state.currentToken += '.';
        }
        state.displayValue = state.currentToken;
    }

    function backspace() {
        if (state.currentToken && state.currentToken.length > 0) {
            state.currentToken = state.currentToken.slice(0, -1);
            state.displayValue = state.currentToken || '0';
            return;
        }
        // if no current token, allow removing last token from expression
        if (state.exprTokens.length) {
            state.exprTokens.pop();
            state.displayValue = '0';
        }
    }

    function inputPercent() {
        const target = state.currentToken || state.displayValue;
        const value = parseFloat(target);
        if (isNaN(value)) return;
        const result = value / 100;
        if (state.currentToken) state.currentToken = String(result);
        state.displayValue = formatNumber(result);
    }

    function clearEntry() {
        state.currentToken = '';
        state.displayValue = '0';
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

    // Expression evaluator (shunting-yard + RPN)
    const OPERATORS = {
        '+': { prec: 2, assoc: 'L', fn: (a, b) => a + b },
        '-': { prec: 2, assoc: 'L', fn: (a, b) => a - b },
        '*': { prec: 3, assoc: 'L', fn: (a, b) => a * b },
        '/': { prec: 3, assoc: 'L', fn: (a, b) => a / b },
        '^': { prec: 4, assoc: 'R', fn: (a, b) => Math.pow(a, b) },
    };

    function isNumberToken(t) {
        return /^-?\d+(?:\.\d+)?$/.test(t);
    }

    function tokenizeExpression(tokens) {
        // tokens is array of strings already
        return tokens.map(t => t);
    }

    function toRPN(tokens) {
        const output = [];
        const ops = [];
        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (isNumberToken(t) || t === 'pi' || t === 'e') {
                output.push(t);
            } else if (t in OPERATORS) {
                while (ops.length) {
                    const o2 = ops[ops.length - 1];
                    if (o2 in OPERATORS && ((OPERATORS[t].assoc === 'L' && OPERATORS[t].prec <= OPERATORS[o2].prec) || (OPERATORS[t].assoc === 'R' && OPERATORS[t].prec < OPERATORS[o2].prec))) {
                        output.push(ops.pop());
                        continue;
                    }
                    break;
                }
                ops.push(t);
            } else if (t === '(') {
                ops.push(t);
            } else if (t === ')') {
                while (ops.length && ops[ops.length - 1] !== '(') {
                    output.push(ops.pop());
                }
                ops.pop(); // pop '('
            } else {
                // function names (sin, cos...)
                ops.push(t);
            }
        }
        while (ops.length) output.push(ops.pop());
        return output;
    }

    function evalRPN(rpn) {
        const stack = [];
        for (const t of rpn) {
            if (isNumberToken(t)) {
                stack.push(parseFloat(t));
            } else if (t === 'pi') {
                stack.push(Math.PI);
            } else if (t === 'e') {
                stack.push(Math.E);
            } else if (t in OPERATORS) {
                const b = stack.pop();
                const a = stack.pop();
                stack.push(OPERATORS[t].fn(a, b));
            } else {
                // functions
                const a = stack.pop();
                let res = NaN;
                switch (t) {
                    case 'sin': res = state.degMode ? Math.sin(a * Math.PI / 180) : Math.sin(a); break;
                    case 'cos': res = state.degMode ? Math.cos(a * Math.PI / 180) : Math.cos(a); break;
                    case 'tan': res = state.degMode ? Math.tan(a * Math.PI / 180) : Math.tan(a); break;
                    case 'ln': res = Math.log(a); break;
                    case 'log': res = Math.log10 ? Math.log10(a) : Math.log(a) / Math.LN10; break;
                    case 'sqrt': res = a < 0 ? NaN : Math.sqrt(a); break;
                    case 'neg': res = -a; break;
                    case 'square': res = a * a; break;
                    case 'reciprocal': res = a === 0 ? Infinity : 1 / a; break;
                    default: res = NaN; break;
                }
                stack.push(res);
            }
        }
        return stack.pop();
    }

    function evaluateExpression(tokens) {
        try {
            const rpn = toRPN(tokens);
            const val = evalRPN(rpn);
            return val;
        } catch (e) {
            return NaN;
        }
    }

    function handleOperator(nextOperator) {
        // push current token if present
        if (state.currentToken) {
            state.exprTokens.push(state.currentToken);
            state.currentToken = '';
        }
        // map action names to symbols
        const map = { add: '+', subtract: '-', multiply: '*', divide: '/', '^': '^' };
        const sym = map[nextOperator] || nextOperator;
        state.exprTokens.push(sym);
    }

    function equals() {
        // finish expression and evaluate
        if (state.currentToken) {
            state.exprTokens.push(state.currentToken);
            state.currentToken = '';
        }
        if (!state.exprTokens.length) return;
        const val = evaluateExpression(state.exprTokens);
        const formatted = isFinite(val) ? formatNumber(val) : 'Error';
        state.displayValue = formatted;
        // push to history
        try {
            const hist = JSON.parse(localStorage.getItem('calc_history') || '[]');
            hist.unshift({ expr: state.exprTokens.join(' '), result: formatted, t: Date.now() });
            localStorage.setItem('calc_history', JSON.stringify(hist.slice(0, 50)));
            renderHistory();
        } catch (e) { }
        state.exprTokens = [];
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
        // Apply to current token if present, otherwise to display
        const target = state.currentToken || state.displayValue;
        const value = parseFloat(target);
        if (isNaN(value)) return;
        const result = unaryOps[op](value);
        const formatted = formatNumber(result);
        if (state.currentToken) state.currentToken = String(result);
        state.displayValue = formatted;
        if (formatted === 'Error') {
            resetCalculator();
            state.displayValue = 'Error';
        }
    }

    // Constants
    function setConstant(constant) {
        const value = constant === 'pi' ? Math.PI : Math.E;
        state.currentToken = String(value);
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
            { label: 'CE', action: 'clear-entry' },
            { label: '(', action: 'paren-open' },
            { label: ')', action: 'paren-close' },
            { label: '√', action: 'sqrt' },
            { label: 'x²', action: 'square' },
            { label: 'xʸ', action: 'power' },
            { label: '1/x', action: 'reciprocal' },
            { label: 'sin', action: 'sin' },
            { label: 'cos', action: 'cos' },
            { label: 'tan', action: 'tan' },
            { label: 'ln', action: 'ln' },
            { label: 'log', action: 'log' },
            { label: 'π', action: 'pi' },
            { label: 'e', action: 'e' },
            { label: 'MC', action: 'mem-clear' },
            { label: 'MR', action: 'mem-recall' },
            { label: 'M+', action: 'mem-plus' },
            { label: 'M-', action: 'mem-minus' },
            { label: 'Copy', action: 'copy' },
            { label: 'History', action: 'history' },
            { label: 'Deg', action: 'deg-toggle' },
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

    function renderHistory() {
        const panel = document.getElementById('historyPanel');
        if (!panel) return;
        const hist = JSON.parse(localStorage.getItem('calc_history') || '[]');
        if (!hist.length) { panel.innerHTML = '<small class="muted">No history</small>'; panel.setAttribute('aria-hidden', 'true'); return; }
        panel.innerHTML = '';
        hist.forEach(h => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.textContent = h.expr + ' = ' + h.result;
            el.addEventListener('click', () => {
                state.exprTokens = h.expr.split(' ');
                state.currentToken = '';
                state.displayValue = h.result;
                updateDisplay();
            });
            panel.appendChild(el);
        });
        panel.setAttribute('aria-hidden', 'false');
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
            case 'clear-entry':
                clearEntry();
                break;
            case 'backspace':
                backspace();
                break;
            case 'percent':
                inputPercent();
                break;
            case 'paren-open':
                state.exprTokens.push('(');
                break;
            case 'paren-close':
                if (state.currentToken) { state.exprTokens.push(state.currentToken); state.currentToken = ''; }
                state.exprTokens.push(')');
                break;
            case 'power':
                if (state.currentToken) { state.exprTokens.push(state.currentToken); state.currentToken = ''; }
                state.exprTokens.push('^');
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
                applyUnary('negate');
                break;
            case 'sqrt':
            case 'square':
            case 'reciprocal':
                applyUnary(action);
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'ln':
            case 'log':
                if (state.currentToken) { state.exprTokens.push(state.currentToken); state.currentToken = ''; }
                state.exprTokens.push(action);
                break;
            case 'copy':
                try { navigator.clipboard.writeText(String(state.displayValue)); } catch (e) { }
                break;
            case 'history':
                renderHistory();
                break;
            case 'deg-toggle':
                state.degMode = !state.degMode;
                target.classList.toggle('active', state.degMode);
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

