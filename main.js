// --- SETUP ---
const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// --- CAMERA ---
const camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 5, -10), scene);
camera.attachControl(canvas, true);
camera.speed = 0; // camera movement handled by player mesh
camera.angularSensibility = 500; // tweak sensitivity if needed
camera.inertia = 0; // instant stop like Roblox
camera.applyGravity = false; // manual gravity
camera.ellipsoid = new BABYLON.Vector3(1, 2, 1);
camera.checkCollisions = true;

// --- PLAYER BODY ---
const playerheight = 2.5;
const playerwidth = 1;

const playerMesh = BABYLON.MeshBuilder.CreateBox("player", {
    height: playerheight,
    width: playerwidth,
    depth: playerwidth
}, scene);

playerMesh.position = new BABYLON.Vector3(0, playerheight / 2, 0);
playerMesh.checkCollisions = true;

// Attach camera to player
camera.parent = playerMesh;
camera.position = new BABYLON.Vector3(0, playerheight - 0.5, 0);

// --- CAMERA ZOOM ---
let zoomDistance = 5; // default 3rd person distance
const MIN_ZOOM = 0;
const MAX_ZOOM = 15;  // max third-person distance

window.addEventListener("wheel", (event) => {
    zoomDistance += event.deltaY * 0.01;
    zoomDistance = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomDistance));
});

// Adjust camera relative to player
scene.registerBeforeRender(() => {
    const eyeHeight = playerheight - 0.5;

    if (zoomDistance <= MIN_ZOOM) {
        // First person
        camera.position.set(0, eyeHeight, 0);
    } else {
        // Third person
        const back = new BABYLON.Vector3(0, 0, -zoomDistance);
        camera.position.set(back.x, eyeHeight, back.z);
    }

    // Collision check: simple raycast from player to desired zoom
    const ray = new BABYLON.Ray(playerMesh.position.add(new BABYLON.Vector3(0, eyeHeight, 0)),
                                camera.position.subtract(playerMesh.position.add(new BABYLON.Vector3(0, eyeHeight, 0))).normalize(),
                                zoomDistance);

    const hit = scene.pickWithRay(ray, mesh => mesh !== playerMesh);
    if(hit && hit.pickedPoint) {
        const dir = camera.position.subtract(playerMesh.position.add(new BABYLON.Vector3(0, eyeHeight, 0))).normalize();
        camera.position = hit.pickedPoint.subtract(dir.scale(0.3));
    }
});

// --- LIGHT ---
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

// --- SKYBOX ---
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

// --- MOVEMENT ---
const keysDown = {};
window.addEventListener("keydown", (e) => { keysDown[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { keysDown[e.key.toLowerCase()] = false; });

const moveSpeed = 0.15;

// --- GRAVITY + JUMP ---
let verticalVelocity = 0;
const JUMP_FORCE = 0.35;
const GRAVITY = -0.02;
const GROUND_Y = playerheight / 2;
let jumpPressed = false;

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

function loadNextAsset() {
    if (loadedAssets >= totalAssets) {
        document.getElementById("loadingScreen").style.display = "none";
        return;
    }

    const box = BABYLON.MeshBuilder.CreateBox(`box${loadedAssets}`, { size:1 }, scene);
    box.position = new BABYLON.Vector3(Math.random()*10-5, 1, Math.random()*10-5);
    box.checkCollisions = true;

    loadedAssets++;
    document.getElementById("progressBar").style.width = (loadedAssets / totalAssets * 100) + "%";

    setTimeout(loadNextAsset, 300); // next asset
}

loadNextAsset();

// --- RENDER LOOP ---
engine.runRenderLoop(() => {
    // Movement
    const forward = new BABYLON.Vector3(Math.sin(camera.rotation.y), 0, Math.cos(camera.rotation.y));
    const right = new BABYLON.Vector3(Math.sin(camera.rotation.y + Math.PI/2), 0, Math.cos(camera.rotation.y + Math.PI/2));
    let moveVec = BABYLON.Vector3.Zero();

    if (keysDown['w']) moveVec.addInPlace(forward);
    if (keysDown['s']) moveVec.subtractInPlace(forward);
    if (keysDown['a']) moveVec.subtractInPlace(right);
    if (keysDown['d']) moveVec.addInPlace(right);

    if(moveVec.length() > 0){
        moveVec.normalize();
        moveVec.scaleInPlace(moveSpeed);
        playerMesh.moveWithCollisions(moveVec);
    }

    // Jump and gravity
    if(jumpPressed && playerMesh.position.y <= GROUND_Y + 0.01) verticalVelocity = JUMP_FORCE;
    verticalVelocity += GRAVITY;
    playerMesh.moveWithCollisions(new BABYLON.Vector3(0, verticalVelocity, 0));

    if(playerMesh.position.y < GROUND_Y){
        playerMesh.position.y = GROUND_Y;
        verticalVelocity = 0;
    }

    scene.render();
});

// --- RESIZE ---
window.addEventListener("resize", () => engine.resize());
