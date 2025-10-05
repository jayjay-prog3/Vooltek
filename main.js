// --- SETUP ---
const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- CAMERA ---
const camera = new BABYLON.ArcRotateCamera("playerCamera", Math.PI / 2, Math.PI / 3, 5, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 0.1; // first-person
camera.upperRadiusLimit = 15;  // max third-person
camera.wheelDeltaPercentage = 0.01;
camera.checkCollisions = true;
camera.collisionRadius = new BABYLON.Vector3(1, 2, 1);

// --- PLAYER BODY ---
const playerHeight = 2.5;
const playerWidth = 1;
const playerMesh = BABYLON.MeshBuilder.CreateBox("player", {
    height: playerHeight,
    width: playerWidth,
    depth: playerWidth
}, scene);
playerMesh.position = new BABYLON.Vector3(0, playerHeight/2, 0);
playerMesh.checkCollisions = true;

// --- CAMERA PARENT ---
camera.lockedTarget = playerMesh;
camera.radius = 5; // default third-person distance
let zoomDistance = camera.radius;

// --- LIGHT ---
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

// --- SKYBOX ---
const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
skyboxMaterial.backFaceCulling = false;
skyboxMaterial.disableLighting = true;
skyboxMaterial.diffuseColor = new BABYLON.Color3(0,0,0);
skyboxMaterial.specularColor = new BABYLON.Color3(0,0,0);
skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
skybox.material = skyboxMaterial;

// --- GROUND ---
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
ground.checkCollisions = true;

// --- MOVEMENT ---
const keysDown = {};
window.addEventListener("keydown", (e) => { keysDown[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { keysDown[e.key.toLowerCase()] = false; });

const moveSpeed = 0.15;

// --- GRAVITY + JUMP ---
let verticalVelocity = 0;
const JUMP_FORCE = 0.35;
const GRAVITY = -0.02;
let jumpPressed = false;

window.addEventListener("keydown", (e) => { if(e.code === "Space") jumpPressed = true; });
window.addEventListener("keyup", (e) => { if(e.code === "Space") jumpPressed = false; });

// --- POINTER LOCK ---
canvas.addEventListener("click", () => {
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    if(canvas.requestPointerLock) canvas.requestPointerLock();
});
document.addEventListener("pointerlockchange", () => {
    console.log(document.pointerLockElement === canvas ? "Pointer locked!" : "Pointer unlocked!");
});
window.addEventListener("keydown", (e) => {
    if(e.code === "KeyV") {
        if(document.pointerLockElement === canvas) document.exitPointerLock();
        else canvas.requestPointerLock();
    }
});

// --- FAKE LOADING SCREEN ---
const totalAssets = 5;
let loadedAssets = 0;

for(let i=0; i<totalAssets; i++){
    setTimeout(() => {
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
    // Movement relative to camera
    const forward = new BABYLON.Vector3(Math.sin(camera.alpha), 0, Math.cos(camera.alpha));
    const right = new BABYLON.Vector3(Math.sin(camera.alpha + Math.PI/2), 0, Math.cos(camera.alpha + Math.PI/2));
    let moveVec = BABYLON.Vector3.Zero();

    if(keysDown['w']) moveVec.addInPlace(forward);
    if(keysDown['s']) moveVec.subtractInPlace(forward);
    if(keysDown['a']) moveVec.subtractInPlace(right);
    if(keysDown['d']) moveVec.addInPlace(right);

    if(moveVec.length() > 0){
        moveVec.normalize();
        moveVec.scaleInPlace(moveSpeed);
        playerMesh.moveWithCollisions(moveVec);

        // Smooth rotation toward movement
        const targetRotation = Math.atan2(moveVec.x, moveVec.z);
        const currentRotation = playerMesh.rotation.y;
        playerMesh.rotation.y = currentRotation + (targetRotation - currentRotation) * 0.2;
    }

    // Jump & gravity
    if(jumpPressed && playerMesh.position.y <= playerHeight/2 + 0.01) verticalVelocity = JUMP_FORCE;
    verticalVelocity += GRAVITY;
    playerMesh.moveWithCollisions(new BABYLON.Vector3(0, verticalVelocity, 0));
    if(playerMesh.position.y < playerHeight/2){
        playerMesh.position.y = playerHeight/2;
        verticalVelocity = 0;
    }

    // First-person check
    if(zoomDistance <= 0.1){
        camera.radius = 0.01; // inside head
    } else {
        camera.radius = zoomDistance;
    }

    scene.render();
});

// --- CAMERA ZOOM ---
window.addEventListener("wheel", (e) => {
    zoomDistance += e.deltaY*0.01;
    zoomDistance = Math.max(0, Math.min(15, zoomDistance));
});

// --- RESIZE ---
window.addEventListener("resize", () => engine.resize());
