// --- SETUP ---
const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- CAMERA ---
const camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 5, -10), scene);
camera.attachControl(canvas, true);
camera.speed = 0; // camera movement handled by player mesh
camera.angularSensibility = 500; // tweak sensitivity if needed
camera.inertia = 0; //instant stop when mouse stops like roblox
camera.applyGravity = false; // manual gravity
camera.ellipsoid = new BABYLON.Vector3(1, 2, 1);
camera.checkCollisions = true;

//Player Body
const playerheight = 2.5;
const playerwidth = 1;

const playerMesh = BABYLON.MeshBuilder.CreateBox("player", {
    height: playerheight, 
    width: playerwidth, 
    depth: playerwidth
}, scene);

playerMesh.position = new BABYLON.Vector3(0, playerheight/2, 0); // sit on ground
playerMesh.checkCollisions = true;

//camera attach to player
camera.parent = playerMesh;
camera.position = new BABYLON.Vector3(0, playerheight - 0.5, 0); // eye level

//cam zoom
let zoomDistance = 0; // 0 = first person, >0 = third person
const MIN_ZOOM = 0; // cant zoom inside player
const MAX_ZOOM = 15; // max zoom out
const ZOOM_SPEED = 0.3; // zoom speed

window.addEventListener("wheel", (event) => {
    zoomDistance += event.deltaY * 0.01; // scroll wheel imput
    if (zoomDistance < MIN_ZOOM) zoomDistance = MIN_ZOOM;
    if (zoomDistance > MAX_ZOOM) zoomDistance = MAX_ZOOM;
    camera.position.z = -zoomDistance; // move cam forward/back relitive to player
});

//prevent camera clipping through walls
scene.registerBeforeRender(() => {
    const ray = new BABYLON.Ray(playerMesh.position, camera.position.subtract(playerMesh.position).normalize(), zoomDistance);
    const hit = scene.pickWithRay(ray, (mesh) => mesh !== playerMesh);
    if (hit && hit.distance < zoomDistance) {
        camera.position.z = -hit.distance + 0.5; // offset to prevent clipping
    } else {
        camera.position.z = -zoomDistance;
    }
});

// --- LIGHT ---
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

//skybox
const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
skyboxMaterial.backFaceCulling = false;
skyboxMaterial.disableLighting = true;
skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
skybox.material = skyboxMaterial;

// --- GROUND ---
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
ground.checkCollisions = true;

//movement tracking
const keysDown = {};
window.addEventListener("keydown", (e) => { keysDown[e.key] = true; });
window.addEventListener("keyup", (e) => { keysDown[e.key] = false; });

const moveSpeed = 0.15;

// --- MOVEMENT ---
camera.keysUp.push(87);    
camera.keysDown.push(83);  
camera.keysLeft.push(65);  
camera.keysRight.push(68); 

// --- GRAVITY + JUMP ---
let verticalVelocity = 0;
const JUMP_FORCE = 0.35;
const GRAVITY = -0.02;
const GROUND_Y = 2.5; // camera Y when standing

let jumpPressed = false;

// Track jump hold
window.addEventListener("keydown", (e) => { if(e.code === "Space") jumpPressed = true; });
window.addEventListener("keyup", (e) => { if(e.code === "Space") jumpPressed = false; });

// --- POINTER LOCK ---
canvas.addEventListener("click", () => {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    if (canvas.requestPointerLock) canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
    console.log(document.pointerLockElement === canvas ? "Pointer locked!" : "Pointer unlocked!");
});

// Toggle pointer lock with 'V'
window.addEventListener("keydown", (e) => {
    if(e.code === "KeyV"){
        if(document.pointerLockElement === canvas) document.exitPointerLock();
        else canvas.requestPointerLock();
    }
});

// --- FAKE LOADING SCREEN ---
const totalAssets = 5;
let loadedAssets = 0;

for (let i=0; i<totalAssets; i++){
    setTimeout(()=>{
        const box = BABYLON.MeshBuilder.CreateBox(`box${i}`, { size:1 }, scene);
        box.position = new BABYLON.Vector3(Math.random()*10-5, 1, Math.random()*10-5);
        box.checkCollisions = true;

        loadedAssets++;
        document.getElementById("progressBar").style.width = (loadedAssets/totalAssets*100) + "%";

        if(loadedAssets === totalAssets){
            document.getElementById("loadingScreen").style.display = "none";
        }
    }, i*300);
}

// --- RENDER LOOP ---
engine.runRenderLoop(() => {
    // Jump hold logic
    if(jumpPressed && camera.position.y <= GROUND_Y + 0.1){
        verticalVelocity = JUMP_FORCE;
    }

    // Gravity
    verticalVelocity += GRAVITY;
    camera.position.y += verticalVelocity;

    // Ground collision
    if(camera.position.y < GROUND_Y){
        camera.position.y = GROUND_Y;
        verticalVelocity = 0;
    }

    scene.render();
});

// Resize
window.addEventListener("resize", () => engine.resize());
