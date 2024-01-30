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




----------------
 function reprojectToGeographicWebGPU(context, texture, rectangle,postExecute) {
 const engine = context.engine;
  let reproject = context.cache.imageryLayer_reproject;
  const uniformState = context.uniformState

  if (!defined(reproject)) {
    reproject = context.cache.imageryLayer_reproject = {
      vertexArray: undefined,
      shaderProgram: undefined,
      sampler: undefined,
      destroy: function () {
        if (defined(this.framebuffer)) {
          this.framebuffer.destroy();
        }
        if (defined(this.vertexArray)) {
          this.vertexArray.destroy();
        }
        if (defined(this.shaderProgram)) {
          this.shaderProgram.destroy();
        }
      },
    };

    const positions = new Float32Array(2 * 64 * 2);
    let index = 0;
    for (let j = 0; j < 64; ++j) {
      const y = j / 63.0;
      positions[index++] = 0.0;
      positions[index++] = y;
      positions[index++] = 1.0;
      positions[index++] = y;
    }

    const reprojectAttributeIndices = {
      position: 0,
      webMercatorT: 1,
    };

    const indices = TerrainProvider.getRegularGridIndices(2, 64);
    const indexBuffer = Buffer.createIndexBuffer({
      context: context,
      typedArray: indices,
      usage: BufferUsage.STATIC_DRAW,
      indexDatatype: IndexDatatype.UNSIGNED_SHORT,
    });
    

    reproject.vertexArray = new VertexArray({
      context: context,
      attributes: [
        {
          index: reprojectAttributeIndices.position,
          vertexBuffer: Buffer.createVertexBuffer({
            context: context,
            typedArray: positions,
            usage: BufferUsage.STATIC_DRAW,
          }),
          componentsPerAttribute: 2,
          componentDatatype: ComponentDatatype.FLOAT,
          name: 'position',
        },
        {
          index: reprojectAttributeIndices.webMercatorT,
          vertexBuffer: Buffer.createVertexBuffer({
            context: context,
            sizeInBytes: 64 * 2 * 4 * 4,
            usage: BufferUsage.STREAM_DRAW,
          }),
          componentsPerAttribute: 1,
          componentDatatype: ComponentDatatype.FLOAT,
          name:"webMercatorT"

        },
      ],
      indexBuffer: indexBuffer,
    });

    const vs = new ShaderSource({
      sources: [ReprojectWebMercatorVS],
    });

    reproject.shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vs,
      fragmentShaderSource: ReprojectWebMercatorFS,
      attributeLocations: reprojectAttributeIndices,
    });

    reproject.sampler = new Sampler({
      wrapS: TextureWrap.CLAMP_TO_EDGE,
      wrapT: TextureWrap.CLAMP_TO_EDGE,
      minificationFilter: TextureMinificationFilter.LINEAR,
      magnificationFilter: TextureMagnificationFilter.LINEAR,
    });
  }

  texture.sampler = reproject.sampler;

  const width = texture.width;
  const height = texture.height;



  let sinLatitude = Math.sin(rectangle.south);
  const southMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));

  sinLatitude = Math.sin(rectangle.north);
  const northMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));
  const oneOverMercatorHeight = 1.0 / (northMercatorY - southMercatorY);



  const south = rectangle.south;
  const north = rectangle.north;





    // debugger
  // -------- COMPUTE 1 -------------------------
  // 参考 https://github.com/CesiumGS/cesium/blob/21603315eb33a914cb551087da5e388cf646bfaa/Source/Shaders/ReprojectWebMercatorFS.glsl
  const copyTextureComputeShader = `
  @group(0) @binding(0) var dest : texture_storage_2d<rgba8unorm, write>; // 输出纹理
  @group(0) @binding(1) var samplerSrc : sampler; // 输入纹理采样器
  @group(0) @binding(2) var u_texture : texture_2d<f32>; // 输入纹理
  struct Params {
    u_northLatitude : f32,
    u_southLatitude : f32,
    u_southMercatorYHigh : f32,
    u_southMercatorYLow : f32,
    u_oneOverMercatorHeight : f32,
  };
  @group(0) @binding(3) var<uniform> params : Params;
  // 重投影所需的一些uniform变量

  
  @compute @workgroup_size(16, 16, 1)
  fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
      let dims : vec2<u32> = textureDimensions(u_texture, 0);
      let thread_id : vec2<u32> = global_id.xy;
  
      // 确保线程ID在纹理尺寸范围内
      if (thread_id.x >= dims.x || thread_id.y >= dims.y) {
          return;
      }
  
      // 将像素坐标规范化到[0, 1]的范围
      let geographicUV : vec2<f32> = vec2<f32>(thread_id) / vec2<f32>(dims);
      let currentLatitude : f32 = mix(params.u_southLatitude, params.u_northLatitude, geographicUV.y);
      let sinLatitude : f32 = sin(currentLatitude);

      let mercatorY : f32 = 0.5 * log((1.0 + sinLatitude) / (1.0 - sinLatitude));
  
      // 使用模拟双精度技术计算mercatorY和u_southMercatorY的差值
      let t1 : f32 = 0.0 - params.u_southMercatorYLow;
      let e : f32 = t1 - 0.0;
      let t2 : f32 = ((-params.u_southMercatorYLow - e) + (0.0 - (t1 - e))) + mercatorY - params.u_southMercatorYHigh;
      let highDifference : f32 = t1 + t2;
      let lowDifference : f32 = t2 - (highDifference - t1);
  
      // 计算Web墨卡托UV坐标
      let webMercatorUV : vec2<f32> = vec2<f32>(geographicUV.x, highDifference * params.u_oneOverMercatorHeight + lowDifference * params.u_oneOverMercatorHeight);
  
      // 从输入纹理中采样颜色
      let color : vec4<f32> = textureSampleLevel(u_texture, samplerSrc, webMercatorUV,0.0);
      // let color : vec4<f32> = textureLoad(u_texture, webMercatorUV,0.0);
      // let color : vec4<f32> = vec4(1.0, 0.0, 0.0,0.0);
  
      // 将采样的颜色写入输出纹理
      let coords : vec2<i32> =  vec2<i32>(thread_id);
      textureStore(dest, coords, color);
  }
  
  
`;
  const cs1 = new ComputeShader("myCompute", engine, { computeSource: copyTextureComputeShader }, { bindingsMapping:
      {
          "dest": { group: 0, binding: 0 },
          "u_texture": { group: 0, binding: 2 },
          "params": { group: 0, binding: 3 }
      }
  });

  // const src = texture.internalTexture;
  const src = texture._texture;
  const dest = RawTexture.CreateRGBAStorageTexture(null, width, height, engine, false, false);

  cs1.setTexture("u_texture", src);
  cs1.setStorageTexture("dest", dest);
 const uBuffer = new UniformBuffer(engine);
 const float32ArrayScratch = new Float32Array(1);


 float32ArrayScratch[0] = southMercatorY;
 const southMercatorYHigh = float32ArrayScratch[0];
 const southMercatorYLow = southMercatorY - float32ArrayScratch[0];
//  uBuffer.updateMatrix('czm_viewportOrthographic', uniformState.viewportOrthographic );
uBuffer.addUniform("u_northLatitude", 1);
uBuffer.addUniform("u_southLatitude", 1);
uBuffer.addUniform("u_southMercatorYHigh", 1);
uBuffer.addUniform("u_southMercatorYLow", 1);
uBuffer.addUniform("u_oneOverMercatorHeight", 1);
 uBuffer.updateFloat ('u_northLatitude', north );
 uBuffer.updateFloat('u_southLatitude', south );
 uBuffer.updateFloat('u_southMercatorYHigh', southMercatorYHigh );
 uBuffer.updateFloat('u_southMercatorYLow', southMercatorYLow );
 uBuffer.updateFloat('u_oneOverMercatorHeight', oneOverMercatorHeight  );
  //  debugger
 uBuffer.update();

 cs1.setUniformBuffer("params", uBuffer);
  cs1.dispatchWhenReady(dest.getSize().width, dest.getSize().height, 1).then(() => {
    const outputTexture = new Texture({
      context: context,
      width: width,
      height: height,
      pixelFormat: texture.pixelFormat,
      pixelDatatype: texture.pixelDatatype,
      preMultiplyAlpha: texture.preMultiplyAlpha,
      source:{rawTexture:dest._texture
      }
    });
postExecute(outputTexture)
//       dest.readPixels().then((pixels) => {

// debugger


//       const canvas = document.createElement("canvas");
//       canvas.width = 256;
//       canvas.height = 256;
//       canvas.style.position = 'absolute';
//       canvas.style.bottom = '0px';
//       canvas.style.right = '0px';
//       canvas.style.zIndex = '256';
//       document.body.appendChild(canvas);
//       const w = 256; 
//       const h = 256;
//           console.log(pixels);
//         const ctx = canvas.getContext('2d');
//          const imgDataCtx = ctx.createImageData(w, h);
//          const data = imgDataCtx.data;
//          for (let i = 0; i < imgDataCtx.data.length; i += 1) {
//              data[i] = pixels[i];
//          }
//          ctx.putImageData(imgDataCtx, 0, 0);

        
//          const link = document.createElement('a');
//          link.download = 'filename.png';
//          link.href = canvas.toDataURL();
//          link.click();
//         //  document.body.removeChild(canvas);
//       });
  });
}
----------------
