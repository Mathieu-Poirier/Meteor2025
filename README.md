# METEOR2025 🌍☄️

An interactive **3D asteroid impact simulator** built for a hackathon project.  
We combine **NASA’s NEO API**, **Three.js visualization**, and a **FastAPI backend** to make orbital mechanics engaging and accessible.

---

## 🚀 Features
- 🌍 Realistic **Earth model** with orbiting asteroids  
- ☄️ Load any asteroid by its NASA ID  
- 🎛️ **Live parameter controls**: adjust semi-major axis (a), eccentricity (e), inclination (i)  
- 🌀 Orbital trails follow asteroids in real-time  
- 🔭 Smooth orbit camera with `OrbitControls`  
- ⚡ Backend powered by NASA’s **SBDB** and **NEO API**  

---

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Mathieu-Poirier/Meteor2025.git
cd Meteor2025
```

### 2. Start the backend (FastAPI)
```bash
pip install -r requirements.txt
uvicorn backend.server:app --reload --port 8000
```
Backend runs at **http://127.0.0.1:8000**

### 3. Run the frontend
```bash
cd frontend
python -m http.server 8080
```
Frontend runs at **http://127.0.0.1:8080**

---

## 🎮 Usage
1. Open `http://127.0.0.1:8080`  
2. Enter an asteroid ID in the input box  
3. Adjust sliders (`a`, `e`, `i`) to see orbit changes  
4. Watch the asteroid orbit Earth in real-time  

---

## 🧪 Test Asteroid IDs
Copy-paste one of these into the input:

```
3542519 — (2010 PK9)       # near-Earth asteroid
3726710 — (2015 TB145)     # “Halloween asteroid”
3838916 — (1998 OR2)       # large Apollo asteroid
3078262 — (2001 FO32)      # fastest-known flyby asteroid
2000433 — (Eros)           # visited by NEAR Shoemaker probe
```

---

## 🛰️ Data Sources
- [NASA SBDB API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html)  
- [NASA NEO API](https://api.nasa.gov/)  

---

## 👥 Team
We are a small interdisciplinary team:  
- 2 × Computer Science students  
- 1 × Mechatronics engineer  

What unites us: curiosity about space and making science **visual and accessible**.  

---

## 🔮 Vision
We aim to create an educational and decision-support tool where users can explore **what-if scenarios**:  
- Changing orbital elements  
- Testing deflection strategies  
- Simulating near-Earth encounters  

---

## 📜 License
MIT License
