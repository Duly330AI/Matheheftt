import { CellData, TaskType, TaskResult } from '../types';

const getCellKey = (r: number, c: number) => `${r},${c}`;

export const generateMathTask = (
  taskType: TaskType,
  startR: number,
  selectedTable: number | null
): TaskResult => {
  let op = '';
  let focusR = 0;
  let focusC = 0;
  let autoMoveDir: 'left' | 'right' | 'down' | 'none' = 'right';

  if (taskType === 'mixed') {
    const operations = ['+', '-', '*', ':'];
    op = operations[Math.floor(Math.random() * operations.length)];
  } else if (taskType === '1x1') {
    op = '*';
  } else {
    op = taskType;
  }

  const startC = 2;

  let newGrid: Record<string, CellData> = {};
  let newSolution: Record<string, string> = {};
  let newCarry: Record<string, string> = {};
  let taskHeight = 0;

  if (op === '+' || op === '-') {
    // Vertical Addition/Subtraction
    autoMoveDir = 'left';

    const a = Math.floor(Math.random() * 899) + 100; // 3 digits
    const b = Math.floor(Math.random() * 899) + 100; // 3 digits

    const [num1, num2] = op === '-' && b > a ? [b, a] : [a, b];
    const result = op === '+' ? num1 + num2 : num1 - num2;

    const str1 = num1.toString();
    const str2 = num2.toString();
    const strRes = result.toString();

    const alignCol = startC + 4;
    focusR = startR + 2;
    focusC = alignCol;

    // Place num1
    for (let i = 0; i < str1.length; i++) {
      newGrid[getCellKey(startR, alignCol - str1.length + 1 + i)] = { value: str1[i], underlined: false };
    }

    // Place op
    newGrid[getCellKey(startR + 1, startC)] = { value: op, underlined: false };

    // Place num2
    for (let i = 0; i < str2.length; i++) {
      newGrid[getCellKey(startR + 1, alignCol - str2.length + 1 + i)] = { value: str2[i], underlined: true };
    }

    // Underline
    for (let c = startC; c <= alignCol; c++) {
      const key = getCellKey(startR + 1, c);
      if (!newGrid[key]) {
        newGrid[key] = { value: '', underlined: true };
      } else {
        newGrid[key].underlined = true;
      }
    }

    // Expected Result & Carries
    let currentCarry = 0;
    const maxLen = Math.max(str1.length, str2.length);

    for (let i = 0; i < maxLen + 1; i++) {
      const d1 = i < str1.length ? parseInt(str1[str1.length - 1 - i]) : 0;
      const d2 = i < str2.length ? parseInt(str2[str2.length - 1 - i]) : 0;

      let colRes = 0;
      let nextCarry = 0;

      if (op === '+') {
        const sum = d1 + d2 + currentCarry;
        colRes = sum % 10;
        nextCarry = Math.floor(sum / 10);
      } else {
        let val = d1 - d2 - currentCarry;
        if (val < 0) {
          val += 10;
          nextCarry = 1;
        } else {
          nextCarry = 0;
        }
        colRes = val;
      }

      const col = alignCol - i;
      const row = startR + 2;

      if (i < strRes.length) {
        newSolution[getCellKey(row, col)] = colRes.toString();

        if (nextCarry > 0) {
          // Carry is always marked in the generating column (current column)
          const carryVal = op === '-' ? `-${nextCarry}` : nextCarry.toString();
          newCarry[getCellKey(row, col)] = carryVal;
        }
      }

      currentCarry = nextCarry;
    }
    taskHeight = 3; // num1, num2, result

  } else {
    // Horizontal Multiplication/Division
    autoMoveDir = 'right';

    let num1, num2, result;

    if (op === '*') {
      if (taskType === '1x1' && selectedTable) {
        const factor = Math.floor(Math.random() * 10) + 1;
        if (Math.random() > 0.5) {
          num1 = selectedTable;
          num2 = factor;
        } else {
          num1 = factor;
          num2 = selectedTable;
        }
        result = num1 * num2;
      } else {
        const a = Math.floor(Math.random() * 10) + 2;
        const b = Math.floor(Math.random() * 10) + 2;
        num1 = a;
        num2 = b;
        result = a * b;
      }

      const taskStr = `${num1}${op}${num2}=`;
      taskStr.split('').forEach((char, i) => {
        newGrid[getCellKey(startR, startC + i)] = { value: char, underlined: false };
      });

      const resStr = result.toString();
      const resStartC = startC + taskStr.length;
      focusR = startR;
      focusC = resStartC;

      for (let i = 0; i < resStr.length; i++) {
        newSolution[getCellKey(startR, resStartC + i)] = resStr[i];
      }
      taskHeight = 1;
    } else { // Division
      result = Math.floor(Math.random() * 20) + 2;
      num2 = Math.floor(Math.random() * 11) + 2;
      num1 = result * num2;

      const dividendStr = num1.toString();
      const divisorStr = num2.toString();
      const quotientStr = result.toString();

      let currentC = startC;
      for (let i = 0; i < dividendStr.length; i++) newGrid[getCellKey(startR, currentC++)] = { value: dividendStr[i], underlined: false };
      newGrid[getCellKey(startR, currentC++)] = { value: ':', underlined: false };
      for (let i = 0; i < divisorStr.length; i++) newGrid[getCellKey(startR, currentC++)] = { value: divisorStr[i], underlined: false };
      newGrid[getCellKey(startR, currentC++)] = { value: '=', underlined: false };
      focusR = startR;
      focusC = currentC;

      for (let i = 0; i < quotientStr.length; i++) newSolution[getCellKey(startR, currentC + i)] = quotientStr[i];

      // Long Division Steps
      let remainderVal = 0;
      let hasStarted = false;
      let currentRow = startR + 1;

      for (let i = 0; i < dividendStr.length; i++) {
        const digit = parseInt(dividendStr[i]);
        remainderVal = remainderVal * 10 + digit;

        if (!hasStarted) {
          if (remainderVal >= num2) hasStarted = true;
          else continue;
        }

        const qDigit = Math.floor(remainderVal / num2);
        const product = qDigit * num2;
        const newRemainder = remainderVal - product;

        if (i > 0 && currentRow > startR + 1) {
          const valStr = remainderVal.toString();
          for (let k = 0; k < valStr.length; k++) {
            newSolution[getCellKey(currentRow - 1, startC + i - (valStr.length - 1) + k)] = valStr[k];
          }
        }

        const productStr = product.toString();
        for (let k = 0; k < productStr.length; k++) {
          newSolution[getCellKey(currentRow, startC + i - (productStr.length - 1) + k)] = productStr[k];
        }
        currentRow++;

        remainderVal = newRemainder;

        if (i === dividendStr.length - 1) {
          const finalStr = remainderVal.toString();
          for (let k = 0; k < finalStr.length; k++) {
            newSolution[getCellKey(currentRow, startC + i - (finalStr.length - 1) + k)] = finalStr[k];
          }
        } else {
          currentRow++;
        }
      }
      taskHeight = currentRow - startR + 1;
    }
  }

  return {
    grid: newGrid,
    solutionMap: newSolution,
    carryMap: newCarry,
    taskHeight,
    focusR,
    focusC,
    autoMoveDir
  };
};
