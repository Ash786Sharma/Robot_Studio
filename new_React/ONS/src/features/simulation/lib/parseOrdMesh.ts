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
      // URDF/ROS meshes are Z-up, and our joint-chain math already works in that frame. Strip
      // <up_axis> so ColladaLoader doesn't bake in (and warn about) a -90° X Y-up conversion.
      const xml = textDecoder.decode(buffer).replace(/<up_axis>[^<]*<\/up_axis>/, "")
      const collada = colladaLoader.parse(xml, "")
      if (!collada) throw new Error("ColladaLoader failed to parse the mesh")
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
