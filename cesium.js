 const pixels = context.readPixels({
    x: 0,
    y: 0,
    width: width,
    height: height,
    framebuffer,
  });
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  canvas.style.position = "absolute";
  canvas.style.bottom = "0px";
  canvas.style.right = "0px";
  canvas.style.zIndex = "256";
  document.body.appendChild(canvas);
  const w = 256;
  const h = 256;

  console.log(pixels);
  const ctx = canvas.getContext("2d");
  const imgDataCtx = ctx.createImageData(w, h);
  const data = imgDataCtx.data;
  for (let i = 0; i < imgDataCtx.data.length; i += 1) {
    data[i] = pixels[i];
  }
  ctx.putImageData(imgDataCtx, 0, 0);

  const link = document.createElement("a");
  link.download = "webgl.png";
  link.href = canvas.toDataURL();
  link.click();
