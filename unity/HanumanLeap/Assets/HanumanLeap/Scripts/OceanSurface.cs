using UnityEngine;

namespace HanumanLeap
{
    /// <summary>
    /// A procedural ocean: a grid mesh whose vertices follow four summed sine waves
    /// (the same set as the web version). The grid follows the camera so the sea never ends.
    /// Give it the HanumanLeap/OceanToon material.
    /// </summary>
    [RequireComponent(typeof(MeshFilter), typeof(MeshRenderer))]
    public class OceanSurface : MonoBehaviour
    {
        public Transform follow;
        public float size = 3000f;
        [Range(16, 250)] public int resolution = 160;
        public float snap = 20f;

        // wavenumber, direction (radians), amplitude, angular speed
        static readonly Vector4[] Waves =
        {
            new Vector4(0.012f, 0.0f, 3.2f, 1.1f),
            new Vector4(0.021f, 0.9f, 1.6f, 1.6f),
            new Vector4(0.034f, 2.1f, 0.9f, 2.1f),
            new Vector4(0.055f, 4.0f, 0.45f, 2.8f),
        };

        Mesh _mesh;
        Vector3[] _base, _verts, _normals;

        void Start()
        {
            _mesh = new Mesh { indexFormat = UnityEngine.Rendering.IndexFormat.UInt32 };
            int n = resolution + 1;
            _base = new Vector3[n * n];
            var uv = new Vector2[n * n];
            var tris = new int[resolution * resolution * 6];
            for (int z = 0; z < n; z++)
                for (int x = 0; x < n; x++)
                {
                    _base[z * n + x] = new Vector3((x / (float)resolution - 0.5f) * size, 0f, (z / (float)resolution - 0.5f) * size);
                    uv[z * n + x] = new Vector2(x / (float)resolution, z / (float)resolution);
                }
            int t = 0;
            for (int z = 0; z < resolution; z++)
                for (int x = 0; x < resolution; x++)
                {
                    int i = z * n + x;
                    tris[t++] = i; tris[t++] = i + n; tris[t++] = i + 1;
                    tris[t++] = i + 1; tris[t++] = i + n; tris[t++] = i + n + 1;
                }
            _verts = new Vector3[_base.Length];
            _normals = new Vector3[_base.Length];
            _mesh.vertices = _base;
            _mesh.uv = uv;
            _mesh.triangles = tris;
            GetComponent<MeshFilter>().sharedMesh = _mesh;
        }

        void LateUpdate()
        {
            if (follow != null)
            {
                Vector3 f = follow.position;
                transform.position = new Vector3(Mathf.Round(f.x / snap) * snap, transform.position.y, Mathf.Round(f.z / snap) * snap);
            }
            float time = Time.time;
            Vector3 o = transform.position;
            for (int i = 0; i < _base.Length; i++)
            {
                float wx = _base[i].x + o.x, wz = _base[i].z + o.z;
                float h = 0f, gx = 0f, gz = 0f;
                for (int k = 0; k < Waves.Length; k++)
                {
                    Vector4 w = Waves[k];
                    float dx = Mathf.Cos(w.y), dz = Mathf.Sin(w.y);
                    float ph = (dx * wx + dz * wz) * w.x + time * w.w;
                    h += w.z * Mathf.Sin(ph);
                    float c = w.z * w.x * Mathf.Cos(ph);
                    gx += c * dx; gz += c * dz;
                }
                _verts[i] = new Vector3(_base[i].x, h, _base[i].z);
                _normals[i] = new Vector3(-gx, 1f, -gz).normalized;
            }
            _mesh.vertices = _verts;
            _mesh.normals = _normals;
            _mesh.RecalculateBounds();
        }
    }
}
