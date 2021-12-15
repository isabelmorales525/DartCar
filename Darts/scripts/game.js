/*
 * Class Game.
 *
 * Copyright (c) 2010 Jorge Morgado
 * GPL license
 */

/*****************************************************************************
 * Class		Game
 * Description	Instantiates a Game object.
 * Parameters 	none
 * Returns		nothing
 */
function Game() {
	// dart
	this.DART_SHOTMAX = 14;
	this.DART_SHOWMAXANGLE = 10;

	// game speed
	this.SPEED_HAND = 20;					// hand movement
	this.SPEED_DART = 35;					// dart throw movement
	this.SPEED_THROW = this.SPEED_DART * 3;	// hand throw movement

	// key codes
	this.KEYCODE_UP = 81;		// Q = up
	this.KEYCODE_DOWN = 65;		// A = down
	this.KEYCODE_LEFT = 79;		// O = left
	this.KEYCODE_RIGHT = 80;	// P = right
	this.KEYCODE_THROW = 32;	// Space bar
	this.KEYCODE_NEW = 78;		// (N)ew
	this.KEYCODE_PAUSE = 83;	// (S)top

	// throw types
	this.IS_OUTSIDE = 0;	// outside the board
	this.IS_SINGLE = 1;		// single
	this.IS_DOUBLE = 2;		// double
	this.IS_TREBLE = 3;		// treble
	this.IS_ROUNDM = 4;		// 25
	this.IS_MIDDLE = 5;		// 50
	this.throwType = 0;

	// game timer
	this.oTimer = new Timer();

	// language object (game strings)
	this.oLang = new Lang('en');

	// score objects for both players
	this.aScores = new Array();
	this.aScores[0] = new Score(0, this.oLang.str(10));
	this.aScores[1] = new Score(1, this.oLang.str(11));

	// board object layer
	this.oBoard = new Board('Board');
	this.oBoard.create();

	// darts object layers array
	this.aDarts = new Array();
	for (var m = 0; m < 2; m++) {
		this.aDarts[m] = new Array();

		for (var n = 0; n < 3; n++) {
			this.aDarts[m][n] = new Dart('Dart' + m + n, m, n, this.oBoard.WIDTH, this.oBoard.HEIGHT + 40);
			this.aDarts[m][n].create();
		}
	}

	// hand object layer
	this.oHand = new Hand('Hand', this.oBoard.x, this.oBoard.y, this.oBoard.WIDTH, this.oBoard.HEIGHT);
	this.oHand.create();
	
	// EN1 BOX VALUES: see reset function
	this.boxValues = new Array(); // 5x5 array
	for (var x=0; x<5; x++) {
		this.boxValues[x] = new Array();
	}

	this.reset();			// reset the game environment
}

/*******************************************************************************
 * Function		resize
 * Description	Process a window resize event.
 * Parameters	none
 * Returns		nothing
 */
// TODO: Make sure this works on IE and doesn't affect the performance
// (see http://mbccs.blogspot.com/2007/11/fixing-window-resize-event-in-ie.html)
Game.prototype.resize = function() {
	var oldX = this.oBoard.x;
	var oldY = this.oBoard.y;

	this.oBoard.calcXY();

	// after re-calculating all values, move the board layer
	this.oBoard.moveTo(this.oBoard.x, this.oBoard.y);

	// set the new base limits for the hand layer
	this.oHand.setBoardXY(this.oBoard.x, this.oBoard.y);
	this.oHand.moveBy(this.oBoard.x - oldX, this.oBoard.y - oldY);

	// move the darts only the difference from their previous position
	for (var m = 0; m < 2; m++) 
		for (var n = 0; n < 3; n++) 
			this.aDarts[m][n].moveBy(this.oBoard.x - oldX, this.oBoard.y - oldY);
}

/*******************************************************************************
 * Function		keyDown
 * Description	Processes a key down event.
 * Parameters	none
 * Returns		False (to disable the browser from processing the pressed key)
 */
Game.prototype.keyDown = function(keyCode) {
	switch (keyCode) {
		case this.KEYCODE_LEFT:		// left
			this.oHand.directionLeft();
			break;
		case this.KEYCODE_UP:		// up
			this.oHand.directionUp();
			break;
		case this.KEYCODE_RIGHT:	// right
			this.oHand.directionRight();
			break;
		case this.KEYCODE_DOWN:		// down
			this.oHand.directionDown();
			break;
		case this.KEYCODE_THROW:	// fire
			this.throwStart();
			break;
		case this.KEYCODE_NEW:		// new game
			this.start();
			break;
		case this.KEYCODE_PAUSE:	// pause game
			this.pause();
	}

	return false;		// KEEP THIS!!
}

/*******************************************************************************
 * Function		start
 * Description	Start a new game.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.start = function() {
	// confirm to start a new game, if another game is already running
	if (!this.oTimer.is_active() || confirm(this.oLang.str(4))) {
		// turn off the light on the current player/dart
		this.aScores[this.playerId].lightLow(this.dartId);

		this.reset();
		this.newTurn();
		this.newDart();

		//////////////////////////////
		//// EN1 visual overlays: ////
		//////////////////////////////
	
		// now that we have new box values
		// (1) show score boxes in debugging area
		// (2) set up score_overlay
		// (3) set up balloon_overlay
	
		// (1) show score boxes in debugging area
		console.log("Box Vals:", this.boxValues);
		var output_html = "<table border=1>";
		for (var x=0; x<5; x++) {
			output_html += "<tr>";
			for (var y=0; y<5; y++) {
				output_html += "<td>" + this.boxValues[x][y].toString() + "</td>";
			}
			output_html += "</tr>";
		}
		output_html += "</table>";
		document.getElementById('box_vals').innerHTML = output_html;
	
		// (2) set up score_overlay
		var score_overlay = document.getElementById('score_overlay');
		
		var score_html = "<table style='margins: 0px; align-content: middle; border: 1px;'>";
		for (var x=0; x<5; x++) {
			score_html += "<tr>";
			for (var y=0; y<5; y++) {
				score_html += "<td width='99px;' height='99px;' align=center>" + this.boxValues[x][y].toString() + "</td>";
			}
			score_html += "</tr>";
		}
		score_html += "</table>";
		score_overlay.innerHTML = score_html;
	
		// (3) set up balloon_overlay
		var balloon_overlay = document.getElementById('balloon_overlay');
		var balloon_html = "<table style='margins: 0px; align-content: middle;'>";
		for (var row=0; row<5; row++) {
			balloon_html += "<tr>";
			for (var col=0; col<5; col++) {
				var box_id = (row+1).toString() + (col+1).toString();
				balloon_html += "<td id='balloon" + box_id + "' width='99px;' height='99px;' align=center valign=middle><img src='./images/balloon.gif' width='90px;' height='90px;'></td>";
			}
			balloon_html += "</tr>";
		}
		balloon_html += "</table>";
		balloon_overlay.innerHTML = balloon_html;


	}
}

/*******************************************************************************
 * Function		pause
 * Description	Pause a running game.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.pause = function() {
	// pause only if a game is running
	if (this.oTimer.is_active()) alert(this.oLang.str(9));
}

/*******************************************************************************
 * Function		speed
 * Description	Changes the hand speed interval.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.speed = function(id) {
	switch (id) {
		case '2':		// fast
			this.SPEED_HAND = 20;
			break;
		case '1':		// medium
			this.SPEED_HAND = 30;
			break;
		default:		// slow
			this.SPEED_HAND = 45;
	}

	this.oTimer.change(this.SPEED_HAND);
}

/*******************************************************************************
 * Function		playerChangeName
 * Description	Change the player's name.
 * Parameters	player - the player's id
 * Returns		nothing
 */
Game.prototype.playerChangeName = function(player) {
	var name = prompt(this.oLang.str(8), this.aScores[player].name);

	if (!is_empty(name)) {
		this.aScores[player].name = name;

		// truncate the name if too long
		setText('lblPlayer' + player, (name.length > 15 ? name.substr(0, 15) + '...' : name));
	}
}

/*******************************************************************************
 * Function		reset
 * Description	Reset the game environment before starting a new game.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.reset = function() {
	this.aScores[0].reset();
	this.aScores[1].reset();

	this.throwCount = 0;	// dart throw counter
	this.playerId = 1;		// player id
	this.dartId = 0;		// dart id
	
	////////
	// EN1: game is resetting
	var min_val = 1;
	var max_val = 10;
	for (var x=0; x<5; x++) {
		for (var y=0; y<5; y++) {
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
			var random_val = Math.random() * (max_val - min_val) + min_val;
			this.boxValues[x][y] = parseInt(random_val);
		}
	}

}

/*******************************************************************************
 * Function		newTurn
 * Description	Setup the game space before a player's new turn.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.newTurn = function() {
	this.dartId = 0;
	this.playerId = (this.playerId ? 0 : 1);		// change player

	// total score before turn is the current total score
	this.aScores[this.playerId].newTurn();

	for (var m = 0; m < 2; m++)
		for (var n = 0; n < 3; n++)
			this.aDarts[m][n].showByPlayer(this.oBoard.x, this.oBoard.y);
}

/*******************************************************************************
 * Function		newDart
 * Description	Setup the game space before a player's new dart.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.newDart = function() {
	setText('lblFeed', this.oLang.str(0) + this.aScores[this.playerId].name);

	this.aDarts[this.playerId][this.dartId].hide();		// hide the next dart

	this.aScores[this.playerId].lightHigh(this.dartId);
	this.oHand.directionRand();	// randomize the hand direction before a new dart

	// moves the hand layer to the middler (center) of the game space
	this.oHand.moveToCenter(this.oBoard.x, this.oBoard.y);
	this.oHand.setImage(0);

	sleep(500);

	this.oTimer.start('oGame.oHand.move()', this.SPEED_HAND);
}

/*******************************************************************************
 * Function		throwStart
 * Description	The throw animation.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.throwStart = function (){
	this.oTimer.start('oGame.throwHand()', this.SPEED_THROW);
}

/*******************************************************************************
 * Function		throwHand
 * Description	The throw hand animation.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.throwHand = function() {
	this.oHand.setImage(++this.oHand.count);

	if (this.oHand.count == this.oHand.IMAGES.length - 1) {
		this.oHand.count = 0;

		// set the dart layer
		this.aDarts[this.playerId][this.dartId].moveTo(this.oHand.x, this.oHand.y);

		// start the dart throw animation
		this.aDarts[this.playerId][this.dartId].setImage(0);
		this.aDarts[this.playerId][this.dartId].show();
		this.oTimer.start('oGame.throwDart()', this.SPEED_DART);
	}
}

/*******************************************************************************
 * Function		throwDart
 * Description	The throw dart animation.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.throwDart = function() {
	if (this.throwCount++ < this.DART_SHOTMAX) {		// shows the dart throw
		if (this.throwCount < this.DART_SHOWMAXANGLE)
			this.aDarts[this.playerId][this.dartId].moveBy(0, -6);
		else if (this.throwCount == this.DART_SHOWMAXANGLE) 
			this.aDarts[this.playerId][this.dartId].setImage(1);
		else
			this.aDarts[this.playerId][this.dartId].moveBy(0, +3);
	} else {
		this.throwCount = 0;
		this.oHand.setImage(this.oHand.count);
		this.aScores[this.playerId].lightLow(this.dartId);

		if (this.rules501()) this.newDart();
	}
}

/*******************************************************************************
 * Function		rules501
 * Description	Implements the Darts 501 rules after a throw.
 * Parameters	name - dart (layer) to score
 * Returns		True if the game still runs; false if the game is over.
 */
Game.prototype.rules501 = function() {
	var ret = true;

	var score = this.pieScore(
		this.aDarts[this.playerId][this.dartId].realX() - this.oBoard.x,
		this.aDarts[this.playerId][this.dartId].realY() - this.oBoard.y
	);
	set_dart_val(score);

	this.aScores[this.playerId].setDart(this.dartId, score);

// NEW SCORING OF SIMPLE BALLOON GAME

	if (this.aScores[this.playerId].total <= 0) {
		ret = this.finish(this.playerId);		// game is finished (current player wins)
	} else {
		// check if the player needs to be changed
		if (ret && this.dartId++ == 2) this.newTurn();
	}
	return ret;


// OLD SCORING OF ORIGINAL DARTS GAME
	if (this.aScores[this.playerId].total == 0 && (this.throwType == this.IS_DOUBLE || this.throwType == this.IS_MIDDLE)) {
	// game ends (player reach 0 and finished with either a double or in the bull's eye)
		ret = this.finish(this.playerId);		// game is finished (current player wins)
	} else {
	// game is not yet over
		if (this.aScores[this.playerId].total < 2) {	// bust, so apply the rules
			this.aScores[this.playerId].setTotal(this.aScores[this.playerId].total_prev);
			alert(this.aScores[this.playerId].name + ': ' + oLang.str(1));
			this.dartId = 2;		// force a change of player below
		} else if (this.playerId == 1 && this.aScores[1].turns >= 20 && this.dartId == 2) {	// if both players have reached 20+ turns
			if (this.aScores[0].total < this.aScores[1].total) { // player 1 wins if score's lower
				ret = this.finish(0);
			} else if (this.aScores[1].total < this.aScores[0].total) { // player 2 wins if score's lower
				ret = this.finish(1);
			} else if (this.aScores[1].turns == 30) {
				// if both players have reached 20+10 turns an their scores are the same we have a draw
				ret = this.finish();
			}
		}

		// check if the player needs to be changed
		if (ret && this.dartId++ == 2) this.newTurn();
	}

	return ret;
}

/*******************************************************************************
 * Function		finish
 * Description	Terminates the game and sets the winner (or a draw).
 * Parameters	playerId - the winners id; if null, the game is a draw.
 * Returns		false (by design).
 */
Game.prototype.finish = function(playerId) {
	this.oTimer.stop();

// GET RID OF ALERT
//	alert(setText('lblFeed',
//		(playerId == null ? this.oLang.str(12) : this.aScores[playerId].name + ': ' + this.oLang.str(3))
//	));

	return false;
}

/*******************************************************************************
 * Function		pieScore
 * Description	Gets the score from the dart throw.
 * Parameters	x, y - the coords of the point where the dart hit the target
 * Returns		An integer with the score.
 */
Game.prototype.pieScore = function(x, y) {


	////// EN1 SCORING ////////
	
	// console.log('x',x,', y',y);
	var box_num = 0;
	if (x > 0 && x < 500 && y > 0 && y < 500) {
		// then in range
		box_num = parseInt((parseInt(y / 100) * 5) + parseInt(x / 100)) + 1;
	} else {
		box_num = 0; // missed!
	}
	//console.log('- box_num = ', box_num);
	if (box_num > 0) {
		var row = Math.ceil(box_num / 5);
		//console.log('- row: ', row);
		var col = Math.floor(box_num % 5)
		if (col == 0) { col = 5; } // hack to fix math
		//console.log('- col: ', col);

		var score = this.boxValues[row-1][col-1];
		//console.log('- score: ', score);
		var balloon_box = document.getElementById('balloon' + row.toString() + col.toString());
		if (balloon_box.innerHTML == "") {
			// then already hit, so MISSED!
			score = 0;
		} else { 
			balloon_box.innerHTML = "";
		}

		return score;
	} else {
		//console.log('MISSED! score is zero...');
		return 0;
	}

	///// ORIGINAL CODE /////
	
	var quad;		// all calculations are reduced to the 1st quadrant
	var newx;		// the new (X,Y) values after the projection
	var newy;		// on the board's 1st quadrant

	var aScore = new Array(
		new Array( 6, 13,  4, 18,  1, 20),
		new Array(20,  5, 12,  9, 14, 11),
		new Array(11,  8, 16,  7, 19,  3),
		new Array( 3, 17,  2, 15, 10,  6)
	);

	if (x < this.oBoard.CENTER_X) {		// quad 2 or 3 ??
		if (y < this.oBoard.CENTER_Y) {	// quad 2
			quad = 2;
			newx = this.oBoard.CENTER_X - y;
			newy = this.oBoard.CENTER_Y - x;
		} else {					// quad 3
			quad = 3;
			newx = this.oBoard.CENTER_X - x;
			newy = this.oBoard.CENTER_Y - y;
		}
	} else {						// quad 1 or 4 ??
		if (y < this.oBoard.CENTER_Y) {	// quad 1
			quad = 1;
			newx = x - this.oBoard.CENTER_X;
			newy = this.oBoard.CENTER_Y - y;
		} else {					// quad 4
			quad = 4;
			newx = y - this.oBoard.CENTER_Y;
			newy = x - this.oBoard.CENTER_X;
		}
	}

	// An angle cosine should be calculated with cos @=(a/h), where:
	// (a=triangle's base) and (h=hypotenuse). Because we want the angle's
	// value, we calculate the arccosine (which is the angle's from which the
	// cosine is the value).
	var hypo = hypotenuse(newx, newy);	// Pythagoras's theorem hypotenuse
	var angle = Math.acos(newx / hypo);
	var pie = this.getPie(angle);

	return this.realScore(hypo, aScore[quad - 1][pie]);
}

/*******************************************************************************
 * Function		getPie
 * Description	Gets the pie where the darts hits the board.
 * Parameters	none
 * Returns		The pie's number (only on the 1st quadrant).
 */
Game.prototype.getPie = function(angle) {
	var aRadians = new Array(0.157079633, 0.471238898, 0.785398163, 1.099557429, 1.413616694);

	for (var n = 0; n < 5 && (angle > aRadians[n]); n++);

	return n;
}

/*******************************************************************************
 * Function		realScore
 * Description	Returns the real score because every pie is divided by different circles.
 * Parameters	The angle's hypotenuse
 * Returns		An integer with the real score.
 */
Game.prototype.realScore = function(hypo, score) {
	var real;
	var aCircle = new Array(5, 11, 67, 75, 131, 140);

	if (hypo < aCircle[0]) {
		real = 50;
		this.throwType = this.IS_MIDDLE;
	} else if (hypo < aCircle[1]) {
		real = 25;
		this.throwType = this.IS_ROUNDM;
	} else if (hypo > aCircle[2] && hypo < aCircle[3]) {
		real = score * 3;
		this.throwType = this.IS_TREBLE;
	} else if (hypo > aCircle[4] && hypo < aCircle[5]) {
		real = score * 2;
		this.throwType = this.IS_DOUBLE;
	} else if (hypo > aCircle[5]) {
		real = 0;
		this.throwType = this.IS_OUTSIDE;
	} else {
		real = score;
		this.throwType = this.IS_SINGLE;
	}

  return real;
}

/*******************************************************************************
 * Function		test
 * Description	Implements some unit tests - this is very basic and needs to be improved.
 * Parameters	none
 * Returns		nothing
 */
Game.prototype.test = function() {
	this.debug = true;
	var testId = 0;

	setText('lblFeed', 'The Darts Game - Tests start.');

	setText('lblFeed', 'Test ' + ++testId + ': Darts highlight.');
	for (m = 0; m < 2; m++)
		for (n = 0; n < 3; n++) {
			this.aScores[m].lightHigh(n);
			alert('Hightlight dart ' + (n + 1) + ' for Player ' + (m + 1) + '.');
			this.aScores[m].lightLow(n);
		}

	setText('lblFeed', 'Test ' + ++testId + ': Hand layer.');
	alert('Show Hand (on center).');
	this.oHand.moveToCenter(this.oBoard.x, this.oBoard.y);
	this.oHand.setImage(0);

	setText('lblFeed', 'Test ' + ++testId + ': Darts layers.');
	for (var m = 0; m < 2; m++) 
		for (var n = 0; n < 3; n++) {
			alert('Show Dart ' + (n + 1) + ' for Player ' + (m + 1) + '.');
			this.aDarts[m][n].showByPlayer(this.oBoard.x, this.oBoard.y);
		}

//	setText('lblFeed', 'Test ' + ++testId + ': Throw dart.');
//	alert('Hand throw dart.');
//	this.throwStart();
//	this.oTimer.stop();

	setText('lblFeed', 'The Darts Game - Tests end.');
}