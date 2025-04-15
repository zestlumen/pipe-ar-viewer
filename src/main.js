import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

//Mapbox 토큰 사용하기
mapboxgl.accessToken = 'pk.eyJ1IjoiemVzdGx1bWVuIiwiYSI6ImNtOWM0bjZ0NzBrNGwybHBiYWRwbTdmdG0ifQ.Luc6DCjTWp9S6Ez_qnaBBw';

//Mappbox 지도생성
const map = new mapboxgl.Map({
  container: 'map', //html 요소 id
  style:   'mapbox://styles/mapbox/streets-v12',
  center: [0, 0], //초기 센터 -> 위치잡히면 갱신
  zoom: 17,
  pitch: 60,
  bearing: -60,
  antialias: true //3d요소 부드럽게
});

//Three.js 세팅
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000); //fov시야각,aspect가로세로비율,near최소보기거리,far최대보기거리 
//16:9비율이면 16/9 =1.78, 4:3비율이면 4/3= 1.33
camera.position.set(0,0,10);

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = 0;
renderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(renderer.domElement);

//렌더링 루프
function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// window.addEventListener('resize', () => {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// });

let userMarker = null;
let showUserLocation = true;
let currentUserLat = null;
let currentUserLon = null;
let cameraMoved = false;

document.getElementById('toggle-location-btn').addEventListener('click', () => {
  const btn = document.getElementById('toggle-location-btn');
  btn.textContent = showUserLocation ? '위치 숨김' : '내 위치 표시';
  showUserLocation = !showUserLocation;

  if (userMarker) {
    if(showUserLocation) {
      userMarker.addTo(map);
    } else {
      userMarker.remove();
    }
  }
});


//관로 데이터 로드
function loadPipes(userLat, userLon) {
  fetch('/pipes.json')  
    .then(res => res.json())
    .then(pipes => {
      pipes.forEach(pipe => {
        const geometry = new THREE.CylinderGeometry(pipe.diameter / 1000, pipe.diameter / 1000, pipe.length, 12);
        const material = new THREE.MeshBasicMaterial({ 
          color: pipe.type === '상수도' ? 0x0099ff : 0x666666
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;

        const merc = mapboxgl.MercatorCoordinate.fromLngLat(pipe.position, 0);
        const scale = merc.meterInMercatorCoordinateUnits();
        mesh.position.set(merc.x, merc.y, 0);
        mesh.scale.set(scale, scale, scale);

        scene.add(mesh);

        if(!cameraMoved) {
          camera.position.set(merc.x, merc.y, 50);
          camera.lookAt(merc.x, merc.y, 0);
          cameraMoved = true;
        }

        console.log('파이프생성', mesh);

      });
    });
  }

  //현재 위치 불러오기
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLon = pos.coords.longitude;

      console.log("현재위치: ", userLat,userLon);

      map.setCenter([userLon, userLat]); //지도위치 업데이트

      //마커 생성 및 저장
      userMarker = new mapboxgl.Marker({ color: 'red' })
      .setLngLat([userLon, userLat])
      .addTo(map);

    loadPipes(userLat, userLon);
    },
    (err) => {
      console.warn("📍위치 권한 오류! fallback 위치 사용합니다.", err);
  
      const fallbackLat = 37.5665;
      const fallbackLon = 126.9780;
  
      map.setCenter([fallbackLon, fallbackLat]);
  
      userMarker = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([fallbackLon, fallbackLat])
        .addTo(map);
  
      loadPipes(fallbackLat, fallbackLon);
    }
  );



/*
map style (mapbox studio에서 커스텀 가능)
  dark: 'mapbox://styles/mapbox/dark-v11' 야간모드 / ar 시각화에 적합
  light:  'mapbox://styles/mapbox/light-v11' 밝고 가독성 좋음
  streets: 'mapbox://styles/mapbox/streets-v12' 기본 지도 (길,건물명, 도로중심)
  outdoors: 'mapbox://styles/mapbox/outdoors-v12' 등고선, 산/공원 표시 포함
  Satellite: 'mapbox://styles/mapbox/satellite-v9' 위성항공사진
  Satellite Streets: 'mapbox://styles/mapbox/satellite-streets-v12' 위성 + 거리
  Navigation Day: 'mapbox://styles/mapbox/navigation-day-v1' 네비게이션/ AR HUD에 적합
  Navigation Night: 'mapbox://styles/mapbox/navigation-night-v1' 네비 야간모드
*/