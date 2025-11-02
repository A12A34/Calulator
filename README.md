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
# Calculator

Modern, responsive calculator with liquid glass design and advanced scientific features.

## Features

### Basic Operations
- Standard arithmetic: add, subtract, multiply, divide
- Decimal input, percent, clear (C), backspace
- Keyboard support for all basic operations

### Advanced Mode
- **Scientific Functions**: sin, cos, tan, ln, log
- **Power Operations**: x², xʸ (power), √ (square root), 1/x
- **Constants**: π (pi), e (Euler's number)
- **Memory**: MC (clear), MR (recall), M+ (add), M- (subtract)
- **Expression Building**: Parentheses ( ), multi-step expressions
- **Degree/Radian Toggle**: Switch between deg/rad for trig functions
- **Clear Entry (CE)**: Clear current input without resetting expression

### Smart Features
- **Expression Display**: Shows your full expression as you build it
- **Calculation History**: Persistent history with localStorage (click to recall)
- **Copy**: Copy current result to clipboard
- **Expression Evaluator**: Proper operator precedence, function evaluation

### Design
- **Liquid Glass Effect**: Frosted glassmorphism with backdrop blur
- **Animated Background**: Subtle floating gradient blobs
- **Responsive**: Adapts to all screen sizes
- **Accessible**: ARIA labels, keyboard navigation, reduced-motion support

## How to Use

1. **Open** `index.html` in your browser
2. **Switch Modes**: Use the selector at the bottom (basic/advanced)
3. **Build Expressions**: 
   - Enter numbers and operators
   - Use parentheses for grouping: `( 2 + 3 ) × 4`
   - Chain operations: `5 + 3 × 2 - 1`
4. **Functions**: In advanced mode, use sin/cos/tan/ln/log
   - Example: `sin ( 30 )` in degree mode = 0.5
5. **History**: Click "History" to see past calculations; click any entry to recall

## Keyboard Shortcuts

- **0-9**: Number input
- **. (period)**: Decimal point
- **+ - * /**: Operators (use * for ×, / for ÷)
- **%**: Percent
- **Enter or =**: Calculate result
- **Backspace**: Delete last digit/token
- **Escape**: Clear all (reset calculator)

## Technical Notes

- Uses **Shunting-yard algorithm** for expression parsing
- **RPN (Reverse Polish Notation)** evaluator for proper operator precedence
- Results rounded to avoid floating-point artifacts
- Scientific notation for very large/small numbers
- Division by zero and invalid operations show "Error"
- History stored in browser localStorage (max 50 entries)

## Browser Compatibility

- Modern browsers with CSS backdrop-filter support
- Fallback styles for unsupported browsers
- Respects `prefers-reduced-motion` for animations

Notes:
- Division by zero and invalid operations show `Error` and reset the calculator on the next input.
- Results are rounded to avoid floating point artifacts; very large/small numbers switch to scientific notation automatically.