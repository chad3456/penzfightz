#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace HanumanLeap.EditorTools
{
    /// <summary>
    /// Menu: Tools ▸ Hanuman Leap ▸ Apply Two-Tone Look to Selection.
    /// Replaces the glTF PBR materials on the selected imported model with
    /// HanumanLeap/ToonTwoTone materials, choosing lit/shade colours by material name.
    /// </summary>
    public static class HanumanToonSetup
    {
        static readonly Dictionary<string, (string lit, string shade)> Palette = new Dictionary<string, (string, string)>
        {
            { "Skin", ("#e0914f", "#247684") },
            { "SkinLight", ("#ecab72", "#247684") },
            { "Gold", ("#d4b073", "#6c6648") },
            { "GoldDark", ("#a88f55", "#3b3826") },
            { "Cloth", ("#c35b24", "#0f2030") },
            { "ClothDark", ("#1d3a4c", "#001621") },
            { "Hair", ("#173246", "#001621") },
            { "Eye", ("#f6f2e2", "#c9cdb8") },
            { "Pupil", ("#001621", "#001621") },
            { "Mouth", ("#9c3b23", "#4a1d16") },
        };

        [MenuItem("Tools/Hanuman Leap/Apply Two-Tone Look to Selection")]
        static void Apply()
        {
            var shader = Shader.Find("HanumanLeap/ToonTwoTone");
            if (shader == null) { Debug.LogError("Shader HanumanLeap/ToonTwoTone not found."); return; }
            const string folder = "Assets/HanumanLeap/Materials";
            if (!AssetDatabase.IsValidFolder(folder)) AssetDatabase.CreateFolder("Assets/HanumanLeap", "Materials");
            var made = new Dictionary<string, Material>();
            int count = 0;
            foreach (var go in Selection.gameObjects)
            {
                foreach (var r in go.GetComponentsInChildren<Renderer>(true))
                {
                    var mats = r.sharedMaterials;
                    for (int i = 0; i < mats.Length; i++)
                    {
                        if (mats[i] == null) continue;
                        string key = mats[i].name.Replace(" (Instance)", "");
                        if (!Palette.TryGetValue(key, out var pair)) continue;
                        if (!made.TryGetValue(key, out var m))
                        {
                            string path = $"{folder}/Toon_{key}.mat";
                            m = AssetDatabase.LoadAssetAtPath<Material>(path);
                            if (m == null) { m = new Material(shader); AssetDatabase.CreateAsset(m, path); }
                            ColorUtility.TryParseHtmlString(pair.lit, out var lit);
                            ColorUtility.TryParseHtmlString(pair.shade, out var shade);
                            m.SetColor("_LitColor", lit);
                            m.SetColor("_ShadeColor", shade);
                            made[key] = m;
                        }
                        mats[i] = m;
                        count++;
                    }
                    r.sharedMaterials = mats;
                }
            }
            AssetDatabase.SaveAssets();
            Debug.Log($"Hanuman Leap: replaced {count} material slots with two-tone materials.");
        }
    }
}
#endif
