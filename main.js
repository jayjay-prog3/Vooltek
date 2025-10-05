const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- CAMERA ---
const camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 5, -10), scene);
camera.attachControl(canvas, true);
camera.speed = 0.45; // movement speed
camera.angularSensibility = 1000; // tweak sensitivity if needed
camera.inertia = 0; //instant stop when mouse stops like roblox
camera.applyGravity = false; // manual gravity
camera.ellipsoid = new BABYLON.Vector3(1, 2, 1);
camera.checkCollisions = true;

// --- LIGHT ---
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

// --- GROUND ---
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
ground.checkCollisions = true;

// --- MOVEMENT ---
camera.keysUp.push(87);    
camera.keysDown.push(83);  
camera.keysLeft.push(65);  
camera.keysRight.push(68); 

// --- GRAVITY + JUMP ---
let verticalVelocity = 0;
const JUMP_FORCE = 0.35;
const GRAVITY = -0.03;
const GROUND_Y = 4; // camera Y when standing

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
