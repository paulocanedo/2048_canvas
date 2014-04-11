//************* ImageFactory ************************************
ImageFactory = (function() {
	return {
		cache: [],
		build: function(imgSrc) {
			var imageObj;
			if(ImageFactory.cache[imgSrc] === undefined) {
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
		if(elem.tileValue === 0) flag = false;
	});

	return flag;
};

GameBoard.prototype.randomSlotEmpty = function(lastTried) {
	if(this.isBoardFull()) return undefined;

	var position = lastTried || Math.floor((Math.random() * 4 * 4));
	if(this.matrix[position].tileValue !== 0) {
		return this.randomSlotEmpty(lastTried + 1);
	}

	return position;
};

GameBoard.prototype.setTile = function(position, tile, animationFinishEvt) {
	if(tile === undefined) return;

	var row = Math.floor(position / 4);
	var column = position % 4;

	var y = row * tile.width + (row * 10);
	var x = column * tile.height + (column * 10);

	if(animationFinishEvt !== false) {
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
	for (var i = 0; i < 16; i++) {
		this.setTile(i, new TileSprite(0), false);
	}

	var position = 0;
	// var position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(2), false);

	position = 1;
	// var position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(2), false);

	// position = 3;
	// position = this.randomSlotEmpty();
	// this.setTile(position, new TileSprite(4), false);

	position = 2;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(2), false);


		position = 7;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(8), false);

		position = 9;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(16), false);

		position = 11;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(16), false);
};

GameBoard.prototype.insertNewTile = function() {
	var position = this.randomSlotEmpty();

	// this.setTile(position, new TileSprite(2));
	this.setTile(position, new TileSprite(Math.random() < 0.9 ? 2 : 4), false);
};

GameBoard.prototype.start = function() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	this.init();
	this.paint(context);

	var thisObj = this;
	var keydownEvent = function(evt) {
		switch(evt.keyCode) {
			case(37): {
				thisObj.moveTilesLeft();
				break;
			} case(38): {
				thisObj.moveTilesUp();
				break;
			} case(39): {
				thisObj.moveTilesRight();
				break;
			} case(40): {
				thisObj.moveTilesDown();
				break;
			}
		}

		if(evt.keyCode >=37 && evt.keyCode <= 40) {
			evt.preventDefault();
		}
	};
	window.addEventListener('keydown', keydownEvent, false);
};

GameBoard.prototype.mergeHorizontal = function(direction, row1, column1, column2) {
	column2 = column2 === undefined ? (column1 + direction) : column2;
	if(column1 < 0 || column2 < 0 || column1 >= 4 || column2 >= 4) return;
	
	var currentPosition = this.toAbsolutePosition(row1, column1);
	var currentTile = this.matrix[currentPosition];
	var neighbourPosition = this.toAbsolutePosition(row1, column2);
	var neighbourTile = this.matrix[neighbourPosition];

	if(currentTile.changed) return;

	if (neighbourTile.tileValue === 0) {
		if((column2 + direction >=0) && (column2 + direction < 4)) {
			this.mergeHorizontal(direction, row1, column1, column2 + direction);
		}
	} else if (currentTile.tileValue === neighbourTile.tileValue) {
		currentTile.changed = true;
		this.setTile(neighbourPosition, currentTile.doubleValue());
		this.setTile(currentPosition, new TileSprite(0), false);
	}
};

GameBoard.prototype.moveHorizontal = function(direction, row1, column1, column2) {
	column2 = column2 === undefined ? (column1 + direction) : column2;
	if(column1 < 0 || column2 < 0 || column1 >= 4 || column2 >= 4) return;
	
	var currentPosition = this.toAbsolutePosition(row1, column1);
	var currentTile = this.matrix[currentPosition];
	var neighbourPosition = this.toAbsolutePosition(row1, column2);
	var neighbourTile = this.matrix[neighbourPosition];

	if(neighbourTile.tileValue === 0) {
		this.setTile(neighbourPosition, currentTile);
		this.setTile(currentPosition, new TileSprite(0), false);

		if((column2 + direction >=0) && (column2 + direction < 4)) {
			this.moveHorizontal(direction, row1, column2, column2 + direction);
		}
	}
};

GameBoard.prototype.moveTilesLeft = function() {
	for(var column=0; column<4; column++) {
		for(var row=0; row<4; row++) {
			var currentTile = this.matrix[this.toAbsolutePosition(row, column)];
			if(currentTile.tileValue === 0) continue;

			this.mergeHorizontal(-1, row, column);

			currentTile = this.matrix[this.toAbsolutePosition(row, column)];
			if(currentTile.tileValue === 0) continue;
			this.moveHorizontal(-1, row, column);

			currentTile.changed = false;
		}
	}
};

GameBoard.prototype.moveTilesRight = function() {
	for(var column=4-1; column>=0; column--) {
		for(var row=0; row<4; row++) {
			var currentTile = this.matrix[this.toAbsolutePosition(row, column)];
			if(currentTile.tileValue === 0) continue;

			this.mergeHorizontal(1, row, column);

			var currentTile = this.matrix[this.toAbsolutePosition(row, column)];
			if(currentTile.tileValue === 0) continue;
			this.moveHorizontal(1, row, column);

			currentTile.changed = false;
		}
	}
};


GameBoard.prototype.moveTilesUp = function() {

};

GameBoard.prototype.moveTilesDown = function() {

};

GameBoard.prototype.toAbsolutePosition = function(row, column) {
	if(row < 0 || column < 0 || row > 4 - 1 || column > 4 - 1) return undefined;
	return row * 4 + column;
};

GameBoard.prototype.toRowColumn = function(position) {
	return {
		row: Math.floor(position / 4),
		column: position % 4
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
	if(this.image.complete) {
		if(this.sliceX !== undefined) {
			this.x += this.sliceX;
			if((this.sliceX > 0 && this.x >= this.newX) || (this.sliceX < 0 && this.x <= this.newX)) {
				this.x = this.newX;
				this.sliceX = undefined;

				if(this.animationFinishEvt !== undefined) {
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
	this.base(0, 0, 100, 100, image);

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