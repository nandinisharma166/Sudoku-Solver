// ---------- Sudoku Solver Front-End Script ----------
// All comments in English only.

// 1. Bind DOM cells to a 9×9 array.
const arr = Array.from({ length: 9 }, () => Array(9));
for (let i = 0; i < 9; i++) {
  for (let j = 0; j < 9; j++) {
    arr[i][j] = document.getElementById(i * 9 + j);
  }
}

// 2. Board state and selected cell.
let board = Array.from({ length: 9 }, () => Array(9).fill(0));
let selectedCell = null;

// 3. Render the board array to the grid.
function fillBoard(b) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cell = arr[i][j];
      const v = b[i][j];
      if (v !== 0) {
        cell.innerText = v;
        cell.classList.add("fixed");
      } else {
        cell.innerText = "";
        cell.classList.remove("fixed");
      }
      cell.classList.remove("error"); // clear any old error marks
    }
  }
}

// 4. Cell click handler.
function handleSelect(e) {
  if (selectedCell) selectedCell.classList.remove("selected");
  selectedCell = e.target;
  selectedCell.classList.add("selected");
}

// Attach click listeners to all cells.
arr.flat().forEach(cell => cell.addEventListener("click", handleSelect));

// 5. Keyboard input for non-fixed cells.
document.addEventListener("keydown", e => {
  if (!selectedCell || selectedCell.classList.contains("fixed")) return;
  const key = e.key;
  if (key >= "1" && key <= "9") {
    updateBoardCell(parseInt(key, 10));
  } else if (["0", "Backspace", "Delete"].includes(key)) {
    updateBoardCell(0);
  }
});

function updateBoardCell(num) {
  const id = parseInt(selectedCell.id, 10);
  const r = Math.floor(id / 9);
  const c = id % 9;
  board[r][c] = num;
  selectedCell.innerText = num === 0 ? "" : num;
}

// 6. Validation helpers.
function clearErrors() {
  document.querySelectorAll(".error").forEach(cell => cell.classList.remove("error"));
}

function isValidBoard(b) {
  clearErrors();
  let ok = true;
  const mark = pos => { pos.forEach(([r, c]) => arr[r][c].classList.add("error")); ok = false; };

  // rows & columns
  for (let i = 0; i < 9; i++) {
    const rowSeen = {}, colSeen = {};
    for (let j = 0; j < 9; j++) {
      const rv = b[i][j];
      const cv = b[j][i];
      if (rv) {
        if (rowSeen[rv]) mark([[i, j], rowSeen[rv]]);
        else rowSeen[rv] = [i, j];
      }
      if (cv) {
        if (colSeen[cv]) mark([[j, i], colSeen[cv]]);
        else colSeen[cv] = [j, i];
      }
    }
  }

  // 3×3 boxes
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const seen = {};
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const v = b[br + r][bc + c];
          if (!v) continue;
          if (seen[v]) mark([[br + r, bc + c], seen[v]]);
          else seen[v] = [br + r, bc + c];
        }
      }
    }
  }
  return ok;
}

// 7. Back-tracking solver.
function isSafe(b, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (b[row][x] === num || b[x][col] === num) return false;
  }
  const sr = row - row % 3, sc = col - col % 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (b[sr + i][sc + j] === num) return false;
    }
  }
  return true;
}

function solveSudoku(b, row = 0, col = 0) {
  if (row === 9) return true;
  if (col === 9) return solveSudoku(b, row + 1, 0);
  if (b[row][col] !== 0) return solveSudoku(b, row, col + 1);

  for (let num = 1; num <= 9; num++) {
    if (isSafe(b, row, col, num)) {
      b[row][col] = num;
      if (solveSudoku(b, row, col + 1)) return true;
      b[row][col] = 0;
    }
  }
  return false;
}

// 8. Buttons.
const getPuzzleBtn  = document.getElementById("GetPuzzle");
const solvePuzzleBtn = document.getElementById("SolvePuzzle");

// Fetch a new puzzle.
getPuzzleBtn.onclick = () => {
  const xhr = new XMLHttpRequest();
  xhr.onload = () => {
    const resp = JSON.parse(xhr.response);
    board = resp.board;
    fillBoard(board);
  };
  xhr.open("GET", "https://sugoku.onrender.com/board?difficulty=easy");
  xhr.send();
};

// Solve the current board.
solvePuzzleBtn.onclick = () => {
  if (!isValidBoard(board)) {
    alert("Current entries contain conflicts.\nConflicting cells are highlighted in red.");
    return;
  }
  const copy = board.map(row => [...row]); // deep copy for safe rollback
  if (solveSudoku(copy)) {
    board = copy;
    fillBoard(board);
  } else {
    alert("No solution exists for the current board.");
  }
};
