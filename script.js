`use strict`
const mainContainer = document.querySelector('#main-container');
const body = document.querySelector('body');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const resetButton = document.querySelector('#reset-button');
const counter = document.querySelector('#counter');
const optionsButton = document.querySelector('#options-button');

let collisionEvent = new Event('collisionEvent');

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
        this.rotateLeft();
        this.rotateLeft();
        this.rotateLeft();
    }

    rotateLeft() {
        this.shape = this.shape[0].map((_, index) =>
            this.shape.map(row => row[row.length - 1 - index])
        );
    }
}

class Cell {
    constructor(xCord,yCord,color){
        this.x = xCord;
        this.y = yCord;
        this.color = color;
    }
}

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

let keyBinds = {
    'MoveLeft': ['ArrowLeft'],
    'MoveRight': ['ArrowRight'],
    'MoveDown': ['ArrowDown'],
    'DropDown': ['Space'],
    'RotateRight': ['KeyE'],
    'RotateLeft': ['KeyQ'],
}

let defaultKeyBinds = {};

Object.entries(keyBinds).forEach(([key, value]) => {
    defaultKeyBinds[key] = value;
})

//----------

drawGameField();
let randomFigure = getRandomTetromino();
let nextFigure = getRandomTetromino();
drawBorder();
let pointsCounter = 0;
let gameInterval;
window.addEventListener('collisionEvent', (event) => {
    pauseGame();
    startButton.removeEventListener('click', startButtonEvent);
    startButton.addEventListener('click', startButtonResetEvent);
    //let audio = new Audio(`offensiveEndGameAudio/${getRandomInt(4)}.mp3`);
    //audio.play();
})

//----------

startButton.addEventListener('click', startButtonEvent);

function startButtonEvent (){
    pauseGame();
    startGame();
    startButton.blur();
}
function startButtonResetEvent(){
    startButton.addEventListener('click', startButtonEvent);
    startButton.removeEventListener('click', startButtonResetEvent);

    resetGame();
    startGame();
}

pauseButton.onclick = () => {
    pauseGame();
    pauseButton.blur();
};
resetButton.onclick = ()=>{
    pauseGame();
    resetGame();
    resetButton.blur();
};

optionsButton.addEventListener('click', optionsClickEventListener);

const optionsIconSources = ['gear-icon.svg', 'pen-icon.svg', 'spanner-and-screwdriver-icon.svg']
let optionsIterator = 0;
window.addEventListener('keydown', (e)=>{
    if(e.code === 'Digit1'){
        if(optionsIterator === optionsIconSources.length-1){
            optionsIterator = 0;
            optionsButton.firstElementChild.src = 'icons/' + optionsIconSources[optionsIterator];
        } else {
            optionsIterator++;
            optionsButton.firstElementChild.src = 'icons/' + optionsIconSources[optionsIterator];
        }
    }
})

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
    unsetTouchListener();
    document.removeEventListener('click', clickEventListener)
}

function startGame(){
    drawFigure(randomFigure);
    gameInterval = setInterval(()=>{
        [res, side] = collisionCheck(randomFigure);
        if(res){
            window.dispatchEvent(new Event('collisionEvent'));
        }
        clearField();
        [res, side] = moveFigureDown(randomFigure);
        if(res){
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
        drawBorder();
    }, 500);

    document.addEventListener('keydown', keysListener);
    document.addEventListener('click', clickEventListener);
    setTouchListener();
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
 //TODO: add WASD, rotation (Q/W), down jump
function keysListener(e){
    let res, side;
    if (keyBinds.MoveDown.includes(e.code)) {
        clearField();
        [res, side] = moveFigureDown(randomFigure);
        if (res) {
            convertFigureToCells(randomFigure);
            randomFigure = nextFigure;
            nextFigure = getRandomTetromino();
            let winPoints = getWinPoints(deleteFullRows());
            if (winPoints) {
                pointsCounter += winPoints;
                counter.innerText = pointsCounter;
            }
            clearField();
        }
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
    } else if (false) {
        //functionality for moving up
        clearField();
        [res, side] = moveFigureUp(randomFigure);
        if (res) {
        }
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
    } else if (keyBinds.MoveLeft.includes(e.code)) {
        clearField();
        [res, side] = moveFigureLeft(randomFigure);
        if (res) {
        }
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
    } else if (keyBinds.MoveRight.includes(e.code)) {
        clearField();
        [res, side] = moveFigureRight(randomFigure);
        if (res) {
        }
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
    } else if (keyBinds.RotateRight.includes(e.code)) {
        randomFigure.rotate();
        [res, side] = collisionCheck(randomFigure);
        if (res) {
            randomFigure.rotate();
            randomFigure.rotate();
            randomFigure.rotate();
        }
        clearField();
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
    } else if (keyBinds.RotateLeft.includes(e.code)) {
            randomFigure.rotateLeft();
            [res, side] = collisionCheck(randomFigure);
            if (res) {
                randomFigure.rotateLeft();
                randomFigure.rotateLeft();
                randomFigure.rotateLeft();
            }
            clearField();
            drawGameField();
            drawFigure(randomFigure);
            drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
    } else if (keyBinds.DropDown.includes(e.code)) {
        clearField();
        for (let i = 0; i < gameFieldHeight; i++) {
            [res, side] = moveFigureDown(randomFigure);
            if (res) {
                break;
            }
        }
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
    }
}

let startX, startY, endX, endY;
function setTouchListener(){
    canvas.addEventListener("touchstart", (event) => touchStartListener(event));
    canvas.addEventListener("touchmove", (event) => touchMoveListener(event));
}

function unsetTouchListener(){
    canvas.removeEventListener("touchstart", (event) => touchStartListener(event));
    canvas.removeEventListener("touchmove", (event) => touchMoveListener(event));
}

function touchStartListener(event){
    startX = startY = endX = endY = undefined;
    const touch = event.touches[0]; // Берем первое касание
    startX = touch.clientX;
    startY = touch.clientY;
}

function touchMoveListener(event){
    const touch = event.touches[0]; // Берем первое касание

    endX = touch.clientX;
    endY = touch.clientY;



    if (endX !== undefined && endY !== undefined) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        if(Math.abs(deltaX) < cellSize && Math.abs(deltaY) < cellSize) {
            return;
        }

        let direction = "";
        let res, side;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if(deltaX > 0){
                randomFigure.x += 1;
                [res,side] = collisionCheck(randomFigure);
                if(res){
                    randomFigure.x += -1;
                }
            } else {
                randomFigure.x--;
                [res,side] = collisionCheck(randomFigure);
                if(res){
                    randomFigure.x++;
                }
            }
        } else {
            if(deltaY > 0){
                randomFigure.y++;
                [res,side] = collisionCheck(randomFigure);
                if(res){
                    randomFigure.y--;
                }
            }
        }
        clearField();
        drawGameField();
        drawFigure(randomFigure);
        drawFigureOutline(randomFigure, getOutlineOffset(randomFigure));
        //console.log(`Direction: ${direction}, End position: (${endX}, ${endY})`,deltaX);
        startX = touch.clientX;
        startY = touch.clientY;
    }
}

function clickEventListener(){
    let KeyEvent = new KeyboardEvent('keydown', {
        code: keyBinds.RotateRight[0],
        bubbles: true
    })
    canvas.dispatchEvent(KeyEvent);
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
                  } else if (k+1 === cellMatrix.length){
                      minDistanceToObstacle = Math.min(minDistanceToObstacle, k-i-figure.y+1)
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

function optionsClickEventListener(event){
    pauseGame();

    let coverDiv = document.createElement('div');
    coverDiv.classList.add('cover');

    let optionsMenu = createElementFromHTML(`\n` +
        `<div id="options-popup">\n` +
        `    <h1>Options</h1>\n` +
        `    <h2>Change controls</h2>\n` +
        `    <ul>\n` +
        `        <li><div>MoveLeft</div><div>${keyBinds.MoveLeft}</div></li>\n` +
        `        <li><div>MoveRight</div><div>${keyBinds.MoveRight}</div></li>\n` +
        `        <li><div>MoveDown</div><div>${keyBinds.MoveDown}</div></li>\n` +
        `        <li><div>DropDown</div><div>${keyBinds.DropDown}</div></li>\n` +
        `        <li><div>RotateRight</div><div>${keyBinds.RotateRight}</div></li>\n` +
        `        <li><div>RotateLeft</div><div>${keyBinds.RotateLeft}</div></li>\n` +
        `    </ul>\n` +
        `    <button id="reset-binds-button">Set controls to default</button>\n` +
        `    <h2>Multiplayer</h2>\n` +
        `    <ul>\n` +
        `    </ul>\n` +
        `</div>`);

    let closeButton = createElementFromHTML(`<div id="options-popup-close-button"><img src="icons/close-tab-icon.svg" alt="close"></div>`)
    coverDiv.append(optionsMenu);
    optionsMenu.append(closeButton);

    for (let elem of coverDiv.querySelector('ul').children){
        let button = createElementFromHTML('<div class="change-bind-button"><img src="icons/pen-icon.svg" alt="change"></div>>')
        button.onclick = changeBindButtonListener;
        elem.lastElementChild.append(button);
    }

    let resetBindsButton = optionsMenu.querySelector('#reset-binds-button');
    resetBindsButton.onclick = () =>{
        keyBinds = JSON.parse(JSON.stringify(defaultKeyBinds));
        reopenOptions(coverDiv);
    }

    closeButton.onclick = ()=>{
        coverDiv.remove();
        startGame();
    }

    coverDiv.addEventListener('click', function(e){
        e.stopPropagation();
        if(e.target === coverDiv){
            coverDiv.remove();
            startGame();
        }
    });

    document.addEventListener('keydown', closeOptionsListener)
    function closeOptionsListener(e){
        if(e.code === 'Escape'){
            coverDiv.remove();
            pauseGame();
            startGame();
        }
        document.removeEventListener('keydown', closeOptionsListener);
    }

    document.documentElement.append(coverDiv);
}

function changeBindButtonListener(){
    let parentText = this.parentElement.firstChild;
    let text = parentText.textContent;
    parentText.textContent = '';
    window.addEventListener('keydown', keyChangeListener)
    function keyChangeListener(e){
        key = parentText.parentElement.previousElementSibling.textContent;
        console.log(key);
        keyBinds[key][0] = e.code;
        parentText.textContent = e.code;
        window.removeEventListener('keydown', keyChangeListener);
    }

}

function createElementFromHTML(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    return div.firstChild;
}

function reopenOptions(coverDiv){
    coverDiv.dispatchEvent(new MouseEvent('click'));
    optionsButton.dispatchEvent(new MouseEvent('click'));
}
