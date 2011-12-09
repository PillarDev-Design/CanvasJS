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
var dc = function(tag) {
    return document.createElement(tag);
};

// Global Map Variables
var mapWidth = 0;
var mapHeight = 0;
var miniMapScale = 8;

var screenWidth = 320;
var screenHeight = 200;
var stripWidth = 2;
var fov = 60 * Math.PI / 180;
var numRays = Math.ceil(screenWidth / stripWidth);
var fovHalf = fov / 2;
var viewDist = (screenWidth / 2) / Math.tan((fov / 2));
var twoPI = Math.PI * 2;

var numTextures = 4;
var screenStrips = [];

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
    rotSpeed : 6
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
    
    // Initialize the screen
    initScreen();

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
// initScreen()
// Called: init()
// ********************************************************
function initScreen() {
    var screen = $("screen");

    for (var i=0; i < screenWidth; i+=stripWidth) {
        var strip = dc("div");

        strip.style.backgroundColor = "magenta";
        strip.style.height = "0px";
        strip.style.left = i + "px";
        strip.style.overflow = "hidden";
        strip.style.position = "absolute";
        strip.style.width = stripWidth + "px";

        var img = new Image();
        img.src = (window.opera ? "walls_19color.png" : "walls.png");
        img.style.position = "absolute";
        img.style.left = "0px";

        strip.appendChild(img);
        strip.img = img;

        screenStrips.push(strip);
        screen.appendChild(strip);
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

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, mini_map.width, mini_map.height);

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
    
    castRays();

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
};

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
    mini_map_objects.width = mini_map_objects.width;

    // Draw a dot at the current pos of player
    objectCtx.fillStyle = "red";
    objectCtx.fillRect(
        player.x * miniMapScale - 2,
        player.y * miniMapScale -2,
        4, 4
    );

    objectCtx.strokeStyle = "red";
    objectCtx.beginPath();
    objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
    objectCtx.lineTo(
        (player.x + Math.cos(player.rot) * 4) * miniMapScale,
        (player.y + Math.sin(player.rot) * 4) * miniMapScale
    );
    objectCtx.closePath();
    objectCtx.stroke();
};

// ********************************************************
// castRays()
// Called: gameCycle()
// ********************************************************
function castRays() {
    var stripIdx = 0;
    
    for (var i=0; i<numRays; i++) {
        // Determine position of ray
        var rayScreenPos = (-numRays/2 + i) * stripWidth;

        // Distance from viewer to point
        var rayViewDist = Math.sqrt(
            (rayScreenPos * rayScreenPos) +
            (viewDist * viewDist)
            );

        // Angle of ray, relative to viewing direction.
        // a = sin(A) * c
        var rayAngle = Math.asin(rayScreenPos / rayViewDist);

        // Call castSingleRay()
        castSingleRay(
            player.rot + rayAngle,
            stripIdx++
        );
    }
};

// ********************************************************
// castSingleRay()
// Called: castRays()
// ********************************************************
function castSingleRay(rayAngle, stripIdx) {
    // Check to see if the angle is between 0 and 360 degrees.
    rayAngle %= twoPI;
    if (rayAngle < 0) {
        rayAngle += twoPI;
    }
    
    // Check quadrant to determine direction
    var right = (rayAngle > twoPI * 0.75 || rayAngle < twoPI * 0.25);
    var up = (rayAngle < 0 || rayAngle > Math.PI);

    // Only do these once?
    var angleSin = Math.sin(rayAngle);
    var angleCos = Math.cos(rayAngle);

    var dist = 0;
    var xHit = 0;
    var yHit = 0;

    var textureX;
    var wallX;
    var wallY;
    var wallType = 0;

    // Check vertical lines
    var slope = angleSin / angleCos;
    var dX = right ? 1 : -1;
    var dY = dX * slope;

    var x = right ? Math.ceil(player.x) : Math.floor(player.x);
    var y = player.y + (x - player.x) * slope;

    while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        var wallX = Math.floor(x + (right ? 0 : -1));
        var wallY = Math.floor(y);

        if (map_one[wallY][wallX] > 0) {
            var distX = x - player.x;
            var distY = y - player.y;
            dist = (distX * distX) + (distY * distY);

            textureX = y % 1;
            if (!right) {
                textureX = 1 - textureX;
            }

            xHit = x;
            yHit = y;

            break;
        }

        x += dX;
        y += dY;
    }

    // Check horizontal lines
    var slope = angleCos / angleSin;
    var dY = up ? -1 : 1;
    var dX = dY * slope;

    var y = up ? Math.floor(player.y) : Math.ceil(player.y);
    var x = player.x + (y - player.y) * slope;

    while (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        var wallY = Math.floor(y + (up ? -1 : 0));
        var wallX = Math.floor(x);

        if (map_one[wallY][wallX] > 0) {
            var distX = x - player.x;
            var distY = y - player.y;
            var blockDist = (distX * distX) + (distY * distY);

            if (!dist || blockDist < dist) {
                dist = blockDist;
                xHit = x;
                yHit = y;
                textureX = x % 1;
                if (up) {
                    textureX = 1 - textureX;
                }
            }
            break;
        }
        x += dX;
        y += dY;
    }

    if (dist) {
        var strip = screenStrips[stripIdx];
        
        dist = Math.sqrt(dist);
        dist = dist * Math.cos(player.rot - rayAngle);
        
        var height = Math.round(viewDist / dist);
        var width = height * stripWidth;
        var top = Math.round((screenHeight - height) / 2);

        strip.style.height = height + "px";
        strip.style.top = top + "px";

        strip.img.style.height = Math.floor(height * numTextures) + "px";
        strip.img.style.width = Math.floor(width * 2) + "px";
        strip.img.style.top = -Math.floor(height * (wallType - 1)) + "px";

        var texX = Math.round(textureX * width);

        if (texX > width - stripWidth) {
            texX = width - stripWidth;
        }

        strip.img.style.left = -texX + "px";
    }
};

// ********************************************************
// drayRay(rayX, rayY)
// Called: castSingleRay(rayAngle, stripIdx)
// ********************************************************
function drawRay(rayX, rayY) {
    var miniMapObjects = $("mini_map_objects");
    var objectCtx = miniMapObjects.getContext("2d");

    objectCtx.strokeStyle = "rgba(0, 100, 0, 0.3)";
    objectCtx.lineWidth = 0.5;
    
    objectCtx.beginPath();
    objectCtx.moveTo(player.x * miniMapScale, player.y * miniMapScale);
    objectCtx.lineTo(
        rayX * miniMapScale,
        rayY * miniMapScale
        );
    objectCtx.closePath();
    objectCtx.stroke();
};

// Set delay on init function
setTimeout(init, 1);
