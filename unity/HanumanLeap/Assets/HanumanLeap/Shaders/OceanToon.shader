// Two-tone ocean surface: teal lit / deep teal shade, cream foam on crests and a sun glint.
// The wave shape itself is moved on the CPU by OceanSurface.cs, so this stays simple.
Shader "HanumanLeap/OceanToon"
{
    Properties
    {
        _LitColor ("Lit", Color) = (0.17, 0.53, 0.59, 1)
        _ShadeColor ("Shade", Color) = (0.07, 0.31, 0.37, 1)
        _FoamColor ("Foam", Color) = (0.95, 0.94, 0.86, 1)
        _FoamHeight ("Foam height", Float) = 3.4
        _Edge ("Terminator", Range(0, 1)) = 0.88
    }
    SubShader
    {
        Tags { "RenderType" = "Opaque" }
        Pass
        {
            Tags { "LightMode" = "ForwardBase" }
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog
            #include "UnityCG.cginc"
            fixed4 _LitColor, _ShadeColor, _FoamColor;
            float _FoamHeight, _Edge;
            struct v2f { float4 pos : SV_POSITION; float3 n : TEXCOORD0; float3 w : TEXCOORD1; UNITY_FOG_COORDS(2) };
            v2f vert (appdata_base v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.n = UnityObjectToWorldNormal(v.normal);
                o.w = mul(unity_ObjectToWorld, v.vertex).xyz;
                UNITY_TRANSFER_FOG(o, o.pos);
                return o;
            }
            float hash (float2 p) { return frac(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453); }
            fixed4 frag (v2f i) : SV_Target
            {
                float3 n = normalize(i.n);
                float3 l = normalize(_WorldSpaceLightPos0.xyz);
                float t = smoothstep(_Edge - 0.02, _Edge + 0.02, dot(n, l));
                fixed4 c = lerp(_ShadeColor, _LitColor, t);
                float foam = smoothstep(_FoamHeight, _FoamHeight + 1.2, i.w.y + hash(floor(i.w.xz * 0.35)) * 1.2);
                c = lerp(c, _FoamColor, foam * 0.85);
                float3 v = normalize(_WorldSpaceCameraPos - i.w);
                float sp = pow(saturate(dot(reflect(-v, n), l)), 220);
                c.rgb = lerp(c.rgb, float3(1, 0.93, 0.72), step(0.35, sp) * 0.9);
                UNITY_APPLY_FOG(i.fogCoord, c);
                return c;
            }
            ENDCG
        }
    }
}
