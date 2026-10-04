using UnityEngine;

namespace HanumanLeap
{
    /// <summary>A smooth chase camera that scales its distance with Hanuman's size. Press C to cycle shots.</summary>
    public class ChaseCamera : MonoBehaviour
    {
        public HanumanFlight target;
        public float smoothing = 4f;
        int _shot;
        Vector3 _look;

        static readonly Vector3[] Offsets =
        {
            new Vector3(0f, 1.7f, -6.5f),   // chase
            new Vector3(-8f, 1.2f, 1.5f),   // side
            new Vector3(-2.5f, 1.3f, 9f),   // front, looking back at him
            new Vector3(4f, -3f, -8f),      // low over the water
        };

        void LateUpdate()
        {
            if (target == null) return;
            if (Input.GetKeyDown(KeyCode.C)) _shot = (_shot + 1) % Offsets.Length;
            float s = Mathf.Max(0.8f, target.size);
            Vector3 p = target.transform.position;
            Vector3 want = p + Offsets[_shot] * s;
            want.y = Mathf.Max(want.y, 4f);
            Vector3 at = _shot == 2 ? p + Vector3.up * 0.5f * s : p + new Vector3(0f, 0.6f * s, 12f * s);
            float k = 1f - Mathf.Exp(-smoothing * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, want, k);
            _look = Vector3.Lerp(_look == Vector3.zero ? at : _look, at, k);
            transform.LookAt(_look);
        }
    }
}
