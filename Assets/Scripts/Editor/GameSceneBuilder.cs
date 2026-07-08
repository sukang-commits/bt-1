using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.Events;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public static class GameSceneBuilder
{
    private const string ScenesFolder = "Assets/Scenes";
    private const string PrefabsFolder = "Assets/Prefabs";
    private const string SpritesFolder = "Assets/Sprites/Generated";
    private const string ScenePath = ScenesFolder + "/GameScene.unity";
    private const string ObstaclePrefabPath = PrefabsFolder + "/Obstacle.prefab";

    private const float OrthoSize = 5f;
    private const float GroundTopY = -3.5f;
    private const float GroundThickness = 1f;
    private const float GroundWidth = 40f;
    private const float PlayerRadius = 0.5f;
    private const float PlayerStartX = -2f;

    [MenuItem("Tools/병아리 점프 게임/게임 씬 자동 생성")]
    public static void BuildGameScene()
    {
        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
        {
            return;
        }

        EnsureFolders();
        EnsureTags();
        ConfigurePlayerSettings();

        Sprite circleSprite = GetOrCreateSprite(SpritesFolder + "/circle.png", true);
        Sprite squareSprite = GetOrCreateSprite(SpritesFolder + "/square.png", false);

        Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        CreateCamera();
        CreateBackground(squareSprite);
        CreateGround(squareSprite);

        var playerInfo = CreatePlayer(circleSprite);
        PlayerController playerController = playerInfo.controller;
        Collider2D playerCollider = playerInfo.collider;

        GameObject obstaclePrefab = CreateObstaclePrefab(squareSprite);
        GameObject obstacleContainer = new GameObject("Obstacles");
        ObstacleSpawner spawner = CreateSpawner(obstaclePrefab, obstacleContainer.transform, playerCollider);

        Button startButton;
        Button restartButton;
        UIManager uiManager = CreateCanvas(out startButton, out restartButton);

        GameManager gameManager = CreateGameManager(uiManager, spawner, playerController);

        UnityEventTools.AddPersistentListener(startButton.onClick, gameManager.StartGame);
        UnityEventTools.AddPersistentListener(restartButton.onClick, gameManager.RestartGame);

        EditorUtility.SetDirty(gameManager);
        EditorUtility.SetDirty(uiManager);

        Directory.CreateDirectory(ScenesFolder);
        EditorSceneManager.SaveScene(scene, ScenePath);
        AddSceneToBuildSettings(ScenePath);
        AssetDatabase.SaveAssets();

        Debug.Log("병아리 점프 게임 씬 생성 완료: " + ScenePath);
    }

    private static void ConfigurePlayerSettings()
    {
        PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
        PlayerSettings.allowedAutorotateToPortrait = true;
        PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
        PlayerSettings.allowedAutorotateToLandscapeLeft = false;
        PlayerSettings.allowedAutorotateToLandscapeRight = false;
    }

    private static void EnsureFolders()
    {
        CreateFolderIfMissing("Assets", "Scenes");
        CreateFolderIfMissing("Assets", "Prefabs");
        CreateFolderIfMissing("Assets", "Sprites");
        CreateFolderIfMissing("Assets/Sprites", "Generated");
    }

    private static void CreateFolderIfMissing(string parent, string folderName)
    {
        string full = parent + "/" + folderName;
        if (!AssetDatabase.IsValidFolder(full))
        {
            AssetDatabase.CreateFolder(parent, folderName);
        }
    }

    private static void EnsureTags()
    {
        // "Player" and "MainCamera" are already built-in Unity tags; only these two are custom.
        AddTagIfMissing("Ground");
        AddTagIfMissing("Obstacle");
    }

    private static void AddTagIfMissing(string tag)
    {
        Object[] assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
        if (assets == null || assets.Length == 0)
        {
            return;
        }

        SerializedObject tagManager = new SerializedObject(assets[0]);
        SerializedProperty tagsProp = tagManager.FindProperty("tags");
        if (tagsProp == null)
        {
            return;
        }

        for (int i = 0; i < tagsProp.arraySize; i++)
        {
            if (tagsProp.GetArrayElementAtIndex(i).stringValue == tag)
            {
                return;
            }
        }

        tagsProp.InsertArrayElementAtIndex(tagsProp.arraySize);
        tagsProp.GetArrayElementAtIndex(tagsProp.arraySize - 1).stringValue = tag;
        tagManager.ApplyModifiedProperties();
    }

    // Arial.ttf was removed from newer editor versions; LegacyRuntime.ttf is the safe built-in fallback.
    private static Font GetDefaultFont()
    {
        return Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
    }

    private static Sprite GetOrCreateSprite(string path, bool circle)
    {
        Sprite existing = AssetDatabase.LoadAssetAtPath<Sprite>(path);
        if (existing != null)
        {
            return existing;
        }

        const int size = 128;
        Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
        Vector2 center = new Vector2(size / 2f, size / 2f);
        float radius = size / 2f - 2f;

        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                bool opaque = true;
                if (circle)
                {
                    float dist = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), center);
                    opaque = dist <= radius;
                }
                tex.SetPixel(x, y, opaque ? new Color(1f, 1f, 1f, 1f) : new Color(1f, 1f, 1f, 0f));
            }
        }
        tex.Apply();

        byte[] png = tex.EncodeToPNG();
        Object.DestroyImmediate(tex);

        Directory.CreateDirectory(Path.GetDirectoryName(path));
        File.WriteAllBytes(path, png);
        AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);

        TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
        if (importer != null)
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = size;
            importer.alphaIsTransparency = true;
            importer.mipmapEnabled = false;
            importer.filterMode = FilterMode.Bilinear;
            EditorUtility.SetDirty(importer);
            importer.SaveAndReimport();
        }

        return AssetDatabase.LoadAssetAtPath<Sprite>(path);
    }

    private static void CreateCamera()
    {
        GameObject camGO = new GameObject("Main Camera");
        camGO.tag = "MainCamera";
        Camera cam = camGO.AddComponent<Camera>();
        cam.orthographic = true;
        cam.orthographicSize = OrthoSize;
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.55f, 0.8f, 0.95f);
        camGO.transform.position = new Vector3(0f, 0f, -10f);
        camGO.AddComponent<AudioListener>();
    }

    private static void CreateBackground(Sprite sprite)
    {
        GameObject bgGO = new GameObject("Background");
        SpriteRenderer sr = bgGO.AddComponent<SpriteRenderer>();
        sr.sprite = sprite;
        sr.color = new Color(0.55f, 0.8f, 0.95f);
        sr.sortingOrder = -10;
        bgGO.transform.position = Vector3.zero;
        bgGO.transform.localScale = new Vector3(GroundWidth, 20f, 1f);
    }

    private static void CreateGround(Sprite sprite)
    {
        GameObject groundGO = new GameObject("Ground");
        groundGO.tag = "Ground";

        SpriteRenderer sr = groundGO.AddComponent<SpriteRenderer>();
        sr.sprite = sprite;
        sr.color = new Color(0.55f, 0.35f, 0.2f);
        sr.sortingOrder = 1;

        groundGO.AddComponent<BoxCollider2D>();

        groundGO.transform.position = new Vector3(0f, GroundTopY - GroundThickness / 2f, 0f);
        groundGO.transform.localScale = new Vector3(GroundWidth, GroundThickness, 1f);
    }

    private struct PlayerInfo
    {
        public PlayerController controller;
        public Collider2D collider;
    }

    private static PlayerInfo CreatePlayer(Sprite sprite)
    {
        GameObject playerGO = new GameObject("Chicken");
        playerGO.tag = "Player";

        SpriteRenderer sr = playerGO.AddComponent<SpriteRenderer>();
        sr.sprite = sprite;
        sr.color = new Color(1f, 0.85f, 0.2f);
        sr.sortingOrder = 5;

        CircleCollider2D col = playerGO.AddComponent<CircleCollider2D>();
        col.radius = PlayerRadius;

        Rigidbody2D rb = playerGO.AddComponent<Rigidbody2D>();
        rb.gravityScale = 4f;
        rb.constraints = RigidbodyConstraints2D.FreezeRotation;
        rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
        rb.interpolation = RigidbodyInterpolation2D.Interpolate;

        PlayerController controller = playerGO.AddComponent<PlayerController>();

        playerGO.transform.position = new Vector3(PlayerStartX, GroundTopY + PlayerRadius, 0f);

        return new PlayerInfo { controller = controller, collider = col };
    }

    private static GameObject CreateObstaclePrefab(Sprite sprite)
    {
        GameObject existing = AssetDatabase.LoadAssetAtPath<GameObject>(ObstaclePrefabPath);
        if (existing != null)
        {
            return existing;
        }

        GameObject obstacleGO = new GameObject("Obstacle");
        obstacleGO.tag = "Obstacle";

        SpriteRenderer sr = obstacleGO.AddComponent<SpriteRenderer>();
        sr.sprite = sprite;
        sr.color = new Color(0.2f, 0.6f, 0.25f);
        sr.sortingOrder = 4;

        obstacleGO.AddComponent<BoxCollider2D>();
        obstacleGO.AddComponent<Obstacle>();

        obstacleGO.transform.localScale = new Vector3(0.6f, 1f, 1f);

        Directory.CreateDirectory(PrefabsFolder);
        GameObject prefab = PrefabUtility.SaveAsPrefabAsset(obstacleGO, ObstaclePrefabPath);
        Object.DestroyImmediate(obstacleGO);

        return prefab;
    }

    private static ObstacleSpawner CreateSpawner(GameObject obstaclePrefab, Transform container, Collider2D playerCollider)
    {
        GameObject spawnerGO = new GameObject("ObstacleSpawner");
        ObstacleSpawner spawner = spawnerGO.AddComponent<ObstacleSpawner>();
        spawner.obstaclePrefab = obstaclePrefab;
        spawner.obstacleContainer = container;
        spawner.playerCollider = playerCollider;
        spawner.groundY = GroundTopY;
        return spawner;
    }

    private static UIManager CreateCanvas(out Button startButton, out Button restartButton)
    {
        new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));

        GameObject canvasGO = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        Canvas canvas = canvasGO.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;

        CanvasScaler scaler = canvasGO.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1080f, 1920f);
        scaler.matchWidthOrHeight = 0.5f;

        GameObject startPanel = CreateFullscreenPanel("StartPanel", canvasGO.transform);
        CreateText("Title", startPanel.transform, "병아리 점프", 90, TextAnchor.MiddleCenter,
            new Vector2(0.5f, 0.75f), new Vector2(800f, 200f), Color.black);
        Text startBest = CreateText("BestScoreText", startPanel.transform, "최고 점수: 0", 48, TextAnchor.MiddleCenter,
            new Vector2(0.5f, 0.6f), new Vector2(800f, 100f), Color.black);
        startButton = CreateButton("StartButton", startPanel.transform, "시작하기",
            new Vector2(0.5f, 0.35f), new Vector2(400f, 140f));

        GameObject gamePanel = CreateFullscreenPanel("GamePanel", canvasGO.transform);
        Text scoreText = CreateText("ScoreText", gamePanel.transform, "0", 100, TextAnchor.UpperCenter,
            new Vector2(0.5f, 0.92f), new Vector2(400f, 150f), Color.black);
        gamePanel.SetActive(false);

        GameObject gameOverPanel = CreateFullscreenPanel("GameOverPanel", canvasGO.transform);
        CreateText("GameOverTitle", gameOverPanel.transform, "게임 오버", 90, TextAnchor.MiddleCenter,
            new Vector2(0.5f, 0.75f), new Vector2(800f, 200f), Color.black);
        Text finalScoreText = CreateText("FinalScoreText", gameOverPanel.transform, "점수: 0", 60, TextAnchor.MiddleCenter,
            new Vector2(0.5f, 0.6f), new Vector2(800f, 100f), Color.black);
        Text bestScoreText = CreateText("BestScoreText", gameOverPanel.transform, "최고 점수: 0", 48, TextAnchor.MiddleCenter,
            new Vector2(0.5f, 0.5f), new Vector2(800f, 100f), Color.black);
        Text newBestLabel = CreateText("NewBestLabel", gameOverPanel.transform, "신기록!", 48, TextAnchor.MiddleCenter,
            new Vector2(0.5f, 0.43f), new Vector2(800f, 80f), new Color(0.9f, 0.2f, 0.2f));
        newBestLabel.gameObject.SetActive(false);
        restartButton = CreateButton("RestartButton", gameOverPanel.transform, "다시하기",
            new Vector2(0.5f, 0.3f), new Vector2(400f, 140f));
        gameOverPanel.SetActive(false);

        GameObject uiManagerGO = new GameObject("UIManager");
        UIManager uiManager = uiManagerGO.AddComponent<UIManager>();
        uiManager.startPanel = startPanel;
        uiManager.gamePanel = gamePanel;
        uiManager.gameOverPanel = gameOverPanel;
        uiManager.scoreText = scoreText;
        uiManager.startBestScoreText = startBest;
        uiManager.finalScoreText = finalScoreText;
        uiManager.bestScoreText = bestScoreText;
        uiManager.newBestLabel = newBestLabel;

        return uiManager;
    }

    private static GameObject CreateFullscreenPanel(string name, Transform parent)
    {
        GameObject go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);
        RectTransform rt = go.GetComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
        return go;
    }

    // anchor is used as both the normalized anchor point and the pivot; anchoredPosition stays zero so
    // the element sits exactly at that point in the panel.
    private static Text CreateText(string name, Transform parent, string content, int fontSize, TextAnchor alignment,
        Vector2 anchor, Vector2 sizeDelta, Color color)
    {
        GameObject go = new GameObject(name, typeof(RectTransform));
        go.transform.SetParent(parent, false);

        Text text = go.AddComponent<Text>();
        text.font = GetDefaultFont();
        text.text = content;
        text.fontSize = fontSize;
        text.alignment = alignment;
        text.color = color;
        text.raycastTarget = false;
        text.horizontalOverflow = HorizontalWrapMode.Overflow;
        text.verticalOverflow = VerticalWrapMode.Overflow;

        RectTransform rt = text.rectTransform;
        rt.anchorMin = anchor;
        rt.anchorMax = anchor;
        rt.pivot = new Vector2(0.5f, 0.5f);
        rt.anchoredPosition = Vector2.zero;
        rt.sizeDelta = sizeDelta;

        return text;
    }

    private static Button CreateButton(string name, Transform parent, string label, Vector2 anchor, Vector2 sizeDelta)
    {
        GameObject go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
        go.transform.SetParent(parent, false);

        RectTransform rt = go.GetComponent<RectTransform>();
        rt.anchorMin = anchor;
        rt.anchorMax = anchor;
        rt.pivot = new Vector2(0.5f, 0.5f);
        rt.anchoredPosition = Vector2.zero;
        rt.sizeDelta = sizeDelta;

        Image image = go.GetComponent<Image>();
        image.color = new Color(1f, 0.85f, 0.3f);

        Button button = go.GetComponent<Button>();
        button.targetGraphic = image;

        Text text = CreateText(name + "Label", go.transform, label, 48, TextAnchor.MiddleCenter,
            new Vector2(0.5f, 0.5f), Vector2.zero, Color.black);
        RectTransform textRt = text.rectTransform;
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.offsetMin = Vector2.zero;
        textRt.offsetMax = Vector2.zero;

        return button;
    }

    private static GameManager CreateGameManager(UIManager uiManager, ObstacleSpawner spawner, PlayerController player)
    {
        GameObject gmGO = new GameObject("GameManager");
        GameManager gameManager = gmGO.AddComponent<GameManager>();
        gameManager.uiManager = uiManager;
        gameManager.obstacleSpawner = spawner;
        gameManager.player = player;
        return gameManager;
    }

    private static void AddSceneToBuildSettings(string path)
    {
        List<EditorBuildSettingsScene> scenes = new List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);
        if (scenes.Exists(s => s.path == path))
        {
            return;
        }

        scenes.Add(new EditorBuildSettingsScene(path, true));
        EditorBuildSettings.scenes = scenes.ToArray();
    }
}
