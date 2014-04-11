//************* Constants ***************************************
GameConstants = (function() {
    return {
        DIRECTION_LEFT:  37,
        DIRECTION_UP:    38,
        DIRECTION_RIGHT: 39,
        DIRECTION_DOWN:  40,
        TILE_PADDING:    10,
        TILE_SIZE:      100
    };
})();

//************* ImageFactory ************************************
ImageFactory = (function() {
    return {
        cache: [],
        build: function(imgSrc) {
            var imageObj;
            if (ImageFactory.cache[imgSrc] === undefined) {
                imageObj = new Image();
                imageObj.src = imgSrc;
                ImageFactory.cache[imgSrc] = imageObj;
            } else {
                imageObj = ImageFactory.cache[imgSrc];
            }

            return imageObj;
        }
    };
})();
//************* GameBoard ***************************************
function GameBoard() {
    this.matrix = undefined;
    this.running = true;
    this.nrows = 4;
}

GameBoard.prototype.isSlotEmpty = function(row, column) {
    var result = this.matrix[this.toAbsolutePosition(row, column)].tileValue === 0;
    return result;
};

GameBoard.prototype.isSlotEquals = function(row1, column1, row2, column2) {
    var tile1 = this.matrix[this.toAbsolutePosition(row1, column1)];
    var tile2 = this.matrix[this.toAbsolutePosition(row2, column2)];

    return tile1.tileValue !== 0 && tile2.tileValue !== 0 && tile1.tileValue === tile2.tileValue;
};

GameBoard.prototype.isBoardFull = function() {
    var flag = true;
    this.matrix.forEach(function(elem) {
        if (elem.tileValue === 0)
            flag = false;
    });

    return flag;
};

GameBoard.prototype.randomSlotEmpty = function(lastTried) {
    if (this.isBoardFull())
        return undefined;

    var position = lastTried || Math.floor((Math.random() * this.nrows * this.nrows));
    if (this.matrix[position].tileValue !== 0) {
        return this.randomSlotEmpty(lastTried + 1);
    }

    return position;
};

GameBoard.prototype.setTile = function(position, tile, animationFinishEvt) {
    if (tile === undefined)
        return;

    var row = Math.floor(position / this.nrows);
    var column = position % this.nrows;

    var y = row * tile.width + (row * GameConstants.TILE_PADDING);
    var x = column * tile.height + (column * GameConstants.TILE_PADDING);

    if (animationFinishEvt !== false) {
        tile.moveAnimatedToX(x, animationFinishEvt);
        tile.y = y;
    } else {
        tile.x = x;
        tile.y = y;
    }
    this.matrix[position] = tile;
};

GameBoard.prototype.init = function() {
    this.matrix = [];
    for (var i = 0; i < (this.nrows * this.nrows); i++) {
        this.setTile(i, new TileSprite(0), false);
    }

    this.insertNewTile();
    this.insertNewTile();
};

GameBoard.prototype.insertNewTile = function() {
    var position = this.randomSlotEmpty();

    // this.setTile(position, new TileSprite(2));
    this.setTile(position, new TileSprite(Math.random() < 0.9 ? 2 : this.nrows), false);
};

GameBoard.prototype.start = function() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");

    this.init();
    this.paint(context);

    var thisObj = this;
    var keydownEvent = function(evt) {
        if (evt.keyCode === GameConstants.DIRECTION_LEFT || evt.keyCode === GameConstants.DIRECTION_RIGHT) {
            thisObj.moveTiles(evt.keyCode);
        } else {
            if (evt.keyCode === GameConstants.DIRECTION_UP) {
                thisObj.moveTilesUp();
            } else if (evt.keyCode === GameConstants.DIRECTION_DOWN) {
                thisObj.moveTilesDown();
            }
        }

        if (evt.keyCode >= GameConstants.DIRECTION_LEFT && evt.keyCode <= GameConstants.DIRECTION_DOWN) {
            evt.preventDefault();
        }
    };
    window.addEventListener('keydown', keydownEvent, false);
};

GameBoard.prototype.mergeAndMoveHorizontal = function(direction, row, column) {
    var tile = this.mergeHorizontal(direction, row, column);
    tile = this.moveHorizontal(direction, row, column);

    return tile;
};

GameBoard.prototype.mergeHorizontal = function(direction, row1, column1, column2) {
    var currentPosition = this.toAbsolutePosition(row1, column1);
    var currentTile = this.matrix[currentPosition];
    if (currentTile.tileValue === 0)
        return currentTile;

    column2 = column2 === undefined ? (column1 + direction) : column2;
    if (column1 < 0 || column2 < 0 || column1 >= this.nrows || column2 >= this.nrows)
        return currentTile;

    var neighbourPosition = this.toAbsolutePosition(row1, column2);
    var neighbourTile = this.matrix[neighbourPosition];

    if (currentTile.changed)
        return currentTile;

    if (neighbourTile.tileValue === 0) {
        if ((column2 + direction >= 0) && (column2 + direction < this.nrows)) {
            return this.mergeHorizontal(direction, row1, column1, column2 + direction);
        }
    } else if (currentTile.tileValue === neighbourTile.tileValue) {
        currentTile.changed = true;
        this.setTile(neighbourPosition, currentTile.doubleValue());
        this.setTile(currentPosition, new TileSprite(0), false);
    }
    return currentTile;
};

GameBoard.prototype.moveHorizontal = function(direction, row1, column1, column2) {
    var currentPosition = this.toAbsolutePosition(row1, column1);
    var currentTile = this.matrix[currentPosition];
    if (currentTile.tileValue === 0)
        return currentTile;

    column2 = column2 === undefined ? (column1 + direction) : column2;
    if (column1 < 0 || column2 < 0 || column1 >= this.nrows || column2 >= this.nrows)
        return currentTile;

    var neighbourPosition = this.toAbsolutePosition(row1, column2);
    var neighbourTile = this.matrix[neighbourPosition];

    if (neighbourTile.tileValue === 0) {
        currentTile.changed = true;
        this.setTile(neighbourPosition, currentTile);
        this.setTile(currentPosition, new TileSprite(0), false);

        if ((column2 + direction >= 0) && (column2 + direction < this.nrows)) {
            return this.moveHorizontal(direction, row1, column2, column2 + direction);
        }
    }
    return currentTile;
};

GameBoard.prototype.moveTiles = function(dir) {
    var changed = false;
    var start = (dir === GameConstants.DIRECTION_LEFT ? 0 : this.nrows - 1), end = (dir === GameConstants.DIRECTION_LEFT ? this.nrows : 0);

    var condition = (dir === GameConstants.DIRECTION_LEFT) ? (function(column, end) {
        return column.value < end;
    }) : (function(column, end) {
        return column.value >= end;
    });
    var increment = (dir === GameConstants.DIRECTION_LEFT) ? (function(column) {
        return column.value += 1;
    }) : (function(column) {
        return column.value -= 1;
    });

    var oColumn = {value: undefined};

    for (var row = 0; row < this.nrows; row++) {
        for (oColumn.value = start; condition(oColumn, end); increment(oColumn)) {
            var column = oColumn.value;
            var tile = this.mergeAndMoveHorizontal(dir === GameConstants.DIRECTION_LEFT ? -1 : 1, row, column);
            if (tile.changed === true)
                changed = true;

            tile.changed = false;
        }
    }

    if (changed === true) {
        this.insertNewTile();
    } else {
        if (this.isBoardFull()) {
            alert("Game Over");
        }
    }
};

GameBoard.prototype.mergeAndMoveVertical = function(direction, row, column) {
    var tile = this.mergeVertical(direction, column, row);
    tile = this.moveVertical(direction, column, row);

    return tile;
};

GameBoard.prototype.mergeVertical = function(direction, column1, row1, row2) {
    var currentPosition = this.toAbsolutePosition(row1, column1);
    var currentTile = this.matrix[currentPosition];
    if (currentTile.tileValue === 0)
        return currentTile;

    row2 = row2 === undefined ? (row1 + direction) : row2;
    if (row1 < 0 || row2 < 0 || row1 >= this.nrows || row2 >= this.nrows)
        return currentTile;

    var neighbourPosition = this.toAbsolutePosition(row2, column1);
    var neighbourTile = this.matrix[neighbourPosition];

    if (currentTile.changed)
        return currentTile;

    if (neighbourTile.tileValue === 0) {
        if ((row2 + direction >= 0) && (row2 + direction < this.nrows)) {
            return this.mergeVertical(direction, column1, row1, row2 + direction);
        }
    } else if (currentTile.tileValue === neighbourTile.tileValue) {
        currentTile.changed = true;
        this.setTile(neighbourPosition, currentTile.doubleValue());
        this.setTile(currentPosition, new TileSprite(0), false);
    }
    return currentTile;
};

GameBoard.prototype.moveVertical = function(direction, column1, row1, row2) {
    var currentPosition = this.toAbsolutePosition(row1, column1);
    var currentTile = this.matrix[currentPosition];
    if (currentTile.tileValue === 0)
        return currentTile;

    row2 = row2 === undefined ? (row1 + direction) : row2;
    if (row1 < 0 || row2 < 0 || row1 >= this.nrows || row2 >= this.nrows)
        return currentTile;

    var neighbourPosition = this.toAbsolutePosition(row2, column1);
    var neighbourTile = this.matrix[neighbourPosition];

    if (neighbourTile.tileValue === 0) {
        currentTile.changed = true;
        this.setTile(neighbourPosition, currentTile);
        this.setTile(currentPosition, new TileSprite(0), false);

        if ((row2 + direction >= 0) && (row2 + direction < this.nrows)) {
            return this.moveVertical(direction, column1, row1, row2 + direction);
        }
    }
    return currentTile;
};

GameBoard.prototype.moveTilesUp = function() {
    var changed = false;
    for (var row = 0; row < this.nrows; row++) {
        for (var column = 0; column < this.nrows; column++) {
            var tile = this.mergeAndMoveVertical(-1, row, column);
            if (tile.changed === true) {
                changed = true;
            }
            tile.changed = false;
        }
    }

    if (changed === true) {
        this.insertNewTile();
    } else {
        if (this.isBoardFull()) {
            alert("Game Over");
        }
    }
};

GameBoard.prototype.moveTilesDown = function() {
    var changed = false;
    for (var row = (this.nrows - 1); row >= 0; row--) {
        for (var column = 0; column < this.nrows; column++) {
            var tile = this.mergeAndMoveVertical(1, row, column);
            if (tile.changed === true) {
                changed = true;
            }
            tile.changed = false;
        }
    }

    if (changed === true) {
        this.insertNewTile();
    } else {
        if (this.isBoardFull()) {
            alert("Game Over");
        }
    }
};

GameBoard.prototype.toAbsolutePosition = function(row, column) {
    if (row < 0 || column < 0 || row > this.nrows - 1 || column > this.nrows - 1)
        return undefined;
    return row * this.nrows + column;
};

GameBoard.prototype.toRowColumn = function(position) {
    return {
        row: Math.floor(position / this.nrows),
        column: position % this.nrows
    };
};

GameBoard.prototype.paint = function(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    this.matrix.forEach(function(elem) {
        elem.paint(context);
    });

    var thisObj = this;
    requestAnimationFrame(function() {
        thisObj.paint(context);
    });
};

GameBoardSingleton = (function() {
    var _instance = new GameBoard();
    return {
        instance: _instance
    };
})();

//************* Sprite ******************************************
function Sprite(x, y, width, height, image) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 100;
    this.height = height || 100;
    this.image = image;
}

Sprite.prototype.paint = function(context) {
    if (this.image.complete) {
        if (this.sliceX !== undefined) {
            this.x += this.sliceX;
            if ((this.sliceX > 0 && this.x >= this.newX) || (this.sliceX < 0 && this.x <= this.newX)) {
                this.x = this.newX;
                this.sliceX = undefined;

                if (this.animationFinishEvt !== undefined) {
                    this.animationFinishEvt();
                    this.animationFinishEvt = undefined;
                }
            }
        }
        context.drawImage(this.image, this.x, this.y);
    }
    this.ltp = new Date().getTime();
};

Sprite.prototype.moveAnimatedToX = function(newX, animationFinishEvt) {
    this.newX = newX;
    this.sliceX = (newX - this.x) / 30;
    this.animationFinishEvt = animationFinishEvt;
};

Sprite.prototype.moveAnimatedToY = function(newY) {
    this.newY = newY;
};

//************* TileSprite **************************************
function TileSprite(tileValue) {
    var image = ImageFactory.build("img/" + tileValue + ".png");

    this.base = Sprite;
    this.base(0, 0, GameConstants.TILE_SIZE, GameConstants.TILE_SIZE, image);

    this.tileValue = tileValue;
    this.ltp = 0;
}
TileSprite.prototype = new Sprite;

TileSprite.prototype.doubleValue = function() {
    this.tileValue *= 2;
    this.image = ImageFactory.build("img/" + this.tileValue + ".png");

    return this;
};
//************* Initialize **************************************
GameBoardSingleton.instance.start();