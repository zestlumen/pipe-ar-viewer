import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoiemVzdGx1bWVuIiwiYSI6ImNtOWM0bjZ0NzBrNGwybHBiYWRwbTdmdG0ifQ.Luc6DCjTWp9S6Ez_qnaBBw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [0, 0],
  zoom: 17,
  pitch: 60,
  bearing: -60,
  antialias: true
});

const scene = new THREE.Scene();

//fov,aspect,near,far
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000); 
camera.position.set(0,0,10);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = 0;
renderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(renderer.domElement);

function loadPipes(userLat, userLon) {
  fetch('/pipes.json')  
    .then(res => res.json())
    .then(pipes => {
      pipes.forEach(pipe => {
        const geometry = new THREE.CylinderGeometry(pipe.diameter / 1000, pipe.diameter / 1000, pipe.length, 12);
        const material = new THREE.MeshBasicMaterial({ color: pipe.type === '상수도' ? 0x0099ff : 0x666666});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;

        const merc = mapboxgl.MercatorCoordinate.fromLngLat(pipe.position, 0);
        const scale = merc.meterInMercatorCoordinateUnits();
        mesh.position.set(merc.x, merc.y, 0);
        mesh.scale.set(scale, scale, scale);

        scene.add(mesh);
      });
    });
  }

  function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;

      console.log("현재위치: ", userLat,userLon);

      map.setCenter([userLon,userLat]);
      loadPipes(userLat,userLon);
    },
    (err) => {
      alert ("브라우저 위치 권한 허용바람");
      console.log(err);
    }
  )

new mapboxgl.Marker({ color: 'red' })
  .setLngLat([userLon, userLat])
  .addTo(map);

