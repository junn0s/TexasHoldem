(() => {
    const THREE = window.THREE;
  
    const noopApi = {
      init: () => false,
      resetForNewHand: () => {},
      setTableState: () => {},
      setPlayerState: () => {},
      setTurnTimer: () => {},
      setSkin: () => {},
      throwCard: () => Promise.resolve(),
      throwChips: () => Promise.resolve(),
      cue: () => {},
      playAction: () => {}
    };
  
    if (!THREE) {
      window.Poker3D = noopApi;
      return;
    }
  
    const GLTFLoader = THREE.GLTFLoader || null;
    const SkeletonUtils = THREE.SkeletonUtils || null;
  
    const CARD_SUIT_META = {
      S: { symbol: "♠", color: "#111111" },
      C: { symbol: "♣", color: "#111111" },
      H: { symbol: "♥", color: "#b32d2d" },
      D: { symbol: "♦", color: "#b32d2d" }
    };
  
    const USE_GLTF_AVATARS = false;
    const MODEL_URL = "vendor/three/Soldier.glb";
  
    const COLOR = {
        tableFelt: 0x0f3b25,
        tableFeltDark: 0x082114,
        wood: 0x24150d,
        woodDark: 0x1a0f0a,
        floor: 0x171d23,
        wall: 0x11161b,
        cardBack: 0x2d4f9a,
        cardFront: 0xf2ede2,
        activeRing: 0xe1bf76,
        humanTorso: 0x355e8f,
        botTorso: 0x3b434b,
        skin: 0xd1a17f
      };

      const SKINS = {
        classic: {
          sceneBg: 0x030303,      // 완전 블랙
          fog: 0x030303,
          tableFelt: 0x0f3b25,
          tableFeltDark: 0x082114,
          wood: 0x24150d,
          woodDark: 0x1a0f0a,
          dealerButton: 0xc9a35f,
          spot: 0xffb444,         // 더 진한 노란 텅스텐 핀 조명
          rimLeft: 0x112233,
          rimRight: 0x553311,
          roomFloor: 0x171d23,
          roomWall: 0x11161b,
          roomWood: 0x3d2b20,
          roomBrass: 0xb89253,
          neon: 0x123e63,
          neonEmissive: 0x1f5f8e
        },
        // ... neon과 velvet은 그대로 두셔도 됩니다.
      neon: {
        sceneBg: 0x041222,
        fog: 0x041222,
        tableFelt: 0x167489,
        tableFeltDark: 0x0f4e69,
        wood: 0x1f2d42,
        woodDark: 0x162133,
        dealerButton: 0x84dfff,
        spot: 0xd4f5ff,
        rimLeft: 0x35a2ff,
        rimRight: 0x4cf6c8,
        roomFloor: 0x0f1825,
        roomWall: 0x0a1320,
        roomWood: 0x223550,
        roomBrass: 0x4cb4dc,
        neon: 0x184d8a,
        neonEmissive: 0x32b3f0
      },
      velvet: {
        sceneBg: 0x120b11,
        fog: 0x120b11,
        tableFelt: 0x6a1a3e,
        tableFeltDark: 0x4b102b,
        wood: 0x3a1f18,
        woodDark: 0x2a160f,
        dealerButton: 0xe6c186,
        spot: 0xffe4bf,
        rimLeft: 0x9560a8,
        rimRight: 0xf0b777,
        roomFloor: 0x1b1118,
        roomWall: 0x1a1016,
        roomWood: 0x512f25,
        roomBrass: 0xc28f59,
        neon: 0x512846,
        neonEmissive: 0xb74f8a
      }
    };
  
    const TURN_TIMER_DEFAULT_MS = 30000;
  
    const ctx = {
      initialized: false,
      container: null,
      renderer: null,
      scene: null,
      camera: null,
      clock: null,
      rafId: null,
      time: 0,
      players: [],
      dealer: null,
      communityCards: [],
      dealerButton: null,
      potChipGroup: null,
      potChipCount: 0,
      throwInFlight: 0,
      stageCueTimer: null,
      atmosphere: null,
      seatBodyPositions: [
        new THREE.Vector3(0, 1.45, -4.25),
        new THREE.Vector3(5.1, 1.35, -0.8),
        new THREE.Vector3(0, 1.2, 6.15),
        new THREE.Vector3(-5.1, 1.35, -0.8)
      ],
      seatCardBases: [
        new THREE.Vector3(0, 1.305, -2.72),
        new THREE.Vector3(3.2, 1.305, -0.32),
        new THREE.Vector3(0, 1.305, 3.18),
        new THREE.Vector3(-3.2, 1.305, -0.32)
      ],
      seatCardTilt: [0.02, -0.38, 0.02, 0.38],
      dealerHandOrigin: new THREE.Vector3(0, 1.64, -2.95),
      cameraCurrentPos: new THREE.Vector3(),
      cameraCurrentLook: new THREE.Vector3(),
      cameraTargetPos: new THREE.Vector3(),
      cameraTargetLook: new THREE.Vector3(),
      peekSavedPos: new THREE.Vector3(),
      peekSavedLook: new THREE.Vector3(),
      peekActive: false,
      cameraShakeTime: 0,
      cameraShakeStrength: 0,
      mixers: [],
      modelTemplate: null,
      modelLoading: false,
      textureCache: new Map(),
      actionTextureCache: new Map(),
      skinName: "classic",
      lights: null,
      roomMaterials: null,
      tableMaterials: null,
      defaultCamera: {
        pos: new THREE.Vector3(0.2, 6.18, 10.28),
        look: new THREE.Vector3(0, 1.48, 0.86)
      }
    };
  
    function init({ containerId = "poker3dViewport" } = {}) {
      if (ctx.initialized) return true;
  
      const container = document.getElementById(containerId);
      if (!container) return false;
  
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x030303);
      scene.fog = new THREE.FogExp2(0x030303, 0.055);
  
      const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
      camera.position.copy(ctx.defaultCamera.pos);
      camera.lookAt(ctx.defaultCamera.look);
  
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch (error) {
        console.warn("Poker3D init skipped: WebGL not available.", error);
        return false;
      }
  
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      } else if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.03;
  
      container.appendChild(renderer.domElement);
  
      ctx.container = container;
      ctx.scene = scene;
      ctx.camera = camera;
      ctx.renderer = renderer;
      ctx.clock = new THREE.Clock();
  
      ctx.cameraCurrentPos.copy(ctx.defaultCamera.pos);
      ctx.cameraTargetPos.copy(ctx.defaultCamera.pos);
      ctx.cameraCurrentLook.copy(ctx.defaultCamera.look);
      ctx.cameraTargetLook.copy(ctx.defaultCamera.look);
  
      buildLights();
      buildAtmosphere();
      buildRoom();
      buildTable();
      buildDealer();
      buildPlayers();
      buildCardSets();
      setSkin(ctx.skinName);
      if (USE_GLTF_AVATARS) {
        loadHumanModel();
      }
  
      onResize();
      window.addEventListener("resize", onResize);
  
      ctx.initialized = true;
      animate();
  
      return true;
    }
  
    function buildLights() {
        // 전체 밝기를 0.05로 팍 낮춰서 주변을 암흑으로 만듦
        const hemi = new THREE.HemisphereLight(0x8eb5e5, 0x1d1612, 0.09);
        ctx.scene.add(hemi);

        // 텅스텐 느낌의 따뜻한 노란 핀 조명
        const topSpot = new THREE.SpotLight(0xffb444, 4.8, 50, 0.65, 0.8, 1.2);
        topSpot.position.set(0, 10, 0); // 위치를 중앙 위로 이동
        topSpot.castShadow = true;
        topSpot.shadow.mapSize.width = 1024;
        topSpot.shadow.mapSize.height = 1024;
        topSpot.shadow.bias = -0.0005;
        topSpot.shadow.radius = 4;
        topSpot.shadow.camera.near = 1;
        topSpot.shadow.camera.far = 30;
        topSpot.target.position.set(0, 1, 0);
        ctx.scene.add(topSpot);
        ctx.scene.add(topSpot.target);

        const rimLeft = new THREE.PointLight(0x112233, 3.1, 22);
        rimLeft.position.set(-8, 3, 4);
        ctx.scene.add(rimLeft);

        const rimRight = new THREE.PointLight(0x553311, 2.2, 22);
        rimRight.position.set(8, 4, 4);
        ctx.scene.add(rimRight);

        const barFill = new THREE.PointLight(0xffbf7a, 0.28, 16);
        barFill.position.set(0, 3.4, -9.2);
        ctx.scene.add(barFill);

        ctx.lights = { hemi, topSpot, rimLeft, rimRight, barFill };
    }
  
    function buildAtmosphere() {
      const count = 300;
      const positions = new Float32Array(count * 3);
      const basePositions = new Float32Array(count * 3);
      const phases = new Float32Array(count);
  
      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * 18;
        const y = 1.4 + Math.random() * 6.4;
        const z = (Math.random() - 0.5) * 18;
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        basePositions[i3] = x;
        basePositions[i3 + 1] = y;
        basePositions[i3 + 2] = z;
        phases[i] = Math.random() * Math.PI * 2;
      }
  
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: 0xe8d1aa,
        size: 0.05,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const points = new THREE.Points(geometry, material);
      ctx.scene.add(points);
  
      ctx.atmosphere = {
        points,
        basePositions,
        phases
      };
    }
  
    function buildRoom() {
      const floorMat = new THREE.MeshStandardMaterial({ color: COLOR.floor, roughness: 0.96, metalness: 0.04 });
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(18, 56),
        floorMat
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      ctx.scene.add(floor);
  
      const wallMat = new THREE.MeshStandardMaterial({ color: COLOR.wall, roughness: 0.95, metalness: 0.03 });
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 12),
        wallMat
      );
      backWall.position.set(0, 5.4, -11);
      ctx.scene.add(backWall);
  
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2b20, roughness: 0.72, metalness: 0.12 });
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xb89253, roughness: 0.36, metalness: 0.5 });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xa6d5f4,
        roughness: 0.14,
        metalness: 0.08,
        transparent: true,
        opacity: 0.46
      });
  
      const barCounter = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.36, 1.48), woodMat);
      barCounter.position.set(0, 0.72, -9.65);
      barCounter.castShadow = true;
      barCounter.receiveShadow = true;
      ctx.scene.add(barCounter);
  
      const counterTop = new THREE.Mesh(new THREE.BoxGeometry(11.9, 0.14, 1.64), brassMat);
      counterTop.position.set(0, 1.47, -9.65);
      counterTop.castShadow = true;
      counterTop.receiveShadow = true;
      ctx.scene.add(counterTop);
  
      for (let s = 0; s < 3; s += 1) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 0.54), woodMat);
        shelf.position.set(0, 2.02 + s * 1.02, -10.82);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        ctx.scene.add(shelf);
      }
  
      const bottlePalette = [0x4f7fbd, 0x6e9a57, 0x8a5ab8, 0xae6b3f, 0x3f8a7c];
      for (let row = 0; row < 3; row += 1) {
        for (let i = 0; i < 14; i += 1) {
          const h = 0.26 + (i % 3) * 0.06;
          const bottle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.07, h, 14),
            new THREE.MeshStandardMaterial({
              color: bottlePalette[(row + i) % bottlePalette.length],
              roughness: 0.34,
              metalness: 0.08
            })
          );
          bottle.position.set(-4.55 + i * 0.7, 2.22 + row * 1.02 + h * 0.5, -10.76);
          bottle.castShadow = true;
          bottle.receiveShadow = true;
          ctx.scene.add(bottle);
        }
      }
  
      const neonMat = new THREE.MeshStandardMaterial({
        color: 0x123e63,
        emissive: 0x1f5f8e,
        emissiveIntensity: 0.65,
        roughness: 0.58,
        metalness: 0.08
      });
      const neonPanel = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.12), neonMat);
      neonPanel.position.set(0, 6.95, -10.92);
      ctx.scene.add(neonPanel);
  
      const neonFrame = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.04, 8, 80), brassMat);
      neonFrame.position.set(0, 6.95, -10.9);
      neonFrame.rotation.x = Math.PI / 2;
      ctx.scene.add(neonFrame);
  
      for (let i = -2; i <= 2; i += 1) {
        const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.74, 16), brassMat);
        stoolLeg.position.set(i * 1.5, 0.36, -8.45);
        stoolLeg.castShadow = true;
        ctx.scene.add(stoolLeg);
  
        const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 20), woodMat);
        stoolSeat.position.set(i * 1.5, 0.78, -8.45);
        stoolSeat.castShadow = true;
        stoolSeat.receiveShadow = true;
        ctx.scene.add(stoolSeat);
      }
  
      for (let i = -1; i <= 1; i += 1) {
        const pendantArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8), brassMat);
        pendantArm.position.set(i * 2.8, 8.2, -0.8);
        ctx.scene.add(pendantArm);
  
        const pendantShade = new THREE.Mesh(
          new THREE.ConeGeometry(0.48, 0.7, 20),
          new THREE.MeshStandardMaterial({ color: 0x2c1c12, roughness: 0.62, metalness: 0.14 })
        );
        pendantShade.position.set(i * 2.8, 7.35, -0.8);
        pendantShade.rotation.x = Math.PI;
        pendantShade.castShadow = true;
        ctx.scene.add(pendantShade);
  
        const pendantBulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0xffdc9f, emissive: 0xffc66d, emissiveIntensity: 1.2 })
        );
        pendantBulb.position.set(i * 2.8, 7.06, -0.8);
        ctx.scene.add(pendantBulb);
      }
  
      const sideTable = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.86, 0.5, 24), woodMat);
      sideTable.position.set(6.4, 0.5, 2.2);
      sideTable.castShadow = true;
      sideTable.receiveShadow = true;
      ctx.scene.add(sideTable);
  
      const whiskeyGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.28, 18), glassMat);
      whiskeyGlass.position.set(6.1, 0.9, 2.1);
      ctx.scene.add(whiskeyGlass);
  
      const boothMat = new THREE.MeshStandardMaterial({ color: 0x2a1f22, roughness: 0.84, metalness: 0.08 });
      for (const side of [-1, 1]) {
        const boothBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.65, 1.45), boothMat);
        boothBase.position.set(side * 8.15, 0.36, -3.25);
        boothBase.castShadow = true;
        boothBase.receiveShadow = true;
        ctx.scene.add(boothBase);
  
        const boothBack = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 0.36), boothMat);
        boothBack.position.set(side * 8.15, 0.98, -3.9);
        boothBack.castShadow = true;
        boothBack.receiveShadow = true;
        ctx.scene.add(boothBack);
  
        const boothTable = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.5, 22), woodMat);
        boothTable.position.set(side * 6.75, 0.52, -3.22);
        boothTable.castShadow = true;
        boothTable.receiveShadow = true;
        ctx.scene.add(boothTable);
  
        const boothLamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0xffd9a6, emissive: 0xffc16b, emissiveIntensity: 0.95 })
        );
        boothLamp.position.set(side * 6.75, 1.05, -3.25);
        ctx.scene.add(boothLamp);
      }
  
      for (let i = 0; i < 4; i += 1) {
        const silhouette = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.23, 0.48, 5, 10),
          new THREE.MeshStandardMaterial({ color: 0x1f2630, roughness: 0.85, metalness: 0.05 })
        );
        body.position.y = 0.34;
        body.castShadow = true;
        silhouette.add(body);
  
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0x2a3340, roughness: 0.8, metalness: 0.04 })
        );
        head.position.y = 0.86;
        head.castShadow = true;
        silhouette.add(head);
  
        silhouette.position.set(-3.2 + i * 2.2, 1.52, -8.98 + (i % 2) * 0.25);
        silhouette.rotation.y = Math.PI * (0.2 - i * 0.08);
        ctx.scene.add(silhouette);
      }
  
      for (let i = 0; i < 3; i += 1) {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(1.9, 1.2, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x7a5d3a, roughness: 0.5, metalness: 0.28 })
        );
        frame.position.set(-4.3 + i * 4.3, 4.9, -10.92);
        ctx.scene.add(frame);
  
        const artwork = new THREE.Mesh(
          new THREE.PlaneGeometry(1.55, 0.88),
          new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x30485f : 0x5e3a2f,
            emissive: i % 2 === 0 ? 0x172635 : 0x2a1b14,
            emissiveIntensity: 0.38,
            roughness: 0.7,
            metalness: 0.08
          })
        );
        artwork.position.set(-4.3 + i * 4.3, 4.9, -10.865);
        ctx.scene.add(artwork);
      }
  
      ctx.roomMaterials = {
        floor: floorMat,
        wall: wallMat,
        wood: woodMat,
        brass: brassMat,
        glass: glassMat,
        neon: neonMat
      };
    }
  
    function buildTable() {
      const baseMat = new THREE.MeshStandardMaterial({ color: COLOR.wood, roughness: 0.82, metalness: 0.1 });
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(5.1, 5.45, 0.92, 80),
        baseMat
      );
      base.position.y = 0.72;
      base.castShadow = true;
      base.receiveShadow = true;
      ctx.scene.add(base);
  
      const feltMat = new THREE.MeshStandardMaterial({ color: COLOR.tableFelt, roughness: 0.88, metalness: 0.02 });
      const felt = new THREE.Mesh(
        new THREE.CylinderGeometry(4.44, 4.5, 0.14, 80),
        feltMat
      );
      felt.position.y = 1.2;
      felt.castShadow = true;
      felt.receiveShadow = true;
      ctx.scene.add(felt);
  
      const innerFeltMat = new THREE.MeshStandardMaterial({ color: COLOR.tableFeltDark, roughness: 0.88, metalness: 0.02 });
      const innerFelt = new THREE.Mesh(
        new THREE.CylinderGeometry(3.7, 3.76, 0.025, 80),
        innerFeltMat
      );
      innerFelt.position.y = 1.28;
      innerFelt.receiveShadow = true;
      ctx.scene.add(innerFelt);
  
      const rimMat = new THREE.MeshStandardMaterial({ color: COLOR.woodDark, roughness: 0.45, metalness: 0.15 });
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(4.58, 0.26, 28, 90),
        rimMat
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 1.28;
      rim.castShadow = true;
      ctx.scene.add(rim);
  
      const rimGoldMat = new THREE.MeshStandardMaterial({ color: 0xc9a35f, roughness: 0.25, metalness: 1.0 });
      const rimGold = new THREE.Mesh(
        new THREE.TorusGeometry(4.58, 0.045, 14, 90),
        rimGoldMat
      );
      rimGold.rotation.x = Math.PI / 2;
      rimGold.position.y = 1.355;
      ctx.scene.add(rimGold);
  
      const dealerButtonMat = new THREE.MeshStandardMaterial({ color: 0xead18f, roughness: 0.34, metalness: 0.52 });
      ctx.dealerButton = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.045, 28),
        dealerButtonMat
      );
      ctx.dealerButton.rotation.x = 0;
      ctx.dealerButton.position.set(0.78, 1.352, 2.4);
      ctx.scene.add(ctx.dealerButton);
  
      ctx.potChipGroup = new THREE.Group();
      ctx.scene.add(ctx.potChipGroup);
      ctx.potChipCount = 0;
  
      ctx.tableMaterials = {
        base: baseMat,
        felt: feltMat,
        innerFelt: innerFeltMat,
        rim: rimMat,
        rimGold: rimGoldMat,
        dealerButton: dealerButtonMat
      };
  
      buildChipStacks();
    }
  
    function setSkin(name = "classic") {
      const resolvedName = Object.prototype.hasOwnProperty.call(SKINS, name) ? name : "classic";
      const skin = SKINS[resolvedName];
      ctx.skinName = resolvedName;
  
      if (ctx.scene) {
        ctx.scene.background = new THREE.Color(skin.sceneBg);
        if (ctx.scene.fog) {
          ctx.scene.fog.color.setHex(skin.fog);
        }
      }
  
      if (ctx.tableMaterials) {
        ctx.tableMaterials.base.color.setHex(skin.wood);
        ctx.tableMaterials.felt.color.setHex(skin.tableFelt);
        ctx.tableMaterials.innerFelt.color.setHex(skin.tableFeltDark);
        ctx.tableMaterials.rim.color.setHex(skin.woodDark);
        ctx.tableMaterials.rimGold.color.setHex(skin.roomBrass);
        ctx.tableMaterials.dealerButton.color.setHex(skin.dealerButton);
      }
  
      if (ctx.roomMaterials) {
        ctx.roomMaterials.floor.color.setHex(skin.roomFloor);
        ctx.roomMaterials.wall.color.setHex(skin.roomWall);
        ctx.roomMaterials.wood.color.setHex(skin.roomWood);
        ctx.roomMaterials.brass.color.setHex(skin.roomBrass);
        ctx.roomMaterials.neon.color.setHex(skin.neon);
        ctx.roomMaterials.neon.emissive.setHex(skin.neonEmissive);
      }
  
      if (ctx.lights) {
        ctx.lights.topSpot.color.setHex(skin.spot);
        ctx.lights.rimLeft.color.setHex(skin.rimLeft);
        ctx.lights.rimRight.color.setHex(skin.rimRight);
        if (ctx.lights.barFill) {
          ctx.lights.barFill.color.setHex(skin.roomBrass);
        }
      }
  
      if (ctx.atmosphere && ctx.atmosphere.points && ctx.atmosphere.points.material) {
        ctx.atmosphere.points.material.color.setHex(skin.spot);
      }
    }
  
    function addChipStack(x, z, count, color = 0xb63a3a, stripe = 0xe7d8c2) {
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.3 });
      const stripeMat = new THREE.MeshStandardMaterial({ color: stripe, roughness: 0.32, metalness: 0.18 });
  
      for (let i = 0; i < count; i += 1) {
        const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.038, 22), bodyMat);
        chip.position.set(x, 1.325 + i * 0.039, z);
        chip.castShadow = true;
        chip.receiveShadow = true;
        ctx.scene.add(chip);
  
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 18), stripeMat);
        ring.position.set(x, chip.position.y + 0.019, z);
        ring.rotation.x = Math.PI / 2;
        ctx.scene.add(ring);
      }
    }
  
    function buildChipStacks() {
      addChipStack(-0.95, 3.22, 8, 0xb63a3a, 0xf5e8d1);
      addChipStack(-0.62, 3.08, 7, 0x2b4f9e, 0xe7e9ee);
      addChipStack(0.82, 3.16, 9, 0x306a41, 0xefe4ce);
      addChipStack(1.14, 3.3, 6, 0x8f5b2e, 0xf0e0c4);
      addChipStack(2.95, 0.08, 8, 0x2b4f9e, 0xf3e5cf);
      addChipStack(-2.95, 0.08, 8, 0xb63a3a, 0xf3e5cf);
      addChipStack(0.02, -2.58, 10, 0x3a6fa7, 0xf0e5cf);
    }
  
    function createSimpleAvatar(isHuman, variant = 0, role = "player") {
      const group = new THREE.Group();
      const materials = [];
  
      const outfitPalette = isHuman
        ? [0x355e8f, 0x2f5d42, 0x5f3d2a, 0x6a4d2e]
        : [0x3b434b, 0x4f3f55, 0x425648, 0x5a4538];
      const jacketColor = role === "dealer" ? 0x262626 : outfitPalette[variant % outfitPalette.length];
      const shirtColor = role === "dealer" ? 0xe9e6dc : 0x20252c;
      const hairColor = [0x2b2118, 0x3d2f22, 0x181818, 0x5d4730][variant % 4];
  
      const jacketMat = new THREE.MeshStandardMaterial({
        color: jacketColor,
        roughness: 0.62,
        metalness: 0.12,
        transparent: true,
        opacity: 1
      });
      const shirtMat = new THREE.MeshStandardMaterial({
        color: shirtColor,
        roughness: 0.74,
        metalness: 0.05,
        transparent: true,
        opacity: 1
      });
      const skinMat = new THREE.MeshStandardMaterial({
        color: isHuman ? 0xd7ab86 : 0xc39472,
        roughness: 0.74,
        metalness: 0.02,
        transparent: true,
        opacity: 1
      });
      const hairMat = new THREE.MeshStandardMaterial({
        color: hairColor,
        roughness: 0.82,
        metalness: 0.02,
        transparent: true,
        opacity: 1
      });
      materials.push(jacketMat, shirtMat, skinMat, hairMat);
  
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.52, 5, 10), jacketMat);
      torso.castShadow = true;
      torso.position.set(0, 0.38, 0.09);
      group.add(torso);
  
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.16), shirtMat);
      shirt.position.set(0, 0.44, 0.26);
      shirt.castShadow = true;
      group.add(shirt);
  
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), skinMat);
      head.castShadow = true;
      head.position.set(0, 0.95, 0.05);
      group.add(head);
  
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), hairMat);
      hair.castShadow = true;
      hair.position.set(0, 1.08, 0.02);
      hair.scale.set(1.1, 0.56, 1.1);
      group.add(hair);
  
      const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 4, 8), jacketMat);
      armL.position.set(-0.3, 0.42, 0.18);
      armL.rotation.z = Math.PI * 0.28;
      group.add(armL);
  
      const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 4, 8), jacketMat);
      armR.position.set(0.3, 0.42, 0.18);
      armR.rotation.z = -Math.PI * 0.28;
      group.add(armR);
  
      const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 4, 8), jacketMat);
      legL.position.set(-0.12, -0.08, 0.02);
      legL.castShadow = true;
      group.add(legL);
  
      const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.36, 4, 8), jacketMat);
      legR.position.set(0.12, -0.08, 0.02);
      legR.castShadow = true;
      group.add(legR);
  
      if (role === "dealer") {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.02), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
        tie.position.set(0, 0.38, 0.35);
        group.add(tie);
      }
  
      return { group, materials, armL, armR };
    }
  
    function buildDealer() {
      const root = new THREE.Group();
      root.position.set(0, 1.45, -5.25);
      root.lookAt(0, 1.4, 0);
  
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 0.84, metalness: 0.1 });
      const chair = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.8), chairMat);
      chair.position.set(0, 0.2, -0.35);
      chair.castShadow = true;
      root.add(chair);
  
      const avatarAnchor = new THREE.Group();
      avatarAnchor.position.set(0, 0, 0.06);
      root.add(avatarAnchor);
  
      const placeholder = createSimpleAvatar(false, 0, "dealer");
      avatarAnchor.add(placeholder.group);
  
      ctx.scene.add(root);
  
      ctx.dealer = {
        root,
        avatarAnchor,
        avatarObject: placeholder.group,
        placeholderArms: [placeholder.armL, placeholder.armR],
        materials: placeholder.materials,
        mixer: null,
        actions: null,
        throwPhase: 0
      };
    }
  
    function buildPlayers() {
      ctx.players = [];
  
      for (let i = 0; i < 4; i += 1) {
        const isHuman = i === 2;
        const root = new THREE.Group();
        const basePos = ctx.seatBodyPositions[i];
        root.position.copy(basePos);
        root.lookAt(0, basePos.y, 0);
  
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 0.84, metalness: 0.1 });
  
        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.2, 1.02), chairMat);
        chairSeat.position.set(0, -0.22, -0.1);
        chairSeat.castShadow = true;
        chairSeat.receiveShadow = true;
        root.add(chairSeat);
  
        const chairBack = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, isHuman ? 0.18 : 1.15, 0.2),
          chairMat
        );
        chairBack.position.set(0, isHuman ? -0.03 : 0.44, -0.56);
        chairBack.castShadow = true;
        root.add(chairBack);
  
        const avatarAnchor = new THREE.Group();
        avatarAnchor.position.set(0, 0, 0.06);
        root.add(avatarAnchor);
  
        const placeholder = createSimpleAvatar(isHuman, i, "player");
        avatarAnchor.add(placeholder.group);
  
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.65, 0.045, 8, 42),
          new THREE.MeshStandardMaterial({
            color: COLOR.activeRing,
            transparent: true,
            opacity: 0,
            emissive: COLOR.activeRing,
            emissiveIntensity: 0.35,
            roughness: 0.35,
            metalness: 0.38
          })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -0.29;
        root.add(ring);
  
        const actionSpriteMaterial = new THREE.SpriteMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: true
        });
        const actionSprite = new THREE.Sprite(actionSpriteMaterial);
        actionSprite.position.set(0, 1.72, 0.15);
        actionSprite.scale.set(1.48, 0.54, 1);
        actionSprite.visible = false;
        root.add(actionSprite);
  
        const timerCanvasPack = createTurnTimerCanvas(256);
        const timerTexture = createCanvasTexture(timerCanvasPack.canvas);
        const timerSpriteMaterial = new THREE.SpriteMaterial({
          map: timerTexture,
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: true
        });
        const timerSprite = new THREE.Sprite(timerSpriteMaterial);
        timerSprite.position.set(0, 2.42, 0.18);
        timerSprite.scale.set(0.72, 0.72, 1);
        timerSprite.visible = false;
        root.add(timerSprite);
  
        ctx.scene.add(root);
  
        ctx.players.push({
          seatIndex: i,
          isHuman,
          root,
          avatarAnchor,
          avatarObject: placeholder.group,
          placeholderArms: [placeholder.armL, placeholder.armR],
          materials: placeholder.materials,
          mixer: null,
          actions: null,
          ring,
          actionSprite,
          timerSprite,
          timerCanvas: timerCanvasPack.canvas,
          timerCanvasCtx: timerCanvasPack.context,
          timerTexture,
          timerVisible: false,
          timerTotalMs: TURN_TIMER_DEFAULT_MS,
          timerLeftMs: 0,
          holeCards: [],
          basePos: basePos.clone(),
          baseY: basePos.y,
          currentY: basePos.y,
          targetY: basePos.y,
          allIn: false,
          active: false,
          folded: false,
          reveal: false,
          actionType: "",
          actionLabel: "",
          actionTone: "",
          actionTimer: 0,
          actionDuration: 0.4,
          actionPower: 0,
          peeking: false,
          fadeCurrent: 1,
          fadeTarget: 1
        });
      }
    }
  
    function rankLabel(rank) {
      if (rank === 14) return "A";
      if (rank === 13) return "K";
      if (rank === 12) return "Q";
      if (rank === 11) return "J";
      return String(rank || "?");
    }
  
    function roundedRectPath(ctx2d, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx2d.beginPath();
      ctx2d.moveTo(x + rr, y);
      ctx2d.arcTo(x + w, y, x + w, y + h, rr);
      ctx2d.arcTo(x + w, y + h, x, y + h, rr);
      ctx2d.arcTo(x, y + h, x, y, rr);
      ctx2d.arcTo(x, y, x + w, y, rr);
      ctx2d.closePath();
    }
  
    function createCanvasTexture(canvas) {
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
      return texture;
    }
  
    function getBackTexture() {
      const key = "back";
      if (ctx.textureCache.has(key)) {
        return ctx.textureCache.get(key);
      }
  
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 356;
      const c = canvas.getContext("2d");
  
      c.fillStyle = "#2f529a";
      c.fillRect(0, 0, canvas.width, canvas.height);
  
      for (let y = 0; y < canvas.height; y += 16) {
        for (let x = 0; x < canvas.width; x += 16) {
          c.fillStyle = (x / 16 + y / 16) % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
          c.fillRect(x, y, 16, 16);
        }
      }
  
      roundedRectPath(c, 8, 8, canvas.width - 16, canvas.height - 16, 18);
      c.lineWidth = 5;
      c.strokeStyle = "rgba(255,255,255,0.26)";
      c.stroke();
  
      const tex = createCanvasTexture(canvas);
      ctx.textureCache.set(key, tex);
      return tex;
    }
  
    function getFrontTexture(card) {
      if (!card || !card.rank || !card.suit) {
        return getBackTexture();
      }
  
      const key = `front-${card.rank}-${card.suit}`;
      if (ctx.textureCache.has(key)) {
        return ctx.textureCache.get(key);
      }
  
      const suitMeta = CARD_SUIT_META[card.suit] || CARD_SUIT_META.S;
      const rank = rankLabel(card.rank);
  
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 356;
      const c = canvas.getContext("2d");
  
      const grad = c.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#f9f6ef");
      grad.addColorStop(1, "#ece7da");
      c.fillStyle = grad;
      c.fillRect(0, 0, canvas.width, canvas.height);
  
      roundedRectPath(c, 6, 6, canvas.width - 12, canvas.height - 12, 18);
      c.lineWidth = 4;
      c.strokeStyle = "#222";
      c.stroke();
  
      c.fillStyle = suitMeta.color;
      c.font = '700 54px "Times New Roman", serif';
      c.textAlign = "left";
      c.textBaseline = "top";
      c.fillText(rank, 24, 16);
  
      c.font = '700 44px "Times New Roman", serif';
      c.fillText(suitMeta.symbol, 24, 70);
  
      c.save();
      c.translate(canvas.width, canvas.height);
      c.rotate(Math.PI);
      c.font = '700 54px "Times New Roman", serif';
      c.fillText(rank, 24, 16);
      c.font = '700 44px "Times New Roman", serif';
      c.fillText(suitMeta.symbol, 24, 70);
      c.restore();
  
      c.font = '700 118px "Times New Roman", serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.globalAlpha = 0.93;
      c.fillText(suitMeta.symbol, canvas.width / 2, canvas.height / 2);
      c.globalAlpha = 1;
  
      const tex = createCanvasTexture(canvas);
      ctx.textureCache.set(key, tex);
      return tex;
    }
  
    function actionToneStyle(tone = "", label = "") {
      const normalizedTone = String(tone || "").toLowerCase();
      const normalizedLabel = String(label || "").toLowerCase();
  
      if (normalizedTone === "danger" || normalizedLabel.includes("fold")) {
        return {
          bgA: "#6b1f27",
          bgB: "#3b1116",
          border: "#e98b8b",
          text: "#ffe2e2"
        };
      }
  
      if (
        normalizedTone === "strong" ||
        normalizedLabel.includes("raise") ||
        normalizedLabel.includes("bet") ||
        normalizedLabel.includes("all-in") ||
        normalizedLabel.includes("won")
      ) {
        return {
          bgA: "#70521c",
          bgB: "#463212",
          border: "#f0ca86",
          text: "#ffe9bc"
        };
      }
  
      return {
        bgA: "#1f4262",
        bgB: "#152d43",
        border: "#98c8f0",
        text: "#ddf0ff"
      };
    }
  
    function getActionBadgeTexture(label, tone = "") {
      const text = String(label || "").trim().toUpperCase();
      const key = `action-${tone}-${text}`;
      if (ctx.actionTextureCache.has(key)) {
        return ctx.actionTextureCache.get(key);
      }
  
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 160;
      const c = canvas.getContext("2d");
      const style = actionToneStyle(tone, text);
  
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.save();
      c.shadowColor = "rgba(0,0,0,0.38)";
      c.shadowBlur = 14;
      c.shadowOffsetY = 4;
  
      const grad = c.createLinearGradient(0, 16, 0, 126);
      grad.addColorStop(0, style.bgA);
      grad.addColorStop(1, style.bgB);
      c.fillStyle = grad;
      roundedRectPath(c, 16, 16, canvas.width - 32, 112, 24);
      c.fill();
      c.restore();
  
      c.lineWidth = 4;
      c.strokeStyle = style.border;
      roundedRectPath(c, 16, 16, canvas.width - 32, 112, 24);
      c.stroke();
  
      c.beginPath();
      c.moveTo(canvas.width / 2 - 18, 128);
      c.lineTo(canvas.width / 2 + 18, 128);
      c.lineTo(canvas.width / 2, 152);
      c.closePath();
      c.fillStyle = style.bgB;
      c.fill();
      c.lineWidth = 3;
      c.strokeStyle = style.border;
      c.stroke();
  
      c.fillStyle = style.text;
      c.font = '700 54px "Rajdhani", sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, canvas.width / 2, 72, canvas.width - 58);
  
      const texture = createCanvasTexture(canvas);
      ctx.actionTextureCache.set(key, texture);
      return texture;
    }
  
    function setEntryActionBadge(entry, label, tone = "") {
      if (!entry || !entry.actionSprite) return;
      const text = String(label || "").trim();
      const material = entry.actionSprite.material;
      if (!material) return;
  
      if (!text) {
        entry.actionSprite.visible = false;
        material.opacity = 0;
        entry.actionLabel = "";
        entry.actionTone = "";
        return;
      }
  
      const changed = entry.actionLabel !== text || entry.actionTone !== tone;
      entry.actionLabel = text;
      entry.actionTone = tone;
      if (changed || !material.map) {
        material.map = getActionBadgeTexture(text, tone);
        material.needsUpdate = true;
      }
      entry.actionSprite.visible = true;
    }
  
    function createTurnTimerCanvas(size = 256) {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      return { canvas, context };
    }
  
    function timerRingColor(ratio) {
      if (ratio > 0.66) return "#63da9c";
      if (ratio > 0.33) return "#f2c76c";
      return "#df6a6a";
    }
  
    function drawTurnTimer(entry) {
      if (!entry || !entry.timerCanvasCtx || !entry.timerTexture) return;
      const c = entry.timerCanvasCtx;
      const canvas = entry.timerCanvas;
      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.36;
      const total = Math.max(1, entry.timerTotalMs || TURN_TIMER_DEFAULT_MS);
      const left = THREE.MathUtils.clamp(entry.timerLeftMs || 0, 0, total);
      const ratio = left / total;
      const angle = -Math.PI / 2 + ratio * Math.PI * 2;
  
      c.clearRect(0, 0, size, size);
  
      c.save();
      c.shadowColor = "rgba(0,0,0,0.46)";
      c.shadowBlur = 14;
      c.shadowOffsetY = 5;
      c.beginPath();
      c.fillStyle = "rgba(10,16,24,0.84)";
      c.arc(cx, cy, radius + 24, 0, Math.PI * 2);
      c.fill();
      c.restore();
  
      c.lineWidth = 12;
      c.strokeStyle = "rgba(142, 174, 206, 0.3)";
      c.beginPath();
      c.arc(cx, cy, radius, 0, Math.PI * 2);
      c.stroke();
  
      c.lineWidth = 14;
      c.strokeStyle = timerRingColor(ratio);
      c.beginPath();
      c.arc(cx, cy, radius, -Math.PI / 2, angle);
      c.stroke();
  
      c.strokeStyle = "rgba(222, 233, 244, 0.5)";
      c.lineWidth = 3;
      for (let i = 0; i < 12; i += 1) {
        const tickA = -Math.PI / 2 + (i / 12) * Math.PI * 2;
        const x1 = cx + Math.cos(tickA) * (radius - 4);
        const y1 = cy + Math.sin(tickA) * (radius - 4);
        const x2 = cx + Math.cos(tickA) * (radius + 6);
        const y2 = cy + Math.sin(tickA) * (radius + 6);
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
      }
  
      c.strokeStyle = "#f4f6f8";
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(angle) * (radius - 20), cy + Math.sin(angle) * (radius - 20));
      c.stroke();
  
      c.fillStyle = "#ecf2f8";
      c.beginPath();
      c.arc(cx, cy, 8, 0, Math.PI * 2);
      c.fill();
  
      c.fillStyle = "#c8d8e9";
      c.font = '700 38px "Rajdhani", sans-serif';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(Math.ceil(left / 1000)), cx, cy + radius + 28);
  
      entry.timerTexture.needsUpdate = true;
    }
  
    function createCardMesh(hidden = true, card = null) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: hidden ? 0.6 : 0.85,
        metalness: 0.02,
        side: THREE.DoubleSide,
        map: hidden ? getBackTexture() : getFrontTexture(card),
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      });
  
      const cardMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.78), material);
      cardMesh.castShadow = true;
      cardMesh.receiveShadow = true;
      cardMesh.rotation.x = -Math.PI / 2;
      return cardMesh;
    }
  
    function applyCardFace(mesh, card, hidden) {
      if (!mesh || !mesh.material) return;
      mesh.material.map = hidden ? getBackTexture() : getFrontTexture(card);
      mesh.material.roughness = hidden ? 0.6 : 0.85;
      mesh.material.needsUpdate = true;
    }
  
    function getSeatCardPosition(seatIndex, cardIndex, peeking = false) {
      if (seatIndex === 2) {
        const xOffset = cardIndex === 0 ? -0.38 : 0.38;
        // Keep peeked cards clearly above the felt/rim to avoid lower-edge clipping.
        const y = peeking ? 1.62 : 1.32;
        const z = peeking ? 4.56 : 4.02;
        return new THREE.Vector3(xOffset, y, z);
      }
  
      const base = ctx.seatCardBases[seatIndex] || new THREE.Vector3(0, 1.305, 0);
  
      if (seatIndex === 1 || seatIndex === 3) {
        const zOffset = cardIndex === 0 ? -0.29 : 0.29;
        return new THREE.Vector3(base.x, base.y, base.z + zOffset);
      }
  
      const xOffset = cardIndex === 0 ? -0.34 : 0.34;
      return new THREE.Vector3(base.x + xOffset, base.y, base.z);
    }
  
    function getSeatCardRotationX(seatIndex, peeking = false) {
      if (seatIndex === 2) {
        // Stay closer to tabletop pitch while peeking so the card bottom does not sink into the table.
        return peeking ? -1.33 : -1.47;
      }
  
      return -Math.PI / 2;
    }
  
    function getSeatCardRotationZ(seatIndex, cardIndex, peeking = false) {
      if (seatIndex === 2) {
        const spread = cardIndex === 0 ? -0.24 : 0.24;
        return peeking ? spread * 1.25 : spread;
      }
  
      const baseTilt = ctx.seatCardTilt[seatIndex] || 0;
      const cardTilt = cardIndex === 0 ? -0.035 : 0.035;
      return baseTilt + cardTilt;
    }
  
    function getCommunityPosition(index) {
      const x = -1.26 + index * 0.63;
      return new THREE.Vector3(x, 1.37, 0.84);
    }
  
    function getCommunityRotationX() {
      return -1.22;
    }
  
    function getSeatChipOrigin(seatIndex) {
      if (seatIndex === 0) return new THREE.Vector3(0, 1.4, -2.95);
      if (seatIndex === 1) return new THREE.Vector3(3.42, 1.4, -0.28);
      if (seatIndex === 2) return new THREE.Vector3(0, 1.4, 4.56);
      if (seatIndex === 3) return new THREE.Vector3(-3.42, 1.4, -0.28);
      return new THREE.Vector3(0, 1.4, 0);
    }
  
    function getPotChipLanding(index = 0) {
      const layer = Math.floor(index / 18);
      const ringIndex = index % 18;
      const angle = (ringIndex / 18) * Math.PI * 2;
      const radius = 0.16 + (ringIndex % 6) * 0.045;
      return new THREE.Vector3(
        Math.cos(angle) * radius * 0.96,
        1.332 + layer * 0.039,
        0.74 + Math.sin(angle) * radius * 0.78
      );
    }
  
    function seatChipStyle(seatIndex) {
      const palette = [
        { body: 0xb63a3a, stripe: 0xf5e8d1 },
        { body: 0x2b4f9e, stripe: 0xe7e9ee },
        { body: 0x306a41, stripe: 0xefe4ce },
        { body: 0x8f5b2e, stripe: 0xf0e0c4 }
      ];
      return palette[(seatIndex + 4) % 4];
    }
  
    function createChipMesh(style) {
      const chip = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.145, 0.145, 0.048, 24),
        new THREE.MeshStandardMaterial({ color: style.body, roughness: 0.33, metalness: 0.28 })
      );
      body.castShadow = true;
      body.receiveShadow = true;
      chip.add(body);
  
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.104, 0.014, 8, 20),
        new THREE.MeshStandardMaterial({ color: style.stripe, roughness: 0.34, metalness: 0.14 })
      );
      ring.position.y = 0.019;
      ring.rotation.x = Math.PI / 2;
      chip.add(ring);
      return chip;
    }
  
    function getDealerButtonPosition(dealerIndex) {
      const fallback = new THREE.Vector3(0.78, 1.352, 2.4);
      if (dealerIndex < 0 || dealerIndex > 3) return fallback;
  
      const base = ctx.seatCardBases[dealerIndex] || fallback;
      if (dealerIndex === 0) return new THREE.Vector3(base.x + 0.86, 1.352, base.z - 0.27);
      if (dealerIndex === 1) return new THREE.Vector3(base.x + 0.44, 1.352, base.z + 0.73);
      if (dealerIndex === 2) return new THREE.Vector3(base.x + 0.92, 1.352, base.z + 0.4);
      return new THREE.Vector3(base.x - 0.44, 1.352, base.z + 0.73);
    }
  
    function buildCardSets() {
      ctx.communityCards = [];
  
      for (let i = 0; i < 5; i += 1) {
        const card = createCardMesh(false);
        card.position.copy(getCommunityPosition(i));
        card.rotation.x = getCommunityRotationX();
        card.scale.setScalar(1.2);
        card.visible = false;
        ctx.scene.add(card);
        ctx.communityCards.push(card);
      }
  
      ctx.players.forEach((entry, seatIndex) => {
        entry.holeCards = [];
        for (let cardIndex = 0; cardIndex < 2; cardIndex += 1) {
          const card = createCardMesh(true);
          card.position.copy(getSeatCardPosition(seatIndex, cardIndex));
          card.rotation.x = getSeatCardRotationX(seatIndex);
          card.rotation.z = getSeatCardRotationZ(seatIndex, cardIndex);
          card.scale.setScalar(entry.isHuman ? 1.08 : 1);
          card.visible = false;
          ctx.scene.add(card);
          entry.holeCards.push(card);
        }
      });
    }
  
    function collectMaterials(root) {
      const matSet = new Set();
      root.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => matSet.add(m));
            } else {
              matSet.add(obj.material);
            }
          }
        }
      });
      return [...matSet];
    }
  
    function pickIdleClip(animations) {
      if (!animations || animations.length === 0) return null;
      return (
        animations.find((clip) => /idle/i.test(clip.name)) ||
        THREE.AnimationClip.findByName(animations, "Idle") ||
        animations[0]
      );
    }
  
    function replaceAvatarWithModel(target, isDealer = false) {
      if (!ctx.modelTemplate) return;
  
      if (target.mixer) {
        const idx = ctx.mixers.indexOf(target.mixer);
        if (idx !== -1) {
          ctx.mixers.splice(idx, 1);
        }
        target.mixer.stopAllAction();
      }
  
      while (target.avatarAnchor.children.length > 0) {
        target.avatarAnchor.remove(target.avatarAnchor.children[0]);
      }
  
      const source = SkeletonUtils ? SkeletonUtils.clone(ctx.modelTemplate.scene) : ctx.modelTemplate.scene.clone(true);
      const materials = collectMaterials(source);
  
      const mixer = new THREE.AnimationMixer(source);
      const idle = pickIdleClip(ctx.modelTemplate.animations);
      if (idle) {
        const idleAction = mixer.clipAction(idle);
        idleAction.enabled = true;
        idleAction.timeScale = isDealer ? 0.85 : 0.78;
        idleAction.play();
      }
  
      source.scale.setScalar(isDealer ? 1.12 : target.isHuman ? 0.86 : 1.0);
      source.position.set(0, -0.48, 0.08);
      source.rotation.y = Math.PI;
  
      target.avatarAnchor.add(source);
      target.avatarObject = source;
      target.materials = materials;
      target.placeholderArms = [];
      target.mixer = mixer;
      target.actions = { idle };
  
      ctx.mixers.push(mixer);
    }
  
    function loadHumanModel() {
      if (!GLTFLoader) {
        return;
      }
      if (ctx.modelTemplate || ctx.modelLoading) {
        return;
      }
      ctx.modelLoading = true;
  
      const loader = new GLTFLoader();
      loader.load(
        MODEL_URL,
        (gltf) => {
          ctx.modelTemplate = {
            scene: gltf.scene,
            animations: gltf.animations || []
          };
  
          if (ctx.dealer) {
            replaceAvatarWithModel(ctx.dealer, true);
          }
  
          ctx.players.forEach((entry) => {
            replaceAvatarWithModel(entry, false);
          });
          ctx.modelLoading = false;
        },
        undefined,
        (error) => {
          ctx.modelLoading = false;
          console.warn("Poker3D model load failed, using primitive avatars.", error);
        }
      );
    }
  
    function updateEntryVisibility(entry, dt) {
      entry.fadeCurrent += (entry.fadeTarget - entry.fadeCurrent) * (1 - Math.exp(-dt * 8));
      const fade = THREE.MathUtils.clamp(entry.fadeCurrent, 0.1, 1);
  
      entry.materials.forEach((mat) => {
        mat.transparent = fade < 0.999;
        mat.opacity = fade;
      });
    }
  
    function setPlayerState(index, playerState = {}) {
      const entry = ctx.players[index];
      if (!entry) return;
  
      const folded = !!playerState.folded;
      const allIn = !!playerState.allIn;
      const active = !!playerState.active;
      const peeking = !!playerState.peeking;
      const holeCount = Math.max(0, Math.min(2, playerState.holeCount || 0));
      const reveal = !!playerState.reveal;
      const cards = Array.isArray(playerState.cards) ? playerState.cards : [];
      const actionLabel = typeof playerState.actionLabel === "string" ? playerState.actionLabel : "";
      const actionTone = typeof playerState.actionTone === "string" ? playerState.actionTone : "";
  
      entry.allIn = allIn;
      entry.active = active;
      entry.folded = folded;
      entry.reveal = reveal;
      entry.peeking = peeking;
      entry.targetY = entry.baseY + (allIn ? 0.32 : 0);
      let nextFade = folded ? 0.3 : 1;
      if (entry.isHuman && peeking) {
        nextFade = Math.min(nextFade, 0.1);
      }
      entry.fadeTarget = nextFade;
  
      entry.holeCards.forEach((cardMesh, cardIndex) => {
        const visible = cardIndex < holeCount;
        cardMesh.visible = visible;
        if (!visible) return;
  
        const heroPeek = entry.isHuman && peeking;
        cardMesh.position.copy(getSeatCardPosition(index, cardIndex, heroPeek));
        cardMesh.rotation.x = getSeatCardRotationX(index, heroPeek);
        cardMesh.rotation.z = getSeatCardRotationZ(index, cardIndex, heroPeek);
        cardMesh.scale.setScalar(entry.isHuman ? (heroPeek ? 1.5 : 1.08) : 1);
  
        const cardData = cards[cardIndex] || null;
        applyCardFace(cardMesh, cardData, !reveal);
      });
  
      entry.ring.visible = active;
      setEntryActionBadge(entry, actionLabel, actionTone);
    }
  
    function setTableState(tableState = {}) {
      const communityVisible = Math.max(0, Math.min(5, tableState.communityVisible || 0));
      const cards = Array.isArray(tableState.communityCards) ? tableState.communityCards : [];
  
      ctx.communityCards.forEach((cardMesh, index) => {
        const visible = index < communityVisible;
        cardMesh.visible = visible;
        if (!visible) return;
  
        applyCardFace(cardMesh, cards[index] || null, false);
      });
  
      if (typeof tableState.dealerIndex === "number") {
        ctx.dealerButton.position.copy(getDealerButtonPosition(tableState.dealerIndex));
      }
    }
  
    function setTurnTimer(seatIndex, payload = {}) {
      const entry = ctx.players[seatIndex];
      if (!entry || !entry.timerSprite || !entry.timerSprite.material) return;
  
      entry.timerVisible = !!payload.visible;
      const totalMs = Number.isFinite(payload.totalMs) ? payload.totalMs : TURN_TIMER_DEFAULT_MS;
      const leftMs = Number.isFinite(payload.leftMs) ? payload.leftMs : 0;
      entry.timerTotalMs = Math.max(1, totalMs);
      entry.timerLeftMs = THREE.MathUtils.clamp(leftMs, 0, entry.timerTotalMs);
  
      if (!entry.timerVisible) {
        entry.timerSprite.visible = false;
        entry.timerSprite.material.opacity = 0;
        return;
      }
  
      entry.timerSprite.visible = true;
      drawTurnTimer(entry);
    }
  
    function resetForNewHand() {
      if (ctx.stageCueTimer) {
        window.clearTimeout(ctx.stageCueTimer);
        ctx.stageCueTimer = null;
      }
      ctx.players.forEach((entry) => {
        entry.targetY = entry.baseY;
        entry.currentY = entry.baseY;
        entry.allIn = false;
        entry.active = false;
        entry.folded = false;
        entry.reveal = false;
        entry.actionType = "";
        entry.actionLabel = "";
        entry.actionTone = "";
        entry.actionTimer = 0;
        entry.actionDuration = 0.4;
        entry.actionPower = 0;
        entry.timerVisible = false;
        entry.timerTotalMs = TURN_TIMER_DEFAULT_MS;
        entry.timerLeftMs = 0;
        entry.peeking = false;
        entry.fadeCurrent = 1;
        entry.fadeTarget = 1;
        entry.root.position.x = entry.basePos.x;
        entry.root.position.y = entry.baseY;
        entry.root.position.z = entry.basePos.z;
        entry.ring.visible = false;
        if (entry.actionSprite && entry.actionSprite.material) {
          entry.actionSprite.visible = false;
          entry.actionSprite.material.opacity = 0;
        }
        if (entry.timerSprite && entry.timerSprite.material) {
          entry.timerSprite.visible = false;
          entry.timerSprite.material.opacity = 0;
        }
  
        entry.holeCards.forEach((cardMesh, cardIndex) => {
          cardMesh.visible = false;
          applyCardFace(cardMesh, null, true);
          cardMesh.position.copy(getSeatCardPosition(entry.seatIndex, cardIndex));
          cardMesh.rotation.x = getSeatCardRotationX(entry.seatIndex);
          cardMesh.rotation.z = getSeatCardRotationZ(entry.seatIndex, cardIndex);
          cardMesh.scale.setScalar(entry.isHuman ? 1.08 : 1);
        });
      });
  
      ctx.communityCards.forEach((cardMesh) => {
        cardMesh.visible = false;
      });
  
      if (ctx.potChipGroup) {
        while (ctx.potChipGroup.children.length > 0) {
          const chip = ctx.potChipGroup.children[0];
          ctx.potChipGroup.remove(chip);
        }
        ctx.potChipCount = 0;
      }
  
      cue({ type: "handStart" });
    }
  
    function throwCard({ target = "seat", seatIndex = 0, cardIndex = 0, duration = 340 } = {}) {
      if (!ctx.initialized || !ctx.scene) return Promise.resolve();
  
      const start = ctx.dealerHandOrigin.clone();
      let end;
      let endRotX = -Math.PI / 2;
      let endRotZ = 0;
  
      if (target === "community") {
        end = getCommunityPosition(cardIndex);
        endRotX = getCommunityRotationX();
        endRotZ = cardIndex % 2 === 0 ? 0.02 : -0.02;
      } else {
        end = getSeatCardPosition(seatIndex, cardIndex);
        endRotX = getSeatCardRotationX(seatIndex);
        endRotZ = getSeatCardRotationZ(seatIndex, cardIndex);
      }
  
      const fly = createCardMesh(true);
      fly.position.copy(start);
      fly.rotation.x = -Math.PI / 2 + 0.5;
      fly.rotation.z = 0;
      ctx.scene.add(fly);
  
      ctx.throwInFlight += 1;
  
      return new Promise((resolve) => {
        const startTime = performance.now();
        const spin = (Math.random() - 0.5) * 0.52;
  
        function step(now) {
          const t = Math.min(1, (now - startTime) / duration);
          const eased = 1 - (1 - t) ** 3;
  
          const x = THREE.MathUtils.lerp(start.x, end.x, eased);
          const z = THREE.MathUtils.lerp(start.z, end.z, eased);
          const yBase = THREE.MathUtils.lerp(start.y, end.y, eased);
          const yArc = Math.sin(Math.PI * t) * 1.02;
  
          fly.position.set(x, yBase + yArc, z);
          fly.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2 + 0.5, endRotX, eased);
          fly.rotation.z = THREE.MathUtils.lerp(spin, endRotZ, eased);
  
          if (t < 1) {
            window.requestAnimationFrame(step);
            return;
          }
  
          ctx.scene.remove(fly);
          fly.geometry.dispose();
          fly.material.dispose();
          ctx.throwInFlight = Math.max(0, ctx.throwInFlight - 1);
          resolve();
        }
  
        window.requestAnimationFrame(step);
      });
    }
  
    function throwChips({ seatIndex = 0, amount = 20, duration = 520 } = {}) {
      if (!ctx.initialized || !ctx.scene) return Promise.resolve();
  
      const count = Math.min(20, Math.max(3, Math.ceil(Math.max(0, amount) / 30)));
      const style = seatChipStyle(seatIndex);
      const tasks = [];
      const startPotIndex = ctx.potChipCount;
      ctx.potChipCount += count;
  
      for (let i = 0; i < count; i += 1) {
        const landingIndex = startPotIndex + i;
        tasks.push(
          new Promise((resolve) => {
            const delay = i * 34;
            window.setTimeout(() => {
              const start = getSeatChipOrigin(seatIndex);
              start.x += (Math.random() - 0.5) * 0.24;
              start.z += (Math.random() - 0.5) * 0.2;
  
              const end = getPotChipLanding(landingIndex);
              const chip = createChipMesh(style);
              chip.position.copy(start);
              ctx.scene.add(chip);
  
              const startTime = performance.now();
              const spin = (Math.random() - 0.5) * 15;
  
              function step(now) {
                const t = Math.min(1, (now - startTime) / duration);
                const eased = 1 - (1 - t) ** 3;
  
                const x = THREE.MathUtils.lerp(start.x, end.x, eased);
                const z = THREE.MathUtils.lerp(start.z, end.z, eased);
                const yBase = THREE.MathUtils.lerp(start.y, end.y, eased);
                const yArc = Math.sin(Math.PI * t) * 0.9;
  
                chip.position.set(x, yBase + yArc, z);
                chip.rotation.y += 0.35 + spin * 0.01;
                chip.rotation.x = Math.sin(t * Math.PI * 2) * 0.18;
  
                if (t < 1) {
                  window.requestAnimationFrame(step);
                  return;
                }
  
                chip.position.copy(end);
                chip.rotation.set(0, Math.random() * Math.PI * 2, 0);
  
                if (ctx.potChipGroup) {
                  ctx.potChipGroup.add(chip);
                }
                resolve();
              }
  
              window.requestAnimationFrame(step);
            }, delay);
          })
        );
      }
  
      return Promise.all(tasks);
    }
  
    function playAction(seatIndex, actionType = "check") {
      const entry = ctx.players[seatIndex];
      if (!entry) return;
  
      entry.actionType = actionType;
      if (actionType === "allin") {
        entry.actionDuration = 0.74;
        entry.actionPower = 0.34;
      } else if (actionType === "raise" || actionType === "bet") {
        entry.actionDuration = 0.56;
        entry.actionPower = 0.24;
      } else if (actionType === "fold") {
        entry.actionDuration = 0.4;
        entry.actionPower = 0.12;
      } else {
        entry.actionDuration = 0.36;
        entry.actionPower = 0.14;
      }
      entry.actionTimer = entry.actionDuration;
    }
  
    function cue(payload = {}) {
      const type = payload.type || "handStart";
      const seatIndex = typeof payload.seatIndex === "number" ? payload.seatIndex : 2;
  
      if (type === "peekStart") {
        if (!ctx.peekActive) {
          ctx.peekSavedPos.copy(ctx.cameraTargetPos);
          ctx.peekSavedLook.copy(ctx.cameraTargetLook);
        }
        ctx.peekActive = true;
        setCameraTarget(new THREE.Vector3(0.2, 6.28, 9.38), new THREE.Vector3(0, 2.02, 4.72));
        return;
      }
  
      if (type === "peekEnd") {
        if (ctx.peekActive) {
          setCameraTarget(ctx.peekSavedPos, ctx.peekSavedLook);
        }
        ctx.peekActive = false;
        return;
      }
  
      ctx.peekActive = false;
      if (ctx.stageCueTimer) {
        window.clearTimeout(ctx.stageCueTimer);
        ctx.stageCueTimer = null;
      }
  
      if (type === "stageStart") {
        setCameraTarget(new THREE.Vector3(0.26, 6.94, 11.06), new THREE.Vector3(0, 1.42, 0.62));
        ctx.cameraShakeTime = 0.26;
        ctx.cameraShakeStrength = 0.06;
        ctx.stageCueTimer = window.setTimeout(() => {
          setCameraTarget(ctx.defaultCamera.pos, ctx.defaultCamera.look);
          ctx.stageCueTimer = null;
        }, 1100);
        return;
      }
  
      if (type === "stageClear") {
        setCameraTarget(new THREE.Vector3(0.2, 6.62, 9.26), new THREE.Vector3(0, 1.44, 0.86));
        ctx.cameraShakeTime = 0.22;
        ctx.cameraShakeStrength = 0.08;
        ctx.stageCueTimer = window.setTimeout(() => {
          setCameraTarget(ctx.defaultCamera.pos, ctx.defaultCamera.look);
          ctx.stageCueTimer = null;
        }, 980);
        return;
      }
  
      if (type === "handStart") {
        setCameraTarget(ctx.defaultCamera.pos, ctx.defaultCamera.look);
        return;
      }
  
      if (type === "boardFocus") {
        setCameraTarget(new THREE.Vector3(0.16, 6.8, 8.66), new THREE.Vector3(0, 1.44, 0.94));
        return;
      }
  
      if (type === "showdown") {
        setCameraTarget(new THREE.Vector3(0.2, 6.12, 9.52), new THREE.Vector3(0, 1.4, 0.56));
        return;
      }
  
      if (type === "turn") {
        if (seatIndex !== 2) {
          return;
        }
        const cueData = getSeatCameraCue(seatIndex, false);
        setCameraTarget(cueData.pos, cueData.look);
        return;
      }
  
      if (type === "allin") {
        if (seatIndex !== 2) {
          return;
        }
        const cueData = getSeatCameraCue(seatIndex, true);
        setCameraTarget(cueData.pos, cueData.look);
        ctx.cameraShakeTime = 0.42;
        ctx.cameraShakeStrength = 0.16;
      }
    }
  
    function getSeatCameraCue(seatIndex, close = false) {
      if (seatIndex === 0) {
        return {
          pos: close ? new THREE.Vector3(0, 4.6, -6.0) : new THREE.Vector3(0, 5.0, -7.05),
          look: new THREE.Vector3(0, 1.24, -2.45)
        };
      }
  
      if (seatIndex === 1) {
        return {
          pos: close ? new THREE.Vector3(6.1, 4.45, 1.08) : new THREE.Vector3(6.9, 4.9, 1.5),
          look: new THREE.Vector3(3.35, 1.24, -0.15)
        };
      }
  
      if (seatIndex === 3) {
        return {
          pos: close ? new THREE.Vector3(-6.1, 4.45, 1.08) : new THREE.Vector3(-6.9, 4.9, 1.5),
          look: new THREE.Vector3(-3.35, 1.24, -0.15)
        };
      }
  
      return {
        pos: close ? new THREE.Vector3(0.26, 5.22, 9.68) : new THREE.Vector3(0.52, 5.72, 10.96),
        look: new THREE.Vector3(0, 1.46, 3.44)
      };
    }
  
    function setCameraTarget(pos, look) {
      ctx.cameraTargetPos.copy(pos);
      ctx.cameraTargetLook.copy(look);
    }
  
    function animate() {
      if (!ctx.initialized) return;
  
      const dt = ctx.clock.getDelta();
      ctx.time += dt;
  
      ctx.mixers.forEach((mixer) => mixer.update(dt));
  
      if (ctx.atmosphere && ctx.atmosphere.points) {
        const { points, basePositions, phases } = ctx.atmosphere;
        const attr = points.geometry.getAttribute("position");
        const pos = attr.array;
        for (let i = 0; i < phases.length; i += 1) {
          const i3 = i * 3;
          const phase = phases[i];
          pos[i3] = basePositions[i3] + Math.sin(ctx.time * 0.22 + phase) * 0.03;
          pos[i3 + 1] = basePositions[i3 + 1] + Math.sin(ctx.time * 0.31 + phase * 1.3) * 0.05;
          pos[i3 + 2] = basePositions[i3 + 2] + Math.cos(ctx.time * 0.18 + phase * 1.7) * 0.03;
        }
        attr.needsUpdate = true;
        points.rotation.y += dt * 0.012;
      }
  
      if (ctx.lights) {
        ctx.lights.topSpot.intensity = 4.8 + Math.sin(ctx.time * 0.55) * 0.24;
        ctx.lights.barFill.intensity = 0.16 + Math.sin(ctx.time * 0.8 + 1.1) * 0.05;
      }
  
      const move = 1 - Math.exp(-dt * 3.6);
      const lookMove = 1 - Math.exp(-dt * 4.2);
  
      ctx.cameraCurrentPos.lerp(ctx.cameraTargetPos, move);
      ctx.cameraCurrentLook.lerp(ctx.cameraTargetLook, lookMove);
  
      const idleX = Math.sin(ctx.time * 0.45) * 0.08;
      const idleY = Math.sin(ctx.time * 0.27) * 0.04;
  
      let shakeX = 0;
      let shakeY = 0;
      let shakeZ = 0;
  
      if (ctx.cameraShakeTime > 0) {
        const amp = ctx.cameraShakeStrength * (ctx.cameraShakeTime / 0.42);
        shakeX = (Math.random() - 0.5) * amp;
        shakeY = (Math.random() - 0.5) * amp * 0.7;
        shakeZ = (Math.random() - 0.5) * amp;
        ctx.cameraShakeTime = Math.max(0, ctx.cameraShakeTime - dt);
      }
  
      ctx.camera.position.set(
        ctx.cameraCurrentPos.x + idleX + shakeX,
        ctx.cameraCurrentPos.y + idleY + shakeY,
        ctx.cameraCurrentPos.z + shakeZ
      );
      ctx.camera.lookAt(ctx.cameraCurrentLook);
  
      const throwPulse = Math.min(1, ctx.throwInFlight);
      if (ctx.dealer) {
        ctx.dealer.throwPhase += dt * (6 + throwPulse * 14);
        const lean = throwPulse * 0.1;
        ctx.dealer.avatarAnchor.position.z = 0.06 + lean;
  
        if (ctx.dealer.placeholderArms.length === 2) {
          const armL = ctx.dealer.placeholderArms[0];
          const armR = ctx.dealer.placeholderArms[1];
          const swing = Math.sin(ctx.dealer.throwPhase) * 0.24 * throwPulse;
          armL.rotation.x = swing;
          armR.rotation.x = -swing;
        }
      }
  
      ctx.players.forEach((entry, index) => {
        const smooth = 1 - Math.exp(-dt * 9);
        entry.currentY += (entry.targetY - entry.currentY) * smooth;
  
        const allInBob = entry.allIn ? Math.sin(ctx.time * 8 + index) * 0.03 : 0;
        const peekDrop = entry.isHuman && entry.peeking ? 0.22 : 0;
        entry.root.position.y = entry.currentY + allInBob - peekDrop;
  
        let lunge = 0;
        let actionProgress = 0;
        if (entry.actionTimer > 0 && entry.actionDuration > 0) {
          entry.actionTimer = Math.max(0, entry.actionTimer - dt);
          actionProgress = 1 - entry.actionTimer / entry.actionDuration;
          lunge = Math.sin(actionProgress * Math.PI) * entry.actionPower;
        }
  
        if (lunge > 0.0001) {
          const dir = new THREE.Vector3(-entry.basePos.x, 0, -entry.basePos.z).normalize();
          entry.root.position.x = entry.basePos.x + dir.x * lunge;
          entry.root.position.z = entry.basePos.z + dir.z * lunge;
        } else {
          entry.root.position.x = entry.basePos.x;
          entry.root.position.z = entry.basePos.z;
        }
  
        if (entry.active) {
          entry.ring.material.opacity = 0.56 + Math.sin(ctx.time * 8 + index) * 0.2;
        } else {
          entry.ring.material.opacity = 0;
        }
  
        updateEntryVisibility(entry, dt);
  
        if (entry.placeholderArms.length === 2) {
          const armL = entry.placeholderArms[0];
          const armR = entry.placeholderArms[1];
          const idle = Math.sin(ctx.time * 0.9 + index) * 0.08;
          const swing = lunge > 0 ? Math.sin(actionProgress * Math.PI) * 0.62 : 0;
          armL.rotation.x = idle + swing;
          armR.rotation.x = -idle + swing * 0.85;
        }
  
        if (entry.actionSprite && entry.actionSprite.material) {
          const material = entry.actionSprite.material;
          if (entry.actionSprite.visible) {
            const pulse = entry.active ? 0.06 * Math.sin(ctx.time * 8 + index) : 0;
            const targetOpacity = (entry.folded ? 0.72 : 0.9) + pulse;
            material.opacity += (targetOpacity - material.opacity) * (1 - Math.exp(-dt * 10));
            entry.actionSprite.position.y = 1.72 + (entry.active ? 0.05 : 0);
            const targetScale = entry.active ? 1.62 : 1.48;
            entry.actionSprite.scale.x += (targetScale - entry.actionSprite.scale.x) * (1 - Math.exp(-dt * 9));
            entry.actionSprite.scale.y += ((targetScale * 0.36) - entry.actionSprite.scale.y) * (1 - Math.exp(-dt * 9));
          } else {
            material.opacity = 0;
          }
        }
  
        if (entry.timerSprite && entry.timerSprite.material) {
          const timerMaterial = entry.timerSprite.material;
          if (entry.timerVisible && entry.timerSprite.visible) {
            const timerOpacityTarget = entry.active ? 0.98 : 0.82;
            timerMaterial.opacity += (timerOpacityTarget - timerMaterial.opacity) * (1 - Math.exp(-dt * 10));
            const bob = entry.active ? Math.sin(ctx.time * 7 + index) * 0.03 : 0;
            entry.timerSprite.position.y = 2.42 + bob;
            const targetScale = entry.active ? 0.76 : 0.72;
            entry.timerSprite.scale.x += (targetScale - entry.timerSprite.scale.x) * (1 - Math.exp(-dt * 8));
            entry.timerSprite.scale.y += (targetScale - entry.timerSprite.scale.y) * (1 - Math.exp(-dt * 8));
          } else {
            timerMaterial.opacity = 0;
          }
        }
      });
  
      ctx.dealerButton.rotation.y += dt * 0.75;
  
      ctx.renderer.render(ctx.scene, ctx.camera);
      ctx.rafId = window.requestAnimationFrame(animate);
    }
  
    function onResize() {
      if (!ctx.container || !ctx.renderer || !ctx.camera) return;
  
      const width = Math.max(1, ctx.container.clientWidth);
      const height = Math.max(1, ctx.container.clientHeight);
  
      ctx.camera.aspect = width / height;
      ctx.camera.updateProjectionMatrix();
      ctx.renderer.setSize(width, height, false);
    }
  
    function resize() {
      onResize();
    }
  
    window.Poker3D = {
      init,
      resize,
      resetForNewHand,
      setTableState,
      setPlayerState,
      setTurnTimer,
      setSkin,
      throwCard,
      throwChips,
      cue,
      playAction
    };
  })();
  
