using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    public GameObject startPanel;
    public GameObject gamePanel;
    public GameObject gameOverPanel;

    public Text scoreText;
    public Text startBestScoreText;
    public Text finalScoreText;
    public Text bestScoreText;
    public Text newBestLabel;

    public void ShowStartScreen(int highScore)
    {
        SetActivePanels(true, false, false);

        if (startBestScoreText != null)
        {
            startBestScoreText.text = "최고 점수: " + highScore;
        }
    }

    public void ShowGameScreen()
    {
        SetActivePanels(false, true, false);
    }

    public void ShowGameOverScreen(int score, int highScore, bool isNewBest)
    {
        SetActivePanels(false, false, true);

        if (finalScoreText != null)
        {
            finalScoreText.text = "점수: " + score;
        }

        if (bestScoreText != null)
        {
            bestScoreText.text = "최고 점수: " + highScore;
        }

        if (newBestLabel != null)
        {
            newBestLabel.gameObject.SetActive(isNewBest);
        }
    }

    public void UpdateScore(int score)
    {
        if (scoreText != null)
        {
            scoreText.text = score.ToString();
        }
    }

    private void SetActivePanels(bool start, bool game, bool over)
    {
        if (startPanel != null)
        {
            startPanel.SetActive(start);
        }

        if (gamePanel != null)
        {
            gamePanel.SetActive(game);
        }

        if (gameOverPanel != null)
        {
            gameOverPanel.SetActive(over);
        }
    }
}
