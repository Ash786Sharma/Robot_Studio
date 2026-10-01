import { BufferGeometry, Group, Mesh, MeshStandardMaterial, Object3D } from "three"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import type { OrdMeshFileType } from "@/core/api/robotOrdApi"

const stlLoader = new STLLoader()
const colladaLoader = new ColladaLoader()
const objLoader = new OBJLoader()
const gltfLoader = new GLTFLoader()

const textDecoder = new TextDecoder()

/** Parses a fetched mesh file's bytes into a renderable Object3D, matching its .ord-declared `fileType`. */
export async function parseOrdMesh(buffer: ArrayBuffer, fileType: OrdMeshFileType): Promise<Object3D> {
  switch (fileType) {
    case "stl": {
      const geometry: BufferGeometry = stlLoader.parse(buffer)
      return new Mesh(geometry, new MeshStandardMaterial({ color: "#c7c7c7", roughness: 0.6, metalness: 0.2 }))
    }
    case "dae": {
      const collada = colladaLoader.parse(textDecoder.decode(buffer), "")
      if (!collada) throw new Error("ColladaLoader failed to parse the mesh")
      // URDF/ROS meshes are Z-up; ColladaLoader detects that and "helpfully" bakes a -90° X
      // rotation into the scene to convert to three.js's Y-up — but our own joint-chain math
      // already composes everything in the URDF's native Z-up frame, so undo it here or every
      // mesh ends up fighting its own kinematic transform (scattered/misoriented links).
      collada.scene.rotation.set(0, 0, 0)
      return collada.scene
    }
    case "obj": {
      return objLoader.parse(textDecoder.decode(buffer))
    }
    case "gltf":
    case "glb": {
      // Unlike the other loaders, GLTFLoader.parse() is genuinely async (it may resolve embedded buffers/textures).
      return new Promise((resolve, reject) => {
        gltfLoader.parse(buffer, "", (gltf) => resolve(gltf.scene), reject)
      })
    }
    default:
      return new Group()
  }
}
