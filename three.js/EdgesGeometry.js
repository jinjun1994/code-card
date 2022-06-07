import { BufferGeometry } from 'three';
import { Float32BufferAttribute } from 'three';
import { MathUtils } from 'three';
import { Triangle } from 'three';
import { Vector3 } from 'three';

const _v0 = new Vector3();
const _v1 = new Vector3();
const _normal = new Vector3();
const _triangle = new Triangle();
const _batchid = [ 0, 0, 0 ];

class EdgesGeometry extends BufferGeometry {

  constructor(geometry, thresholdAngle) {

    super();

    this.type = 'EdgesGeometry';

    this.parameters = {
      thresholdAngle,
    };

    thresholdAngle = (thresholdAngle !== undefined) ? thresholdAngle : 1;

    if (geometry.isGeometry === true) {

      console.error('THREE.EdgesGeometry no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.');
      return;

    }

    const precisionPoints = 4;
    const precision = Math.pow(10, precisionPoints);
    const thresholdDot = Math.cos(MathUtils.DEG2RAD * thresholdAngle);

    const indexAttr = geometry.getIndex();
    const positionAttr = geometry.getAttribute('position');
    const _batchidAttr = geometry.getAttribute('_batchid');
    const indexCount = indexAttr ? indexAttr.count : positionAttr.count;

    const indexArr = [ 0, 0, 0 ];
    const vertKeys = [ 'a', 'b', 'c' ];
    const hashes = new Array(3);

    const edgeData = {};
    const vertices = [];
    const _batchids = [];
    for (let i = 0; i < indexCount; i += 3) {

      if (indexAttr) {

        indexArr[ 0 ] = indexAttr.getX(i);
        indexArr[ 1 ] = indexAttr.getX(i + 1);
        indexArr[ 2 ] = indexAttr.getX(i + 2);

      } else {

        indexArr[ 0 ] = i;
        indexArr[ 1 ] = i + 1;
        indexArr[ 2 ] = i + 2;

      }

      const { a, b, c } = _triangle;
      a.fromBufferAttribute(positionAttr, indexArr[ 0 ]);
      b.fromBufferAttribute(positionAttr, indexArr[ 1 ]);
      c.fromBufferAttribute(positionAttr, indexArr[ 2 ]);

      _batchid[0] = _batchidAttr.getX(indexArr[0]);
      _batchid[1] = _batchidAttr.getX(indexArr[1]);
      _batchid[2] = _batchidAttr.getX(indexArr[2]);


      _triangle.getNormal(_normal);

      // create hashes for the edge from the vertices
      hashes[ 0 ] = `${Math.round(a.x * precision)},${Math.round(a.y * precision)},${Math.round(a.z * precision)}`;
      hashes[ 1 ] = `${Math.round(b.x * precision)},${Math.round(b.y * precision)},${Math.round(b.z * precision)}`;
      hashes[ 2 ] = `${Math.round(c.x * precision)},${Math.round(c.y * precision)},${Math.round(c.z * precision)}`;

      // skip degenerate triangles
      if (hashes[ 0 ] === hashes[ 1 ] || hashes[ 1 ] === hashes[ 2 ] || hashes[ 2 ] === hashes[ 0 ]) {

        continue;

      }

      // iterate over every edge
      for (let j = 0; j < 3; j++) {

        // get the first and next vertex making up the edge
        const jNext = (j + 1) % 3;
        const vecHash0 = hashes[ j ];
        const vecHash1 = hashes[ jNext ];
        const v0 = _triangle[ vertKeys[ j ] ];
        const v1 = _triangle[ vertKeys[ jNext ] ];

        const b0 = _batchid[ j ];
        const b1 = _batchid[ jNext ];

        const hash = `${vecHash0}_${vecHash1}`;
        const reverseHash = `${vecHash1}_${vecHash0}`;

        if (reverseHash in edgeData && edgeData[ reverseHash ]) {

          // if we found a sibling edge add it into the vertex array if
          // it meets the angle threshold and delete the edge from the map.
          if (_normal.dot(edgeData[ reverseHash ].normal) <= thresholdDot) {

            vertices.push(v0.x, v0.y, v0.z);
            vertices.push(v1.x, v1.y, v1.z);
            _batchids.push(b0);
            _batchids.push(b1);

          }

          edgeData[ reverseHash ] = null;

        } else if (!(hash in edgeData)) {

          // if we've already got an edge here then skip adding a new one
          edgeData[ hash ] = {

            index0: indexArr[ j ],
            index1: indexArr[ jNext ],
            normal: _normal.clone(),
            b0,
            b1,
          };

        }

      }

    }

    // iterate over all remaining, unmatched edges and add them to the vertex array
    for (const key in edgeData) {

      if (edgeData[ key ]) {

        const { index0, index1, b0, b1 } = edgeData[ key ];
        _v0.fromBufferAttribute(positionAttr, index0);
        _v1.fromBufferAttribute(positionAttr, index1);

        vertices.push(_v0.x, _v0.y, _v0.z);
        vertices.push(_v1.x, _v1.y, _v1.z);
        _batchids.push(b0);
        _batchids.push(b1);

      }

    }

    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('_batchid', new Float32BufferAttribute(_batchids, 1));

  }

}

export { EdgesGeometry };
