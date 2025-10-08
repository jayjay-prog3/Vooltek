// --- SETUP ---
const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- PLAYER ---
const playerHeight = 2.5;
const playerWidth = 1;
const playerMesh = BABYLON.MeshBuilder.CreateBox("player", {
    height: playerHeight,
    width: playerWidth,
    depth: playerWidth
}, scene);
playerMesh.position = new BABYLON.Vector3(0, playerHeight / 2, 0);
playerMesh.checkCollisions = true;

// --- CAMERA ---
const camera = new BABYLON.FreeCamera("playerCamera", playerMesh.position.add(new BABYLON.Vector3(0, playerHeight - 0.5, 0)), scene);
camera.attachControl(canvas, true);
camera.speed = 0;
camera.inertia = 0;
camera.angularSensibility = 500;
camera.applyGravity = false;
camera.ellipsoid = new BABYLON.Vector3(1, 2, 1);
camera.checkCollisions = true;

// Camera offset
let zoomDistance = 5; // default third-person
const MIN_ZOOM = 0;   // first-person
const MAX_ZOOM = 15;  // max third-person

window.addEventListener("wheel", (e) => {
    zoomDistance += e.deltaY * 0.01;
    zoomDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDistance));
});

// --- LIGHT ---
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0,1,0), scene);

// --- SKYBOX ---
const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
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
const GROUND_Y = playerHeight / 2;
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
    let moveVec = BABYLON.Vector3.Zero();

    // Calculate movement relative to camera
    const forward = new BABYLON.Vector3(Math.sin(camera.rotation.y), 0, Math.cos(camera.rotation.y));
    const right = new BABYLON.Vector3(Math.sin(camera.rotation.y + Math.PI/2), 0, Math.cos(camera.rotation.y + Math.PI/2));

    if(keysDown['w']) moveVec.addInPlace(forward);
    if(keysDown['s']) moveVec.subtractInPlace(forward);
    if(keysDown['a']) moveVec.subtractInPlace(right);
    if(keysDown['d']) moveVec.addInPlace(right);

    if(moveVec.length() > 0){
        moveVec.normalize();
        moveVec.scaleInPlace(moveSpeed);

        // Rotate player toward movement direction
        const desiredRotationY = Math.atan2(moveVec.x, moveVec.z);
        playerMesh.rotation.y = BABYLON.Scalar.LerpAngle(playerMesh.rotation.y, desiredRotationY, 0.3);

        playerMesh.moveWithCollisions(moveVec);
    }

    // Jump + gravity
    if(jumpPressed && playerMesh.position.y <= GROUND_Y + 0.01) verticalVelocity = JUMP_FORCE;
    verticalVelocity += GRAVITY;
    playerMesh.moveWithCollisions(new BABYLON.Vector3(0, verticalVelocity, 0));
    if(playerMesh.position.y < GROUND_Y){
        playerMesh.position.y = GROUND_Y;
        verticalVelocity = 0;
    }

    // --- CAMERA ---
    const eyeLevel = new BABYLON.Vector3(0, playerHeight - 0.5, 0);

    if(zoomDistance <= MIN_ZOOM + 0.01){
        // FIRST PERSON
        camera.position = playerMesh.position.add(eyeLevel);
        playerMesh.isVisible = false;
    } else {
        // THIRD PERSON (locked-axis behind player)
        playerMesh.isVisible = true;
        const desiredPos = playerMesh.position
            .add(eyeLevel)
            .add(new BABYLON.Vector3(
                Math.sin(playerMesh.rotation.y) * -zoomDistance,
                0,
                Math.cos(playerMesh.rotation.y) * -zoomDistance
            ));
        camera.position = BABYLON.Vector3.Lerp(camera.position, desiredPos, 0.2);
    }

    scene.render();
});

// --- RESIZE ---
window.addEventListener("resize", () => engine.resize());
