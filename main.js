const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- CAMERA ---
const camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 5, -10), scene);
camera.attachControl(canvas, true);            
camera.speed = 0.5;                            
camera.angularSensibility = 750;               
camera.applyGravity = true;                     
camera.ellipsoid = new BABYLON.Vector3(1, 2, 1); 
camera.checkCollisions = true;

// WASD
camera.keysUp.push(87);    
camera.keysDown.push(83);  
camera.keysLeft.push(65);  
camera.keysRight.push(68); 

// Gravity & collisions
scene.gravity = new BABYLON.Vector3(0, -0.98, 0);
scene.collisionsEnabled = true;

// --- JUMP VARIABLES ---
let verticalVelocity = 0;
const JUMP_IMPULSE = 0.35;
const GRAVITY = -0.02;

// Jump logic
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && camera.isOnGround()) {
        verticalVelocity = JUMP_IMPULSE;
    }
});

// Update camera vertical each frame
scene.onBeforeRenderObservable.add(() => {
    verticalVelocity += GRAVITY;
    camera.position.y += verticalVelocity;

    // Ground collision
    if (camera.position.y < 5) { // adjust 5 to your ground Y + camera height
        camera.position.y = 5;
        verticalVelocity = 0;
    }
});

// --- POINTER LOCK ---
canvas.addEventListener("click", () => {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    if (canvas.requestPointerLock) canvas.requestPointerLock(); 
});

document.addEventListener("pointerlockchange", lockChangeAlert, false);
document.addEventListener("mozpointerlockchange", lockChangeAlert, false);
document.addEventListener("webkitpointerlockchange", lockChangeAlert, false);

function lockChangeAlert() {
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas) {
        console.log("Pointer locked!");
    } else {
        console.log("Pointer unlocked!");
    }
}

// Toggle pointer lock with 'V'
window.addEventListener("keydown", (e) => {
    if (e.code === "KeyV") {
        if (document.pointerLockElement === canvas) {
            document.exitPointerLock();
        } else {
            canvas.requestPointerLock();
        }
    }
});

// --- LIGHT ---
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

// --- GROUND ---
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
ground.checkCollisions = true;

// --- FAKE LOADING SCREEN (works locally) ---
const totalAssets = 5;
let loadedAssets = 0;

for (let i = 0; i < totalAssets; i++) {
    setTimeout(() => {
        const box = BABYLON.MeshBuilder.CreateBox(`box${i}`, { size: 1 }, scene);
        box.position = new BABYLON.Vector3(Math.random() * 10 - 5, 1, Math.random() * 10 - 5);
        box.checkCollisions = true;

        loadedAssets++;
        const progress = (loadedAssets / totalAssets) * 100;
        document.getElementById("progressBar").style.width = progress + "%";

        if (loadedAssets === totalAssets) {
            document.getElementById("loadingScreen").style.display = "none";
            engine.runRenderLoop(() => scene.render());
        }
    }, i * 300); // stagger for effect
}

// Resize engine on window resize
window.addEventListener("resize", () => engine.resize());
