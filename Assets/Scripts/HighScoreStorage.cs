using UnityEngine;

public static class HighScoreStorage
{
    private const string HighScoreKey = "ChickenJump_HighScore";

    public static int Load()
    {
        return PlayerPrefs.GetInt(HighScoreKey, 0);
    }

    public static bool SaveIfHigher(int score)
    {
        int current = Load();
        if (score <= current)
        {
            return false;
        }

        PlayerPrefs.SetInt(HighScoreKey, score);
        PlayerPrefs.Save();
        return true;
    }
}
