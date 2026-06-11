import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import URDFLoader from "urdf-loader";


const MAX_TRAIL_POINTS = 1000;

const RobotViewer = forwardRef(({ joints, isTracing }, ref) => {
  const mountRef = useRef(null);
  const robotRef = useRef(null);
  const trailRef = useRef(null);   // THREE.Line object
  const trailPtsRef  = useRef([]);     // Vector3[]

  const clearTrail = () => {
    trailPtsRef.current = [];
    const line = trailRef.current;
    if (line) line.geometry.setDrawRange(0, 0);
  };
  useImperativeHandle(ref, () => ({clearTrail}));

  useEffect(() => {
      const mount = mountRef.current;

      if (!mount) return;

      const w = mount.clientWidth;
      const h = mount.clientHeight;

      // ── Scene ──────────────────────────────────────────────────────────────
      // 3D scene container with background and grid helper
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d1117);
      // add grid
      scene.add(new THREE.GridHelper(2, 10, 0x1e3a5f, 0x1e3a5f));

      // ── Lights ─────────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));

      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(5, 10, 7);
      dir.castShadow = true;
      scene.add(dir);

      const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
      fillLight.position.set(-5, 3, -5);
      scene.add(fillLight);

      // ── Camera ─────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 200);
      // camera pos
      camera.position.set(1.5, 1.5, 2);

      // ── Renderer ───────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      // add renderer to DOM
      mount.appendChild(renderer.domElement);

      // ── Controls ───────────────────────────────────────────────────────────
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      // camera target look
      controls.target.set(0, 0.5, 0);
      controls.update();

      // ── trace ────────────────────────────────────────────────────────────
      const trailGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(MAX_TRAIL_POINTS * 3);
      trailGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      trailGeo.setDrawRange(0, 0);
      const trailMat = new THREE.LineBasicMaterial({
          color: 0x00e5ff,
          linewidth: 2,
          vertexColors: false,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);
      trailRef.current = trailLine;

      // ── URDF Loader ────────────────────────────────────────────────────────
      const loader = new URDFLoader();

      loader.loadMeshCb = (path, manager, done) => {
        const objLoader = new OBJLoader(manager);
        const mtlLoader = new MTLLoader(manager);

        mtlLoader.load(
          path.replace(".obj", ".mtl"),
          (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);
          },
          undefined,
          (err) => {
            console.warn("MTL load error:", err);
          },
        );

        objLoader.load(
          path,
          (obj) => {
            obj.traverse((c) => {
              if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });
            done(obj);
          },
          undefined,
          (err) => {
            console.error("Mesh load error:", err);
            done(new THREE.Object3D());
          },
        );
      };

      loader.load(
        "/model/robot.urdf",
        (robot) => {
          const box = new THREE.Box3().setFromObject(robot);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / (maxDim || 1);
          robot.scale.setScalar(scale);
          robot.position.sub(center.multiplyScalar(scale));
          robot.position.y += (size.y * scale) / 2;

          scene.add(robot);

          //save the robot reference for later joint updates
          robotRef.current = robot;

          // set initial joint angles
          robot.joints["joint1"]?.setJointValue(joints[0]);
          robot.joints["joint2"]?.setJointValue(joints[1]);
          robot.joints["joint3"]?.setJointValue(joints[2]);
          robot.joints["joint4"]?.setJointValue(joints[3]);
          robot.joints["joint5"]?.setJointValue(joints[4]);
          robot.joints["joint6"]?.setJointValue(joints[5]);


          // controls.target.set(0, (size.y * scale) / 2, 0);
          controls.update();

          console.log("Robot joints:", Object.keys(robot.joints));
        },
        undefined,
        (err) => console.error("URDF load error:", err),
      );

      // ── Animate ────────────────────────────────────────────────────────────
      let rafId;
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // ── Resize ─────────────────────────────────────────────────────────────
      const onResize = () => {
        const nw = mount.clientWidth;
        const nh = mount.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        controls.dispose();
        renderer.dispose();
        if (mount.contains(renderer.domElement))
          mount.removeChild(renderer.domElement);
      };
    }, []);


    useEffect(() => {
    const robot = robotRef.current;
    if (!robot || !robot.joints) return;

    robot.joints["joint1"]?.setJointValue(joints[0]);
    robot.joints["joint2"]?.setJointValue(joints[1]);
    robot.joints["joint3"]?.setJointValue(joints[2]);
    robot.joints["joint4"]?.setJointValue(joints[3]);
    robot.joints["joint5"]?.setJointValue(joints[4]);
    robot.joints["joint6"]?.setJointValue(joints[5]);


    if (!isTracing) {
      if (trailPtsRef.current.length > 0) {
        clearTrail();
      }
      return
    };

    // read end-effector position and update the trail
    const eeLink = robot.getObjectByName("joint6");

    // read world position of the end-effector link
    if (!eeLink || !trailRef.current) return;

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();

    eeLink.getWorldPosition(worldPos);
    eeLink.getWorldQuaternion(worldQuat);

    const forward = new THREE.Vector3(0, 0, 0.056);
    forward.applyQuaternion(worldQuat);        // rotate

    // add current position to trail points, maintain a fixed length (in-place update)
    const pts = trailPtsRef.current;
    const tcpPos = worldPos.clone().add(forward);
    pts.push(tcpPos);
    if (pts.length > MAX_TRAIL_POINTS) pts.shift();

    // update trail geometry with new points
    const line = trailRef.current;
    const posAttr = line.geometry.attributes.position;
    pts.forEach((p, i) => {
      posAttr.setXYZ(i, p.x, p.y, p.z);
    });
    posAttr.needsUpdate = true;
    line.geometry.setDrawRange(0, pts.length);

    }, [joints, isTracing]);

    return <div ref = {mountRef} className="w-full h-full" />;
});

export default RobotViewer;
