`use strict`
const mainContainer = document.querySelector('#main-container');
const body = document.querySelector('body');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const resetButton = document.querySelector('#reset-button');
const counter = document.querySelector('#counter');



const canvas = document.querySelector('#gameField');
let context = canvas.getContext('2d');

let gameFieldWidth = 10;
let gameFieldHeight = 20;
let cellMatrix = createMatrix(gameFieldWidth, gameFieldHeight);

let cellSize = ~~(window.innerHeight / 28);
canvas.width = cellSize*(gameFieldWidth+2);
canvas.height = cellSize*(gameFieldHeight+2);

//body size adjustment
body.style.width = window.innerWidth + 'px';
body.style.height = window.innerHeight + 'px';
window.onresize = () => {
    body.style.width = window.innerWidth + 'px';
    body.style.height = window.innerHeight + 'px';
}

counter.style.left = cellSize +'px';
counter.style.top = cellSize +'px';


//----------

class Tetromino {
    constructor(shape, color) {
        this.shape = shape;  // 2D array representing the tetromino
        this.color = color;  // Color of the tetromino
        this.x = gameFieldWidth/2-2; // Starting X position (middle of the board)
        this.y = 0  ; // Starting Y position (top of the board)
    }

    rotate() {
        // Transpose matrix and reverse rows to rotate clockwise
        this.shape = this.shape[0].map((_, index) =>
            this.shape.map(row => row[index])
        ).reverse();
    }
}

class Cell {
    constructor(xCord,yCord,color){
        this.x = xCord;
        this.y = yCord;
        this.color = color;
    }
}

// Define all 7 Tetromino shapes (4x4 grids)
const TETROMINOES = {
    I: new Tetromino([
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ], ['#00FFFF', '#00CCCC', '#009999']),

    J: new Tetromino([
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ], ['#0000FF', '#0000CC', '#000099']),

    L: new Tetromino([
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ], ['#FF8800','#CC6600','#994400']),

    O: new Tetromino([
        [1, 1],
        [1, 1]
    ], ['#FFFF00', '#CCCC00', '#999900']),

    S: new Tetromino([
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ], ['#00FF00', '#00CC00', '#009900']),

    T: new Tetromino([
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ], ['#CC00FF', '#9900CC', '#770099']),

    Z: new Tetromino([
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ], ['#FF0000', '#CC0000', '#990000'])
};

//----------

drawGameField();
let randomFigure = getRandomTetromino();
let nextFigure = getRandomTetromino();
drawBorder();
let pointsCounter = 0;
let gameInterval;

//----------

startButton.onclick = ()=>{
    pauseGame();
    startGame();
}
pauseButton.onclick = pauseGame;
resetButton.onclick = ()=>{
    pauseGame();
    resetGame()
};

//----------

function resetGame(){
    cellMatrix = createMatrix(gameFieldWidth, gameFieldHeight)
    drawBorder();
    clearField();
    randomFigure = getRandomTetromino();
    pointsCounter = 0;
    counter.innerText = 0;
}

function pauseGame() {
    clearInterval(gameInterval);
    document.removeEventListener('keydown', keysListener);
}

function startGame(){
    drawFigure(randomFigure);
    gameInterval = setInterval(()=>{
        clearField();
        [res, side] = moveFigureDown(randomFigure);
        if(res){
            console.log('collided');
            convertFigureToCells(randomFigure);
            randomFigure = getRandomTetromino();
            let winPoints  = getWinPoints(deleteFullRows());
            if(winPoints){
                pointsCounter += winPoints;
                counter.innerText = pointsCounter;
            }
            clearField();
        }
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));

    }, 500);

    document.addEventListener('keydown', keysListener);
}

function getWinPoints(columns){
    switch(columns){
        case 1:
            return 100;
        case 2:
            return 300;
        case 3:
            return 700;
        case 4:
            return 1500;
    }
}

function keysListener(e){
    let res, side;
    switch (e.code) {
        case 'ArrowDown':
            clearField();
            [res, side] = moveFigureDown(randomFigure);
            if(res){
                convertFigureToCells(randomFigure);
                randomFigure = nextFigure;
                nextFigure = getRandomTetromino();
                let winPoints  = getWinPoints(deleteFullRows());
                if(winPoints){
                    pointsCounter += winPoints;
                    counter.innerText = pointsCounter;
                }
                clearField();
            }
            drawGameField();
            drawFigure(randomFigure);
            drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
            break;
        case 'ForKeyUp':
            clearField();
            [res, side] = moveFigureUp(randomFigure);
            if(res){
                console.log('collided');
            }
            drawGameField();
            drawFigure(randomFigure);
            drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
            break;
        case 'ArrowLeft':
            clearField();
            [res, side] = moveFigureLeft(randomFigure);
            if(res){
                console.log('collided');
            }
            drawGameField();
            drawFigure(randomFigure);
            drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
            break;
        case 'ArrowRight':
            clearField();
            [res, side] = moveFigureRight(randomFigure);
            if(res){
                console.log('collided');
            }
            drawGameField();
            drawFigure(randomFigure);
            drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
            break;
        case 'KeyR':
            randomFigure.rotate();
            clearField();
            drawGameField();
            drawFigure(randomFigure);
            drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
            break;
        case 'Space':
            clearField();
            for(let i = 0; i < gameFieldHeight; i++) {
                [res, side] = moveFigureDown(randomFigure);
                if(res){
                    break;
                }
            }
            drawGameField();
            drawFigure(randomFigure);
            drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
            break;
    }
}

function drawGrid(cellSize){

    for (let x = 0; x <= canvas.width; x += cellSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.strokeStyle = 'red';
        context.stroke();

    }

    for (let y = 0; y <= canvas.height; y += cellSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.strokeStyle = 'red';
        context.stroke();
    }
}

function drawCell(xCord, yCord, color){
    let upper = '#999999';
    let mid = '#777777';
    let lower = '#333333';

    if(color){
        upper = color[0];
        mid = color[1];
        lower = color[2];
    }

    //upperTriangle
    context.beginPath();
    context.moveTo(xCord*cellSize, yCord*cellSize);
    context.lineTo(xCord*cellSize+cellSize, yCord*cellSize);
    context.lineTo(xCord*cellSize, yCord*cellSize+cellSize);
    context.fillStyle = upper;
    context.fill();
    context.closePath();

    //lowerTriangle
    context.beginPath();
    context.moveTo(xCord*cellSize+cellSize, yCord*cellSize);
    context.lineTo(xCord*cellSize+cellSize, yCord*cellSize+cellSize);
    context.lineTo(xCord*cellSize, yCord*cellSize+cellSize);
    context.fillStyle = lower;
    context.fill();
    context.closePath();

    //midRectangle
    let borderOffset = ~~(cellSize/10);
    context.beginPath();
    context.rect(xCord*cellSize+borderOffset, yCord*cellSize+borderOffset
        , cellSize-borderOffset*2, cellSize-borderOffset*2);
    context.fillStyle = mid;
    context.fill();
    context.closePath();
}

function drawCellOutline(xCord, yCord, color = '#777777'){

    let offset = context.lineWidth / 2; // Shrink by half the line width

    context.rect(
        xCord * cellSize + offset,
        yCord * cellSize + offset,
        cellSize - context.lineWidth,
        cellSize - context.lineWidth
    );

    context.strokeStyle = color;
    context.lineWidth = ~~(cellSize / 15);
    context.stroke();
    context.closePath();
}

function drawBorder(){
    //draw upper and lower border
    for(let i = 0; i < gameFieldWidth+2; i++){
        drawCell(i, 0);
        drawCell(i, gameFieldHeight+1);
    }

    //draw left and right border
    for(let i = 1; i < gameFieldHeight+1; i++){
        drawCell(0, i);
        drawCell(gameFieldWidth+1, i);
    }
}

function drawFigure(figure){
    let shape = figure.shape;
    let xCord = figure.x;
    let yCord = figure.y
    let color = figure.color;
    for(let i = 0; i<shape.length; i++){
        for(let j = 0; j<shape[i].length; j++){
            if(shape[i][j] === 1){
                drawCell(xCord+j+1, yCord+i+1, color);
            }
        }
    }
}

function drawFigureOutline(figure, offsetY){
    let shape = figure.shape;
    let xCord = figure.x;
    let yCord = figure.y+offsetY;
    let color = figure.color[1];
    for(let i = 0; i<shape.length; i++){
        for(let j = 0; j<shape[i].length; j++){
            if(shape[i][j] === 1){
                drawCellOutline(xCord+j+1, yCord+i+1, color);
            }
        }
    }
}

function clearField(){
    context.clearRect(cellSize, cellSize, canvas.width-cellSize*2, canvas.height-cellSize*2);
}

function getRandomTetromino(){
    return deepClone(TETROMINOES['ILJOSZT'[getRandomInt(7)]]);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function createMatrix(width, height) {
    return Array.from({ length: height }, () => Array(width).fill(0));
}

function drawGameField(){
    for(let i = 0; i < gameFieldHeight; i++){
        for(let j = 0; j<gameFieldWidth; j++){
            if(cellMatrix[i][j]){
                let cell = cellMatrix[i][j];
                drawCell(cell.x+1,cell.y+1, cell.color);
            }
        }
    }
}

function convertFigureToCells(figure){
    for(let i = 0; i < figure.shape.length; i++) {
        for (let j = 0; j < figure.shape[i].length; j++) {
            if (figure.shape[i][j] && cellMatrix[i+figure.y][j+figure.x]) {
                return -1;
            } else if(figure.shape[i][j]) {
                cellMatrix[i+figure.y][j+figure.x] = new Cell(figure.x + j, figure.y + i, figure.color);
            }
        }
    }
}

function moveFigureDown(figure){
    figure.y++;
    let [res, side] =collisionCheck(figure);
    if(res){
        figure.y--;
    }
    return [res, side];
}
function moveFigureUp(figure){
    figure.y--;
    let [res, side] =collisionCheck(figure);
    if(res){
        figure.y++;
    }
    return [res, side];

}
function moveFigureLeft(figure){
    figure.x--;
    let [res, side] =collisionCheck(figure);
    if(res){
        figure.x++;
    }
    return [res,side];
}
function moveFigureRight(figure){
    figure.x++;
    let [res, side] =collisionCheck(figure);
    if(res){
        figure.x--;
    }
    return [res,side];
}

function collisionCheck(figure){
    for(let i =0; i<figure.shape.length;i++){
        for(let j =0;j<figure.shape[i].length;j++){
            if(figure.shape[i][j]){
                if(i+figure.y> cellMatrix.length-1 ){
                    return [true, 'bottom'];
                }
                if(i+figure.y < 0 ){
                    return [true, 'top'];
                }
                if(j+figure.x > cellMatrix[0].length-1){
                    return [true, 'right'];
                }
                if(j+figure.x < 0 ){
                    return [true, 'left'];
                }
                if(cellMatrix[i+figure.y][j+figure.x] !== 0){
                    return [true, 'cell'];
                }
            }
        }
    }
    return [false, undefined];
}

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;

    let clone = Object.create(Object.getPrototypeOf(obj));

    for (let key of Reflect.ownKeys(obj)) {
        clone[key] = deepClone(obj[key]); // Recursively clone properties
    }

    return clone;
}

function deleteFullRows(){
    let rowsDeleted = 0;
    for(let k = cellMatrix.length-1; k > 0; k--){
        if(!cellMatrix[k].includes(0)){
            for(let i = k; i > 0; i--){
                for(let j = 0; j < cellMatrix[i].length; j++){
                    let temp = cellMatrix[i-1][j];
                    temp.y++;
                    cellMatrix[i][j] = temp;
                }
            }
            rowsDeleted++;
            k++;
        }
    }
    return rowsDeleted;
}

function getOutlineOffset(figure){
    let minDistanceToObstacle = Number.MAX_SAFE_INTEGER;
    let shapeOffset = 0;
    for(let i = 0; i < figure.shape.length; i++){
        for(let j = 0; j < figure.shape[i].length; j++){
            for (let k = i+figure.y; k < cellMatrix.length; k++) {
                if (figure.shape[i][j]){
                  if(cellMatrix[k][j+figure.x] !== 0){
                      minDistanceToObstacle = Math.min(minDistanceToObstacle, k-i-figure.y);
                  }
                  shapeOffset = i;
                }
            }
        }
    }
    if(minDistanceToObstacle === Number.MAX_SAFE_INTEGER){
        return cellMatrix.length-figure.y-1-shapeOffset;
    }
    return minDistanceToObstacle-1;
}
