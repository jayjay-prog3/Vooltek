// Get the canvas and create Babylon engine
const JUMP_IMPULSE = 0.35; // Upward impulse for jumping

const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- CAMERA ---
const camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 5, -10), scene);
camera.attachControl(canvas, true);            // mouse look
camera.speed = 0.5;                             // movement speed
camera.angularSensibility = 750;               // mouse sensitivity
camera.applyGravity = true;                     // simulate gravity
camera.ellipsoid = new BABYLON.Vector3(1, 2, 1); // player size
camera.checkCollisions = true;

// set wasd movement
camera.keysUp.push(87);    // W
camera.keysDown.push(83);  // S
camera.keysLeft.push(65);  // A
camera.keysRight.push(68); // D

//ground collision and gravity
scene.gravity = new BABYLON.Vector3(0, -0.98, 0);
scene.collisionsEnabled = true;

//jump var
let verticalVelocity = 0;
const JUMP_IMPULSE = 0.35; // Upward impulse for jumping
const GRAVITY = -0.02;     // Gravity effect

//jump logic
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && camera.isOnGround()) {
        verticalVelocity = JUMP_IMPULSE;
    }
});

//update camera position each frame
scene.OnBeforeRenderObservable.add(() => {
    verticalVelocity += Gravity; // Apply gravity
    camera.position.y += verticalVelocity; // move cam vertically

    //ground collision
    if (camera.position.y < 5) { // ground Y and cam height
        camera.position.y = 5;
        verticalVelocity = 0;
    }
});

//pointer lock
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
        console.log("The pointer is now locked!");
    } else {
        console.log("The pointer is now unlocked!");
    }
}

//toggle
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

// --- ASSETS MANAGER (loading screen logic) ---
const assetsManager = new BABYLON.AssetsManager(scene);

// Example assets: 5 simple boxes that "load" so progress bar moves
for (let i = 0; i < 5; i++) {
    const boxTask = assetsManager.addMeshTask(`boxTask${i}`, "", "", ""); // empty mesh task
    boxTask.onSuccess = function (task) {
        const box = BABYLON.MeshBuilder.CreateBox(task.name, { size: 1 }, scene);
        box.position = new BABYLON.Vector3(Math.random() * 10 - 5, 1, Math.random() * 10 - 5);
    };
}

// Update progress bar
assetsManager.onProgress = function (remainingCount, totalCount, lastFinishedTask) {
    const progress = ((totalCount - remainingCount) / totalCount) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
};

// When finished, hide loading screen and start render loop
assetsManager.onFinish = function (tasks) {
    document.getElementById("loadingScreen").style.display = "none";
    engine.runRenderLoop(() => scene.render());
};

// Load all assets
assetsManager.load();

// Resize engine on window resize
window.addEventListener("resize", () => engine.resize());
