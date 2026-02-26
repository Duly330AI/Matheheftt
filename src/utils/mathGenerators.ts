import { CellData, TaskType, TaskResult, Difficulty } from '../types';

const getCellKey = (r: number, c: number) => `${r},${c}`;

export const generateMathTask = (
  taskType: TaskType,
  startR: number,
  selectedTable: number | null,
  difficulty: Difficulty = 'medium'
): TaskResult => {
  let op = '';
  let focusR = 0;
  let focusC = 0;
  let autoMoveDir: 'left' | 'right' | 'down' | 'none' = 'right';

  // 1. Determine Operation
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

  // 2. Generate Numbers based on Difficulty
  let num1 = 0;
  let num2 = 0;

  if (op === '+' || op === '-') {
    let min = 100, max = 899;
    if (difficulty === 'easy') { min = 10; max = 89; }
    if (difficulty === 'hard') { min = 1000; max = 8999; }

    const a = Math.floor(Math.random() * (max - min + 1)) + min;
    const b = Math.floor(Math.random() * (max - min + 1)) + min;
    [num1, num2] = op === '-' && b > a ? [b, a] : [a, b];
  } else if (op === '*') {
    if (taskType === '1x1' && selectedTable) {
      num1 = selectedTable;
      num2 = Math.floor(Math.random() * 10) + 1;
      if (Math.random() > 0.5) [num1, num2] = [num2, num1];
    } else {
      let aMin = 2, aMax = 99;
      let bMin = 2, bMax = 9;
      if (difficulty === 'easy') { aMin = 2; aMax = 9; bMin = 2; bMax = 9; }
      if (difficulty === 'hard') { aMin = 10; aMax = 99; bMin = 10; bMax = 99; }
      num1 = Math.floor(Math.random() * (aMax - aMin + 1)) + aMin;
      num2 = Math.floor(Math.random() * (bMax - bMin + 1)) + bMin;
    }
  } else if (op === ':') {
    let qMin = 2, qMax = 20;
    let dMin = 2, dMax = 9;
    if (difficulty === 'easy') { qMin = 2; qMax = 10; dMin = 2; dMax = 5; }
    if (difficulty === 'hard') { qMin = 20; qMax = 100; dMin = 10; dMax = 20; }
    const quotient = Math.floor(Math.random() * (qMax - qMin + 1)) + qMin;
    const divisor = Math.floor(Math.random() * (dMax - dMin + 1)) + dMin;
    num1 = quotient * divisor;
    num2 = divisor;
  }

  // 3. Generate Grid & Solution
  if (op === '+' || op === '-') {
    // --- Vertical Addition / Subtraction ---
    autoMoveDir = 'left';
    const str1 = num1.toString();
    const str2 = num2.toString();
    const result = op === '+' ? num1 + num2 : num1 - num2;
    const strRes = result.toString();

    // Calculate alignment column (right-aligned)
    const maxLen = Math.max(str1.length, str2.length, strRes.length);
    const alignCol = startC + maxLen + 1; // +1 for extra space

    // Row 1: Num1
    for (let i = 0; i < str1.length; i++) {
      newGrid[getCellKey(startR, alignCol - str1.length + 1 + i)] = { value: str1[i], underlined: false };
    }
    // Row 2: Op + Num2 (Underlined)
    newGrid[getCellKey(startR + 1, startC)] = { value: op, underlined: false };
    for (let i = 0; i < str2.length; i++) {
      newGrid[getCellKey(startR + 1, alignCol - str2.length + 1 + i)] = { value: str2[i], underlined: true };
    }
    // Underline the whole width
    for (let c = startC; c <= alignCol; c++) {
      const key = getCellKey(startR + 1, c);
      if (!newGrid[key]) newGrid[key] = { value: '', underlined: true };
      else newGrid[key].underlined = true;
    }

    // Calculate Solution & Carries
    let currentCarry = 0;
    for (let i = 0; i < maxLen || currentCarry > 0; i++) {
      const digit1 = i < str1.length ? parseInt(str1[str1.length - 1 - i]) : 0;
      const digit2 = i < str2.length ? parseInt(str2[str2.length - 1 - i]) : 0;
      let colRes = 0;
      let nextCarry = 0;

      if (op === '+') {
        const sum = digit1 + digit2 + currentCarry;
        colRes = sum % 10;
        nextCarry = Math.floor(sum / 10);
      } else {
        let val = digit1 - digit2 - currentCarry;
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

      // Result digit
      if (i < strRes.length) {
        newSolution[getCellKey(row, col)] = colRes.toString();
      }

      // Carry (displayed in the column it affects)
      if (nextCarry > 0) {
        // For addition/subtraction, carry is usually entered in the column to the left of the current calculation
        // But in the grid, it's often visualized in the same column as the result digit of the NEXT position.
        // Let's stick to: Carry for column X is stored in column X.
        // Wait, if 9+9=18. 8 is in col X. 1 is carry for col X-1.
        // So we store carry '1' at col X-1.
        newCarry[getCellKey(row, col)] = nextCarry.toString();
      }
      currentCarry = nextCarry;
    }

    focusR = startR + 2;
    focusC = alignCol;
    // Height: Num1 + Num2 + Result + Buffer
    taskHeight = 4; // 3 rows used + 1 buffer

  } else if (op === '*') {
    // --- Written Multiplication ---
    autoMoveDir = 'left';
    const str1 = num1.toString();
    const str2 = num2.toString();
    const result = num1 * num2;
    const strRes = result.toString();

    // Row 1: Task (Underlined)
    let currentC = startC;
    for (let char of str1) newGrid[getCellKey(startR, currentC++)] = { value: char, underlined: true };
    newGrid[getCellKey(startR, currentC++)] = { value: '*', underlined: true };
    for (let char of str2) newGrid[getCellKey(startR, currentC++)] = { value: char, underlined: true };
    newGrid[getCellKey(startR, currentC++)] = { value: '=', underlined: true }; // Add equals sign
    
    // Add result after '=' to solutionMap
    const resultAfterEqualsStartC = currentC;
    for (let i = 0; i < strRes.length; i++) {
        newSolution[getCellKey(startR, resultAfterEqualsStartC + i)] = strRes[i];
    }

    // Fill underline for the whole task width (including result area)
    for (let c = startC; c < resultAfterEqualsStartC + strRes.length; c++) {
        const key = getCellKey(startR, c);
        if (!newGrid[key]) newGrid[key] = { value: '', underlined: true };
        else newGrid[key].underlined = true;
    }

    // Partial Products
    let currentRow = startR + 1;
    let partials: number[] = [];
    const num2StartCol = startC + str1.length + 1;
    const taskEndCol = num2StartCol + str2.length - 1;

    for (let i = 0; i < str2.length; i++) {
      const digit2 = parseInt(str2[i]);
      const partialProduct = num1 * digit2;
      const powerOfTen = str2.length - 1 - i;
      const fullValue = partialProduct * Math.pow(10, powerOfTen);
      partials.push(fullValue);
      const fullStr = fullValue.toString();
      
      // Carries for this partial multiplication
      let stepCarry = 0;
      for (let j = str1.length - 1; j >= 0; j--) {
          const d1 = parseInt(str1[j]);
          const prod = d1 * digit2 + stepCarry;
          const val = prod % 10;
          stepCarry = Math.floor(prod / 10);
          
          if (stepCarry > 0) {
             const valIndexInStr = fullStr.length - 1 - powerOfTen - (str1.length - 1 - j);
             const col = taskEndCol - (fullStr.length - 1 - valIndexInStr);
             newCarry[getCellKey(currentRow, col)] = stepCarry.toString();
          }
      }

      for (let k = 0; k < fullStr.length; k++) {
        const col = taskEndCol - (fullStr.length - 1 - k);
        newSolution[getCellKey(currentRow, col)] = fullStr[k];
      }
      currentRow++;
    }

    // Summation & Final Result (Only if more than 1 partial product)
    if (str2.length > 1) {
        const lastPartialRow = currentRow - 1;
        const resultStartCol = taskEndCol - strRes.length + 1;
        
        // Underline the last partial row
        for (let c = resultStartCol; c <= taskEndCol; c++) {
            const key = getCellKey(lastPartialRow, c);
            if (!newGrid[key]) newGrid[key] = { value: '', underlined: true };
            else newGrid[key].underlined = true;
        }

        // Final Result Summation
        let sumCarry = 0;
        for (let i = 0; i < strRes.length; i++) {
            let colSum = sumCarry;
            const power = i;
            partials.forEach(p => {
                const digit = Math.floor(p / Math.pow(10, power)) % 10;
                colSum += digit;
            });
            
            const resDigit = colSum % 10;
            sumCarry = Math.floor(colSum / 10);
            const col = taskEndCol - i;
            newSolution[getCellKey(currentRow, col)] = resDigit.toString();
            
            if (sumCarry > 0) {
                newCarry[getCellKey(currentRow, col)] = sumCarry.toString(); // Fixed carry position to current col
            }
        }
        taskHeight = 1 + str2.length + 1 + 1;
    } else {
        // 1-digit multiplier: partial row is the result row
        // Underline it
        const lastPartialRow = currentRow - 1;
        const resultStartCol = taskEndCol - strRes.length + 1;
        for (let c = resultStartCol; c <= taskEndCol; c++) {
            const key = getCellKey(lastPartialRow, c);
            if (!newGrid[key]) newGrid[key] = { value: '', underlined: true };
            else newGrid[key].underlined = true;
        }
        taskHeight = 1 + 1 + 1;
    }

    focusR = startR;
    focusC = resultAfterEqualsStartC;

  } else {
    // --- Division (unchanged but fixed height) ---
    // ... (Keep existing division logic or simplified horizontal if easy)
    // For brevity, I'll implement a robust standard division here.
    
    // Generate numbers
    // (Already done in step 2)
    const result = num1 / num2;
    const str1 = num1.toString();
    const str2 = num2.toString();
    const strRes = result.toString();

    // Row 1: Task
    let currentC = startC;
    for (let char of str1) newGrid[getCellKey(startR, currentC++)] = { value: char, underlined: false };
    newGrid[getCellKey(startR, currentC++)] = { value: ':', underlined: false };
    for (let char of str2) newGrid[getCellKey(startR, currentC++)] = { value: char, underlined: false };
    newGrid[getCellKey(startR, currentC++)] = { value: '=', underlined: false };
    
    // Solution for Quotient
    for (let i = 0; i < strRes.length; i++) {
        newSolution[getCellKey(startR, currentC + i)] = strRes[i];
    }
    
    focusR = startR;
    focusC = currentC;

    if (difficulty === 'easy') {
        taskHeight = 2; // 1 row + buffer
    } else {
        // Long Division Steps
        let currentRow = startR + 1;
        let remainderVal = 0;
        let hasStarted = false;
        
        // We need to track the visual position of the dividend digits
        let dividendIdx = 0;
        
        // Iterate through dividend digits
        for (let i = 0; i < str1.length; i++) {
            const digit = parseInt(str1[i]);
            remainderVal = remainderVal * 10 + digit;
            
            // Determine if we can divide
            if (remainderVal < num2 && !hasStarted && i < str1.length - 1) {
                continue; // Skip leading zeros/steps
            }
            hasStarted = true;
            
            const qDigit = Math.floor(remainderVal / num2);
            const product = qDigit * num2;
            const newRemainder = remainderVal - product;
            
            // 1. Write Product (subtrahend)
            const prodStr = product.toString();
            // Align right with the current dividend digit (startC + i)
            for (let k = 0; k < prodStr.length; k++) {
                const col = startC + i - (prodStr.length - 1) + k;
                newSolution[getCellKey(currentRow, col)] = prodStr[k];
                // Underline the product
                const key = getCellKey(currentRow, col);
                newGrid[key] = { value: '', underlined: true };
            }
            currentRow++;
            
            // 2. Write Remainder + Brought Down Digit (if not last step)
            if (i < str1.length - 1) {
                const nextDigit = str1[i + 1];
                const remStr = newRemainder.toString();
                
                // Write remainder
                for (let k = 0; k < remStr.length; k++) {
                    const col = startC + i - (remStr.length - 1) + k;
                    newSolution[getCellKey(currentRow, col)] = remStr[k];
                }
                
                // Write brought down digit
                const nextCol = startC + i + 1;
                newSolution[getCellKey(currentRow, nextCol)] = nextDigit;
                
                currentRow++;
            }
            
            remainderVal = newRemainder;
        }
        // Write final remainder
        const finalRemStr = remainderVal.toString();
        for (let k = 0; k < finalRemStr.length; k++) {
            const col = startC + str1.length - 1 - (finalRemStr.length - 1) + k;
            newSolution[getCellKey(currentRow, col)] = finalRemStr[k];
        }
        
        taskHeight = (currentRow - startR) + 2; // +2 buffer
    }
  }

  return {
    grid: newGrid,
    solutionMap: newSolution,
    carryMap: newCarry,
    taskHeight: Math.max(taskHeight, 2),
    focusR,
    focusC,
    autoMoveDir
  };
};
