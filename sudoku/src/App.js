import React, { useState, useEffect } from "react";
import { Container, Modal, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, ModalHeader, ModalBody, Button } from "reactstrap";
import seedrandom from "seedrandom";
import 'bootstrap/dist/css/bootstrap.min.css';
// Sudoku generation logic (same as before)
const generateEmptyGrid = () => Array(9).fill(0).map(() => Array(9).fill(0));

const shuffleArray = (array, rng) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const isValidMove = (grid, row, col, num) => {
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num || grid[x][col] === num) return false;
        const startRow = 3 * Math.floor(row / 3);
        const startCol = 3 * Math.floor(col / 3);
        if (grid[startRow + Math.floor(x / 3)][startCol + (x % 3)] === num) return false;
    }
    return true;
};

const solveSudoku = (grid) => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValidMove(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (solveSudoku(grid)) return true;
                        grid[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

const generateSudokuGrid = (rng) => {
    const grid = generateEmptyGrid();
    const numbers = Array.from({ length: 9 }, (_, i) => i + 1);

    for (let i = 0; i < 9; i += 3) {
        shuffleArray(numbers, rng);
        for (let j = 0; j < 9; j++) {
            grid[i + Math.floor(j / 3)][i + (j % 3)] = numbers[j];
        }
    }

    solveSudoku(grid);
    return grid;
};

const removeNumbers = (grid, difficulty, rng) => {
    const puzzle = grid.map((row) => [...row]);
    let cellsToRemove = Math.floor(difficulty * 5); // Adjust as needed for difficulty

    while (cellsToRemove > 0) {
        const row = Math.floor(rng() * 9);
        const col = Math.floor(rng() * 9);
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            cellsToRemove--;
        }
    }

    return puzzle;
};

const generateSudoku = (seed, difficulty) => {
    const rng = seedrandom(seed);
    const solution = generateSudokuGrid(rng);
    const puzzle = removeNumbers(solution, difficulty, rng);
    return { puzzle, solution };
};

// React component
const SudokuGenerator = () => {
    //the current date (day, month, year) is used as the seed, to allow for the same puzzle to be generated on the same day
    const seed = new Date().toLocaleDateString();
    const difficulty = 7
    const [puzzle, setPuzzle] = useState([]);
    const [emptySquare, setEmptySquare] = useState([]);
    const [solution, setSolution] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(Array(9).fill().map(() => Array(9).fill(false)));
    const [isSolved, setIsSolved] = useState(false);
    const [adminModalOpen, setAdminModalOpen] = useState(false);
    const adminPassword = "trees"
    const [isAdmin, setIsAdmin] = useState(false);
    const [password, setPassword] = useState("");

    useEffect(() => {
        const { puzzle, solution } = generateSudoku(seed, difficulty);
        //create an array that shows where the empty squares are. If a square has a number in it, it is set to 1, if it is empty, it is set to 0
        setEmptySquare(puzzle.map((row) => row.map((num) => num === 0 ? 0 : 1)));
        setPuzzle(puzzle);
        setSolution(solution);
    }, [seed, difficulty]);



    //check if the puzzle is solved
    useEffect(() => {
        if (puzzle.length === 0 || isSolved) return;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (puzzle[row][col] !== solution[row][col]) return;
            }
        }
        alert("Puzzle solved!");
        setIsSolved(true);
    }, [puzzle, solution, isSolved]);

    //set up a listener for control shift f to open the admin model and solve the puzzle
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F' && e.ctrlKey && e.shiftKey) {
                setAdminModalOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [solution]);

    const toggleDropdown = (row, col) => {
        const newDropdownState = [...dropdownOpen];
        newDropdownState[row][col] = !newDropdownState[row][col];
        setDropdownOpen(newDropdownState);
    };

    const handleNumberSelect = (row, col, num) => {
        const newPuzzle = [...puzzle];
        newPuzzle[row][col] = num;
        setPuzzle(newPuzzle);
    };

    const adimnShowPuzzle = () => {
        setIsSolved(true);
        setPuzzle(solution);
    }

    const checkAdminPassword = (password) => {
        if (password === adminPassword) {
            setIsAdmin(true);

        }
        else {
            setAdminModalOpen(false);
            setIsAdmin(false);
            setPassword("");
        }
    }


    return (
        <div>
            <Modal isOpen={adminModalOpen} toggle={() => setAdminModalOpen(false)}>
                <ModalHeader>Admin Panel</ModalHeader>
                <ModalBody>
                    <p>Admins can solve the puzzle here</p>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button onClick={() => checkAdminPassword(password)}>Submit</Button>
                    {isAdmin && <Button onClick={adimnShowPuzzle}>Show Puzzle</Button>}
                </ModalBody>
            </Modal>
            <Container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '0 10vw', flexDirection: window.innerWidth < window.innerHeight ? 'column' : 'row' }}>
                <div className="sudoku-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 10vw)', gridGap: '0' }}>
                    {puzzle.map((row, rowIndex) => (
                        row.map((num, colIndex) => (
                            <Dropdown
                                isOpen={dropdownOpen[rowIndex][colIndex]}
                                toggle={() => toggleDropdown(rowIndex, colIndex)}
                                key={`${rowIndex}-${colIndex}`}
                                className="sudoku-cell"
                                style={{
                                    width: 'calc(90vw / 9)',
                                    height: 'calc(90vh / 9)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border: '1px solid #888',
                                    borderTop: rowIndex === 0 ? '3px solid black' : '',
                                    borderBottom: rowIndex === 8 ? '3px solid black' : rowIndex % 3 === 2 ? '3px solid black' : '1px solid #888',
                                    borderLeft: colIndex === 0 ? '3px solid black' : '',
                                    borderRight: colIndex === 8 ? '3px solid black' : colIndex % 3 === 2 ? '3px solid black' : '1px solid #888',
                                    flexWrap: 'wrap',
                                    position: 'relative'
                                }}
                            >
                                <span style={{ fontSize: '3vmin', fontWeight: 'bold', fontFamily: 'monospace', display: 'block', width: '100%', textAlign: 'center', lineHeight: 'calc(90vh / 9)' }}>
                                    {num || ''}
                                </span>

                                <DropdownToggle caret color="light" style={{ width: '100%', height: '30%', padding: 0, border: 'none', background: 'none', fontSize: '3vmin', fontWeight: 'bold', fontFamily: 'monospace', position: 'absolute', bottom: 0, left: 0, visibility: emptySquare[rowIndex][colIndex] === 0 ? 'visible' : 'hidden', textAlign: 'center' }}>
                                </DropdownToggle>

                                <DropdownMenu style={{ visibility: dropdownOpen[rowIndex][colIndex] ? 'visible' : 'hidden' }}>
                                    <DropdownItem onClick={() => handleNumberSelect(rowIndex, colIndex, 0)} style={{ fontFamily: 'monospace', fontSize: '2vmin', fontWeight: 'bold' }}>
                                        (Empty)
                                    </DropdownItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                        <DropdownItem key={n} onClick={() => handleNumberSelect(rowIndex, colIndex, n)} style={{ fontFamily: 'monospace', fontSize: '2vmin', fontWeight: 'bold' }}>
                                            {n}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        ))
                    ))}
                </div>
            </Container>

        </div>
    );
};

export default SudokuGenerator;
