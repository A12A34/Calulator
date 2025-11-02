# Calculator

Simple, responsive calculator with basic and advanced modes.

Features:
- Basic operations: add, subtract, multiply, divide
- Utilities: clear, backspace, percent, decimal
- Advanced mode: ±, √, x², 1/x, π, e
- Memory: MC, MR, M+, M-
- Keyboard support (0–9, ., +, -, *, /, %, Enter, Backspace, Escape)
- Accessible live-updating display

How to use:
1. Open `index.html` in your browser.
2. Use the selector at the bottom to switch between basic and advanced modes.
3. Use your keyboard for faster input:
	- Enter: equals
	- Escape: clear
	- Backspace: delete last digit
	- %, +, -, *, /, . work as expected

Notes:
- Division by zero and invalid operations show `Error` and reset the calculator on the next input.
- Results are rounded to avoid floating point artifacts; very large/small numbers switch to scientific notation automatically.