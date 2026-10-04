using UnityEngine;

namespace HanumanLeap
{
    /// <summary>
    /// Flight controller for the imported Hanuman model.
    /// Put this on an empty "Hanuman Flight" object and make the imported Hanuman.glb its child.
    /// Steer with WASD / arrows (or a gamepad stick), hold Space or Shift to boost,
    /// Q / E to shrink and grow. Plays the model's baked "Fly" / "FlyBoost" clips.
    /// </summary>
    public class HanumanFlight : MonoBehaviour
    {
        [Header("Model")]
        [Tooltip("The imported Hanuman.glb instance (child of this object).")]
        public Transform model;
        [Tooltip("Extra yaw applied to the model if it faces the wrong way after import.")]
        public float modelYawOffset = 0f;

        [Header("Speed")]
        public float cruiseSpeed = 60f;
        public float boostSpeed = 120f;
        public float acceleration = 1.6f;

        [Header("Steering")]
        public float strafeSpeed = 70f;
        public float climbSpeed = 55f;
        public float responsiveness = 2.5f;
        public float maxBank = 30f;
        public float maxPitch = 18f;
        public Vector2 altitudeRange = new Vector2(10f, 330f);
        public float corridorHalfWidth = 420f;

        [Header("Size (he can grow and shrink)")]
        public float size = 3f;
        public float minSize = 0.3f;
        public float maxSize = 7f;
        public float growRate = 1.2f;

        public float Speed { get; private set; }
        public float Distance { get; private set; }

        Vector2 _vel;
        float _bank, _pitch;
        Animation _legacy;
        Animator _animator;
        Vector3 _start;
        bool _boosting;

        void Start()
        {
            if (model == null && transform.childCount > 0) model = transform.GetChild(0);
            _start = transform.position;
            Speed = cruiseSpeed;
            if (model != null)
            {
                _legacy = model.GetComponentInChildren<Animation>();
                _animator = model.GetComponentInChildren<Animator>();
            }
            PlayClip("Fly");
        }

        void Update()
        {
            float dt = Time.deltaTime;
            float h = Input.GetAxis("Horizontal");
            float v = Input.GetAxis("Vertical");
            bool boost = Input.GetKey(KeyCode.Space) || Input.GetKey(KeyCode.LeftShift);
            float grow = (Input.GetKey(KeyCode.E) ? 1f : 0f) - (Input.GetKey(KeyCode.Q) ? 1f : 0f);

            size = Mathf.Clamp(size * (1f + grow * growRate * dt), minSize, maxSize);
            Speed = Mathf.Lerp(Speed, boost ? boostSpeed : cruiseSpeed, 1f - Mathf.Exp(-acceleration * dt));
            _vel = Vector2.Lerp(_vel, new Vector2(h * strafeSpeed, v * climbSpeed), 1f - Mathf.Exp(-responsiveness * dt));

            Vector3 p = transform.position;
            p += Vector3.forward * Speed * dt;
            p.x = Mathf.Clamp(p.x + _vel.x * dt, _start.x - corridorHalfWidth, _start.x + corridorHalfWidth);
            p.y = Mathf.Clamp(p.y + _vel.y * dt, altitudeRange.x, altitudeRange.y);
            transform.position = p;
            Distance = p.z - _start.z;

            _bank = Mathf.Lerp(_bank, -h * maxBank, 1f - Mathf.Exp(-3f * dt));
            _pitch = Mathf.Lerp(_pitch, -v * maxPitch, 1f - Mathf.Exp(-3f * dt));
            if (model != null)
            {
                model.localScale = Vector3.one * size;
                model.localRotation = Quaternion.Euler(_pitch, modelYawOffset, _bank);
            }

            if (boost != _boosting) { _boosting = boost; PlayClip(boost ? "FlyBoost" : "Fly"); }
        }

        void PlayClip(string clip)
        {
            if (_legacy != null && _legacy.GetClip(clip) != null)
            {
                _legacy.wrapMode = WrapMode.Loop;
                _legacy.CrossFade(clip, 0.4f);
            }
            else if (_animator != null && _animator.runtimeAnimatorController != null)
            {
                _animator.CrossFadeInFixedTime(clip, 0.4f);
            }
        }
    }
}
