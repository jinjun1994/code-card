


import { GLTFExporter } from "https://threejs.org/examples/jsm/exporters/GLTFExporter.js";
window.GLTFExporter = GLTFExporter


const link = document.createElement("a");
link.style.display = "none";
document.body.appendChild(link); // Firefox workaround, see #6594
function save(blob, filename) {
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  // URL.revokeObjectURL( url ); breaks Firefox...
}

function saveArrayBuffer(buffer, filename) {
  save(new Blob([buffer], { type: "application/octet-stream" }), filename);
}
function saveString(text, filename) {
  save(new Blob([text], { type: "text/plain" }), filename);
}
const exporter = new GLTFExporter();

// Parse the input and generate the glTF output
exporter.parse(scene, function (gltf) {
  if (gltf instanceof ArrayBuffer) {
    saveArrayBuffer(gltf, "scene.glb");
  } else {
    const output = JSON.stringify(gltf, null, 2);
    console.log(output);
    saveString(output, "scene.gltf");
  }
});
