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
	var result = this.matrix[this.toAbsolutePosition(row, column)] === undefined;
	return result;
};

GameBoard.prototype.isSlotEquals = function(row1, column1, row2, column2) {
	var tile1 = this.matrix[this.toAbsolutePosition(row1, column1)];
	var tile2 = this.matrix[this.toAbsolutePosition(row2, column2)];
	if (tile1 === undefined && tile2 === undefined) return true;
	return tile1 !== undefined && tile2 !== undefined && tile1.tileValue === tile2.tileValue;
};

GameBoard.prototype.isBoardFull = function() {
	var flag = true;
	this.matrix.forEach(function(elem) {
		if(elem === undefined) flag = false;
	});

	return flag;
};

GameBoard.prototype.randomSlotEmpty = function(lastTried) {
	if(this.isBoardFull()) return undefined;

	var position = lastTried || Math.floor((Math.random() * 4 * 4));
	if(this.matrix[position] !== undefined) {
		return this.randomSlotEmpty(lastTried + 1);
	}

	return position;
};

GameBoard.prototype.setTile = function(position, tile) {
	this.matrix[position] = tile;
	if(tile === undefined) return;

	var row = Math.floor(position / 4);
	var column = position % 4;

	var y = row * tile.width + (row * 10);
	var x = column * tile.height + (column * 10);

	tile.moveAnimatedToX(x);
	tile.y = y;
	// tile.y = y;
};

GameBoard.prototype.init = function() {
	this.matrix = [
		undefined, undefined, undefined, undefined,
		undefined, undefined, undefined, undefined,
		undefined, undefined, undefined, undefined,
		undefined, undefined, undefined, undefined
	];

	// this.insertNewTile();
	// this.insertNewTile();
	var position = 0;
	// var position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(2));

	position = 1;
	// var position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(2));

	position = 3;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(4));

	position = 2;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(2));


		position = 7;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(8));

		position = 9;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(16));

		position = 11;
	// position = this.randomSlotEmpty();
	this.setTile(position, new TileSprite(16));
};

GameBoard.prototype.insertNewTile = function() {
	var position = this.randomSlotEmpty();

	// this.setTile(position, new TileSprite(2));
	this.setTile(position, new TileSprite(Math.random() < 0.9 ? 2 : 4));
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

GameBoard.prototype.moveTilesLeft = function() {
	for (var i=0; i<4; i++) {
		for (var j=0; j<4; j++) {
			var position = j * 4 + i;
			var tile = this.matrix[position];
			if(tile === undefined) continue;

			var column = i;
			for(var k=column-1; k>=0; k--) {
				nTile = this.matrix[this.toAbsolutePosition(j, k)];
				if(nTile === undefined) continue;

				if(this.isSlotEquals(j, k, j, column) && !nTile.merged) {
					nTile.merged = true;
					nTile.doubleValue();
					this.matrix[position] = tile = undefined;
				}
			}
		
			this.matrix[position] = undefined;
			while(column>0 && this.isSlotEmpty(j, column-1)) {
				column--;
				changed = true;
			}
			this.setTile(j * 4 + column, tile);
		}
	}

	this.matrix.forEach(function(elem) {
		if(elem !== undefined) elem.merged = undefined;
	});
};

GameBoard.prototype.moveTilesUp = function() {

};

GameBoard.prototype.moveTilesRight = function() {

};

GameBoard.prototype.moveTilesDown = function() {

};

GameBoard.prototype.toAbsolutePosition = function(row, column) {
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
		if(elem !== undefined) {
			elem.paint(context);
		}
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
			}
		}
		context.drawImage(this.image, this.x, this.y);
	}
	this.ltp = new Date().getTime();
};

Sprite.prototype.moveAnimatedToX = function(newX) {
	this.newX = newX;
	this.sliceX = (newX - this.x) / 30;
	console.log(this.sliceX);
};

Sprite.prototype.moveAnimatedToY = function(newY) {
	this.newY = newY;
};

//************* TileSprite **************************************
function TileSprite(tileValue) {
	var image = ImageFactory.build("//localhost/~paulocanedo/2048_fake/img/" + tileValue + ".png");

	this.base = Sprite;
	this.base(0, 0, 100, 100, image);

	this.tileValue = tileValue;
	this.ltp = 0;
}
TileSprite.prototype = new Sprite;

TileSprite.prototype.doubleValue = function() {
	this.tileValue *= 2;
	this.image = ImageFactory.build("//localhost/~paulocanedo/2048_fake/img/" + this.tileValue + ".png");
};
//************* Initialize **************************************
GameBoardSingleton.instance.start();