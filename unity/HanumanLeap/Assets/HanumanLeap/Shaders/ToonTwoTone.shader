// Two-tone print shading for the Hanuman model and scenery (Built-in Render Pipeline).
// Each surface is either _LitColor or _ShadeColor, split by a slightly ragged terminator,
// with a little paper grain. Matches the web version's toon.ts.
Shader "HanumanLeap/ToonTwoTone"
{
    Properties
    {
        _LitColor ("Lit colour", Color) = (0.88, 0.57, 0.31, 1)
        _ShadeColor ("Shade colour", Color) = (0.14, 0.46, 0.52, 1)
        _Edge ("Terminator", Range(-1, 1)) = 0.05
        _Softness ("Edge softness", Range(0.001, 0.2)) = 0.02
        _Grain ("Grain", Range(0, 0.3)) = 0.09
        _Rim ("Rim light", Range(0, 2)) = 0.6
    }
    SubShader
    {
        Tags { "RenderType" = "Opaque" "Queue" = "Geometry" }
        Pass
        {
            Tags { "LightMode" = "ForwardBase" }
            Cull Off
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fog
            #include "UnityCG.cginc"

            fixed4 _LitColor;
            fixed4 _ShadeColor;
            float _Edge, _Softness, _Grain, _Rim;

            struct v2f
            {
                float4 pos : SV_POSITION;
                float3 normal : TEXCOORD0;
                float3 viewDir : TEXCOORD1;
                float4 screen : TEXCOORD2;
                UNITY_FOG_COORDS(3)
            };

            v2f vert (appdata_base v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.normal = UnityObjectToWorldNormal(v.normal);
                o.viewDir = WorldSpaceViewDir(v.vertex);
                o.screen = ComputeScreenPos(o.pos);
                UNITY_TRANSFER_FOG(o, o.pos);
                return o;
            }

            float hash (float2 p) { return frac(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453); }

            fixed4 frag (v2f i, fixed facing : VFACE) : SV_Target
            {
                float3 n = normalize(i.normal) * (facing > 0 ? 1 : -1);
                float ndl = dot(n, normalize(_WorldSpaceLightPos0.xyz));
                float2 px = i.screen.xy / max(i.screen.w, 1e-5) * _ScreenParams.xy;
                float g = hash(floor(px)) - 0.5;
                float t = smoothstep(_Edge - _Softness, _Edge + _Softness, ndl + g * _Grain * 0.5);
                fixed4 c = lerp(_ShadeColor, _LitColor, t);
                float rim = pow(1 - saturate(dot(n, normalize(i.viewDir))), 3) * _Rim * t * 0.25;
                c.rgb += rim + g * _Grain * 0.1;
                c.a = 1;
                UNITY_APPLY_FOG(i.fogCoord, c);
                return c;
            }
            ENDCG
        }
    }
    FallBack "Diffuse"
}
