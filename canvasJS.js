// ********************************************************
// CanvasJS.js
// ********************************************************

// ********************************************************
// Declare Variables
// ********************************************************

// Selectors / Creators
var $ = function(id) {
    return document.getElementById(id);
};
var dc = function(id) {
    return document.createElement(tag);
};

// Global Map Variables
var mapWidth = 0;
var mapHeight = 0;
var miniMapScale = 8;

var screenWidth = 320;
var stripWidth = 4;
var fov = 60 * Math.PI / 180;
var numRays = Math.ceil(screenWidth / stripWidth);
var fovHalf = fov / 2;
var viewDist = (screenWidth / 2) / Math.tan((fov / 2));
var twoPI = Math.PI * 2;


// Global Player Variables
var player = {
    // Set player x,y
    x : 16,
    y : 10,
    // Set direction
    dir : 0,
    // Set current angle of rotation
    rot : 0,
    // Is the player moving...
    // Forward (speed = 1)
    // Backward (speed = -1)
    speed : 0,
    // How far (in map units) does the player move while in motion
    moveSpeed : 0.18,
    // How much does the player rotate?
    rotSpeed : 6 * Math.PI / 180
}

// ********************************************************
// init()
// Called: In HTML body tag
// ********************************************************
function init() {
    // Sets the map width to the length of the first array set (x-axis)
    // Sets the map height to the length of total arrays (y-axis)
    mapWidth = map_one[0].length;
    mapHeight = map_one.length;

    // Set input keys
    bindKeys();
    
    // Draw the minimap
    drawMiniMap();
    
    // Begin game loop
    gameCycle();
};


// ********************************************************
// bindKeys()
// Called: init()
// ********************************************************
function bindKeys() {
    // Key is pressed down
    document.onkeydown = function(e) {
        e = e || window.event;

        // Check to see which key is pressed
        switch (e.keyCode) {
            // Up
            case 38:
                player.speed = 1;
                break;
            // Down
            case 40:
                player.speed = -1;
                break;
            // Left (Direction Left)
            case 37:
                player.dir = -1;
                break;
            // Right (Direction Right)
            case 39:
                player.dir = 1;
                break;
        }
    }
    
    // Key is released
    document.onkeyup = function(e) {
        e = e || window.event;

        // Check to see which key is released
        switch (e.keyCode) {
            // Up or Down
            // Set speed to 0
            case 38:
            case 40:
                player.speed = 0;
                break;
            // Left or Right
            // Set direction to 0
            case 37:
            case 39:
                player.dir = 0;
                break;
        }
    }
};

// ********************************************************
// drawMiniMap()
// Called: init()
// ********************************************************
function drawMiniMap() {
    // Grab the css divs on the html
    var mini_map = $("mini_map");
    var mini_map_container = $("mini_map_container");
    var mini_map_objects = $("mini_map_objects");

    // Set width/height
    mini_map.width = mapWidth * miniMapScale;
    mini_map.height = mapHeight * miniMapScale;
    mini_map_objects.width = mini_map.width;
    mini_map_objects.height = mini_map.height;
    
    // Resize the canvas css dimensions
    var w = (mapWidth * miniMapScale) + "px";
    mini_map.style.width = w;
    mini_map_objects.style.width = w;
    mini_map_container.style.width = w;

    var h = (mapHeight * miniMapScale) + "px";
    mini_map.style.height = h;
    mini_map_objects.style.height = h;
    mini_map_container.style.height = h;

    // Set canvas context to 2d
    var ctx = mini_map.getContext("2d");

    // Loop through all the blocks on the map
    for (var y=0; y<mapHeight; y++) {
        for (var x=0; x<mapWidth; x++) {
            var wall = map_one[y][x];

            // If there is a wall block at this (x,y)...
            if (wall > 0) {
                ctx.fillStyle = "rgb(200,200,200)";
                ctx.fillRect(
                    x * miniMapScale,
                    y * miniMapScale,
                    miniMapScale,miniMapScale
                );
            }
        }
    }
    updateMiniMap();
};

// ********************************************************
// gameCycle()
// Called: init()
// ********************************************************
function gameCycle() {
    move();
    updateMiniMap();
    // 30 fps
    setTimeout(gameCycle, 1000/30); 
};


// ********************************************************
// move()
// Called: gameCycle()
// ********************************************************
function move() {
    // Player will move this far alone the current direction vector
    var moveStep = player.speed * player.moveSpeed;

    // Add rotation if player is rotation (player.dir != 0)
    player.rot += player.dir * player.rotSpeed * Math.PI / 180;

    // Calculate new player position with trig
    var newX = player.x + Math.cos(player.rot) * moveStep;
    var newY = player.y + Math.sin(player.rot) * moveStep;

    // Check to see if there is a collision
    // If so, do NOT update the new coordinates
    if (!(isBlocking(newX, newY))) {
        player.x = newX;
        player.y = newY;
    }
};

// ********************************************************
// isBlocking(x,y)
// Called: move()
// ********************************************************
function isBlocking(x,y) {
    // Ensure we are in boundaries of the level
    if (y < 0 || y > mapHeight || x < 0 || x > mapWidth) {
        return true;
    }

    // Return true if the map block is NOT 0.
    return (map_one[Math.floor(y)][Math.floor(x)] !== 0);
}

// ********************************************************
// updateMiniMap()
// Called: gameCycle(), drawMiniMap
// ********************************************************
function updateMiniMap () {
    // Grab css div / canvas objects
    var mini_map = $("mini_map");
    var mini_map_objects = $("mini_map_objects");

    // Set 2d canvas context
    var objectCtx = mini_map_objects.getContext("2d");
    objectCtx.clearRect(0, 0, mini_map.width, mini_map.height);

    // Draw a dot at the current pos of player
    objectCtx.fillRect(
        player.x * miniMapScale - 2,
        player.y * miniMapScale -2,
        4, 4
    );

    objectCtx.beginPath();
    objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
    objectCtx.lineTo(
        (player.x + Math.cos(player.rot) * 4) * miniMapScale,
        (player.y + Math.sin(player.rot) * 4) * miniMapScale
    );
    objectCtx.closePath();
    objectCtx.stroke();
}

// Set delay on init function
setTimeout(init, 1);
