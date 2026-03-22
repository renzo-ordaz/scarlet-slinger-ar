import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { Handy } from 'handy.js';

let scene, camera, renderer;
let hand1, hand2;
let vrButton;
let firstHandDetected = false;

// Game State
const shooters = [];
const cartridges = [];
const targets = [];
const activeWebs = [];

const MAX_AMMO = 10;
const SHOOTER_MODES = ['normal', 'grenade', 'wide-net'];
const SHOOTER_COLORS = [0xff2a55, 0xffa500, 0x8a2be2]; // colors mapped to modes

const handState = {
    left: { pinching: false, fire: false, mode: false },
    right: { pinching: false, fire: false, mode: false }
};

init();

function init() {
    setupScene();
    setupEnvironment();
    setupWebXR();
    setupUI();
    renderer.setAnimationLoop(animate);
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 1.6, 3); // Default view without VR

    // Lights
    const hemiLight = new THREE.HemisphereLight(0x808080, 0x606060, 1.5);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 5, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;

    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
}

function setupEnvironment() {
    // 1. Floor
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. Desk
    const deskY = 0.8;
    const deskZ = -1.0;
    const desk = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.1, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x5a3a22 })
    );
    desk.position.set(0, deskY, deskZ);
    desk.receiveShadow = true;
    desk.castShadow = true;
    scene.add(desk);

    const deskTop = deskY + 0.05;

    // 3. Shooters (2)
    const shooterGeo = new THREE.BoxGeometry(0.06, 0.04, 0.12);
    for (let i = 0; i < 2; i++) {
        const material = new THREE.MeshStandardMaterial({ color: SHOOTER_COLORS[0] });
        const mesh = new THREE.Mesh(shooterGeo, material);
        mesh.position.set(i === 0 ? -0.2 : 0.2, deskTop + 0.02, deskZ + 0.1);
        mesh.castShadow = true;
        scene.add(mesh);
        
        shooters.push({
            mesh,
            ammo: MAX_AMMO,
            modeIndex: 0,
            isEquipped: false,
            equippedToHand: null
        });
    }

    // 4. Cartridges (~3)
    const cartGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 12);
    const cartMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    for (let i = 0; i < 3; i++) {
        const mesh = new THREE.Mesh(cartGeo, cartMat);
        mesh.position.set(-0.3 + i * 0.1, deskTop + 0.03, deskZ - 0.2);
        mesh.rotation.x = Math.PI / 2;
        mesh.castShadow = true;
        scene.add(mesh);
        cartridges.push({ mesh, isGrabbed: false, grabbedByHand: null });
    }

    // 5. Targets (Cans/Cups, ~4)
    const targetGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16);
    const colors = [0xffffff, 0x00aaff, 0xffa500, 0x32cd32];
    for (let i = 0; i < 4; i++) {
        const mesh = new THREE.Mesh(targetGeo, new THREE.MeshStandardMaterial({ color: colors[i] }));
        mesh.position.set(-0.4 + i * 0.26, deskTop + 0.06, deskZ - 0.25);
        mesh.castShadow = true;
        scene.add(mesh);
        targets.push(mesh);
    }
}

function setupWebXR() {
    vrButton = VRButton.createButton(renderer, { optionalFeatures: ['hand-tracking'] });
    vrButton.style.display = 'none';
    document.body.appendChild(vrButton);

    const handModelFactory = new XRHandModelFactory();

    // Setup left hand 0
    hand1 = renderer.xr.getHand(0);
    hand1.add(handModelFactory.createHandModel(hand1, 'mesh'));
    scene.add(hand1);
    Handy.makeHandy(hand1);

    // Setup right hand 1
    hand2 = renderer.xr.getHand(1);
    hand2.add(handModelFactory.createHandModel(hand2, 'mesh'));
    scene.add(hand2);
    Handy.makeHandy(hand2);
}

function setupUI() {
    const enterVrBtn = document.getElementById('enter-vr');
    const overlay = document.getElementById('overlay');

    enterVrBtn.addEventListener('click', () => {
        if (vrButton) vrButton.click();
    });

    renderer.xr.addEventListener('sessionstart', () => {
        overlay.style.display = 'none';
        logMessage('WebXR Session Started');
    });

    renderer.xr.addEventListener('sessionend', () => {
        overlay.style.display = 'flex';
        logMessage('WebXR Session Ended');
        firstHandDetected = false;
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function logMessage(msg) {
    const logContainer = document.getElementById('log');
    if (!logContainer) return;

    if (logContainer.children.length > 5) {
        logContainer.removeChild(logContainer.firstChild);
    }

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerText = `>> ${msg}`;
    logContainer.appendChild(entry);
    console.log(`[Scarlet Slinger] ${msg}`);
}

function animate() {
    // Process Hand Logic via Handy.js (Updates inner state)
    Handy.update();
    
    // Process input for both hands
    processHand(hand1);
    processHand(hand2);

    // Update active webs (pulling logic)
    for (let i = activeWebs.length - 1; i >= 0; i--) {
        const web = activeWebs[i];
        
        // Update line geometry points
        const handPos = new THREE.Vector3();
        web.hand.getWorldPosition(handPos);
        const targetPos = new THREE.Vector3();
        web.target.getWorldPosition(targetPos);

        const positions = web.line.geometry.attributes.position.array;
        positions[0] = handPos.x; positions[1] = handPos.y; positions[2] = handPos.z;
        positions[3] = targetPos.x; positions[4] = targetPos.y; positions[5] = targetPos.z;
        web.line.geometry.attributes.position.needsUpdate = true;

        // Pulling behavior
        web.target.position.lerp(handPos, 0.05);

        // Check if pulled close enough
        if (targetPos.distanceTo(handPos) < 0.2) {
            scene.remove(web.line);
            activeWebs.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

function processHand(hand) {
    if (!hand || hand.joints.length === 0) return;
    
    // Basic presence check
    if (!firstHandDetected && hand.children.length > 0) {
        logMessage(`Hands tracking active`);
        firstHandDetected = true;
    }

    const side = hand.handedness || 'unknown'; // left or right provided by XRInputSource
    if (side === 'unknown') return;

    const state = handState[side];

    // ----- POSES -----
    // 1. Pinch for Grabbing
    const wasPinching = state.pinching;
    const isPinching = hand.distanceBetweenJoints('thumb tip', 'index finger tip') < 3;
    state.pinching = isPinching;

    // 2. Fire Pose (Spidey Squeeze: index straight, ring curled, thumb tapped to middle)
    const wasFire = state.fire;
    const isFire = 
        hand.digitIsExtended('index') &&
        hand.distanceBetweenJoints('thumb tip', 'middle finger tip') < 4;
    state.fire = isFire;

    // 3. Mode Switch (Fist / Peace Sign etc. - let's use a fist for simplicity)
    const wasMode = state.mode;
    const isMode = 
        hand.digitIsContracted('index') &&
        hand.digitIsContracted('middle') &&
        hand.digitIsContracted('ring') &&
        hand.digitIsContracted('pinky');
    state.mode = isMode;


    // ----- EVENTS -----

    // On Pinch Begin
    if (isPinching && !wasPinching) {
        const handPos = new THREE.Vector3();
        hand.getWorldPosition(handPos);

        // Try to grab a shooter
        const unequippedShooter = shooters.find(s => !s.isEquipped && s.mesh.position.distanceTo(handPos) < 0.15);
        if (unequippedShooter) {
            // Equip shooter to hand wrist
            hand.add(unequippedShooter.mesh);
            unequippedShooter.mesh.position.set(0, 0.05, 0.05); // slightly above wrist
            unequippedShooter.mesh.rotation.set(-Math.PI/4, 0, 0); // rotated slightly forward
            unequippedShooter.isEquipped = true;
            unequippedShooter.equippedToHand = hand;
            logMessage(`${side} hand: shooter equipped`);
        } else {
            // Try to grab a cartridge
            const emptyCart = cartridges.find(c => !c.isGrabbed && c.mesh.position.distanceTo(handPos) < 0.1);
            if (emptyCart) {
                hand.add(emptyCart.mesh);
                emptyCart.mesh.position.set(0, 0.02, 0); // right in pinch center
                emptyCart.isGrabbed = true;
                emptyCart.grabbedByHand = hand;
            }
        }
    }

    // On Pinch Release
    if (!isPinching && wasPinching) {
        // Did we release a cartridge near an armed shooter? Reload!
        const heldCart = cartridges.find(c => c.isGrabbed && c.grabbedByHand === hand);
        if (heldCart) {
            const heldPos = new THREE.Vector3();
            heldCart.mesh.getWorldPosition(heldPos);

            // Check if near another hand's equipped shooter
            const targetShooter = shooters.find(s => s.isEquipped && s.equippedToHand !== hand);
            if (targetShooter) {
                const shooterPos = new THREE.Vector3();
                targetShooter.mesh.getWorldPosition(shooterPos);

                if (heldPos.distanceTo(shooterPos) < 0.2) {
                    targetShooter.ammo = MAX_AMMO;
                    logMessage(`${targetShooter.equippedToHand.handedness || 'other'} shooter: reloaded`);
                    // Destroy cartridge for Phase 1
                    try { heldCart.mesh.parent.remove(heldCart.mesh); } catch(e){}
                    heldCart.mesh.geometry.dispose();
                    cartridges.splice(cartridges.indexOf(heldCart), 1);
                }
            } else {
                // Just drop it to desk
                scene.add(heldCart.mesh);
                heldCart.mesh.position.copy(heldPos);
                heldCart.isGrabbed = false;
                heldCart.grabbedByHand = null;
                // prevent sinking through desk
                heldCart.mesh.position.y = Math.max(0.85, heldCart.mesh.position.y);
            }
        }
    }

    // On Mode Switch Begin
    if (isMode && !wasMode) {
        const equippedShooter = shooters.find(s => s.equippedToHand === hand);
        if (equippedShooter) {
            equippedShooter.modeIndex = (equippedShooter.modeIndex + 1) % SHOOTER_MODES.length;
            const modeName = SHOOTER_MODES[equippedShooter.modeIndex];
            
            // Visual indicator: change mesh color
            equippedShooter.mesh.material.color.setHex(SHOOTER_COLORS[equippedShooter.modeIndex]);
            logMessage(`${side} shooter: mode switched to '${modeName}'`);
        }
    }

    // On Fire Pose Begin
    if (isFire && !wasFire) {
        const equippedShooter = shooters.find(s => s.equippedToHand === hand);
        
        if (equippedShooter) {
            if (equippedShooter.ammo > 0) {
                // Raycast forward from hand to find a target.
                const origin = new THREE.Vector3();
                equippedShooter.mesh.getWorldPosition(origin);

                // Hand Z goes slightly upward when wrist faces forward. Usually hand.getWorldDirection gets relative orientation.
                const direction = new THREE.Vector3(0, 0, -1);
                direction.applyQuaternion(hand.quaternion).normalize();

                const raycaster = new THREE.Raycaster(origin, direction);
                const intersects = raycaster.intersectObjects(targets);

                if (intersects.length > 0) {
                    const hitTarget = intersects[0].object;
                    
                    // Create Web line
                    const lineGeo = new THREE.BufferGeometry().setFromPoints([origin, origin]);
                    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
                    const line = new THREE.Line(lineGeo, lineMat);
                    scene.add(line);

                    activeWebs.push({
                        hand: hand,
                        target: hitTarget,
                        line: line,
                        createdAt: performance.now()
                    });

                    equippedShooter.ammo--;
                    logMessage(`${side} hand: FIRE pose detected. Ammo ${equippedShooter.ammo}/${MAX_AMMO}`);
                }
            } else {
                // Flash red for empty ammo!
                equippedShooter.mesh.material.color.setHex(0xff0000);
                setTimeout(() => {
                    equippedShooter.mesh.material.color.setHex(SHOOTER_COLORS[equippedShooter.modeIndex]);
                }, 200);
                logMessage(`${side} shooter: ammo 0 - reload required`);
            }
        }
    }
}
