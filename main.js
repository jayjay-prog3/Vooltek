// Get the canvas and create Babylon engine
const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- CAMERA ---
const camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 5, -10), scene);
camera.attachControl(canvas, true);            // mouse look
camera.speed = 0.5;                             // movement speed
camera.angularSensibility = 500;               // mouse sensitivity
camera.applyGravity = true;                     // simulate gravity
camera.ellipsoid = new BABYLON.Vector3(1, 2, 1); // player size

// --- LIGHT ---
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

// --- GROUND ---
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
ground.checkCollisions = true;

// Enable collisions for camera
scene.gravity = new BABYLON.Vector3(0, -0.98, 0);
scene.collisionsEnabled = true;
camera.checkCollisions = true;

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
