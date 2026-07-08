using UnityEngine;

public class GameManager : MonoBehaviour
{
    public enum GameState
    {
        MainMenu,
        Playing,
        GameOver
    }

    public static GameManager Instance { get; private set; }

    public UIManager uiManager;
    public ObstacleSpawner obstacleSpawner;
    public PlayerController player;

    public GameState CurrentState { get; private set; } = GameState.MainMenu;
    public int Score { get; private set; }
    public int HighScore { get; private set; }

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        HighScore = HighScoreStorage.Load();
    }

    private void Start()
    {
        CurrentState = GameState.MainMenu;

        if (uiManager != null)
        {
            uiManager.ShowStartScreen(HighScore);
        }
    }

    public void StartGame()
    {
        Score = 0;
        CurrentState = GameState.Playing;

        if (player != null)
        {
            player.ResetPlayer();
        }

        if (obstacleSpawner != null)
        {
            obstacleSpawner.ClearObstacles();
            obstacleSpawner.StartSpawning();
        }

        if (uiManager != null)
        {
            uiManager.UpdateScore(Score);
            uiManager.ShowGameScreen();
        }
    }

    public void RestartGame()
    {
        StartGame();
    }

    public void AddScore()
    {
        if (CurrentState != GameState.Playing)
        {
            return;
        }

        Score++;

        if (uiManager != null)
        {
            uiManager.UpdateScore(Score);
        }
    }

    public void OnPlayerDied()
    {
        if (CurrentState != GameState.Playing)
        {
            return;
        }

        CurrentState = GameState.GameOver;

        if (obstacleSpawner != null)
        {
            obstacleSpawner.StopSpawning();
        }

        bool isNewBest = HighScoreStorage.SaveIfHigher(Score);
        HighScore = HighScoreStorage.Load();

        if (uiManager != null)
        {
            uiManager.ShowGameOverScreen(Score, HighScore, isNewBest);
        }
    }
}
