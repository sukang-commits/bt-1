using System.Collections;
using UnityEngine;

public class ObstacleSpawner : MonoBehaviour
{
    public GameObject obstaclePrefab;
    public Transform obstacleContainer;
    public Collider2D playerCollider;

    public float minSpawnInterval = 1.2f;
    public float maxSpawnInterval = 2.0f;
    public float baseSpeed = 4f;
    public float speedPerScore = 0.05f;
    public float maxSpeed = 9f;
    public float minHeightScale = 0.8f;
    public float maxHeightScale = 1.3f;
    public float groundY = -3.5f;

    private Coroutine spawnRoutine;

    public void StartSpawning()
    {
        StopSpawning();
        spawnRoutine = StartCoroutine(SpawnLoop());
    }

    public void StopSpawning()
    {
        if (spawnRoutine != null)
        {
            StopCoroutine(spawnRoutine);
            spawnRoutine = null;
        }
    }

    public void ClearObstacles()
    {
        if (obstacleContainer == null)
        {
            return;
        }

        for (int i = obstacleContainer.childCount - 1; i >= 0; i--)
        {
            Destroy(obstacleContainer.GetChild(i).gameObject);
        }
    }

    private IEnumerator SpawnLoop()
    {
        while (true)
        {
            yield return new WaitForSeconds(Random.Range(minSpawnInterval, maxSpawnInterval));
            SpawnObstacle();
        }
    }

    private void SpawnObstacle()
    {
        if (obstaclePrefab == null)
        {
            return;
        }

        Camera cam = Camera.main;
        float halfWidth = cam != null ? cam.orthographicSize * cam.aspect : 10f;
        float spawnX = halfWidth + 2f;

        float heightScale = Random.Range(minHeightScale, maxHeightScale);
        Vector3 spawnPos = new Vector3(spawnX, groundY + heightScale * 0.5f, 0f);

        GameObject instance = Instantiate(obstaclePrefab, spawnPos, Quaternion.identity, obstacleContainer);
        instance.transform.localScale = new Vector3(instance.transform.localScale.x, heightScale, 1f);

        int score = GameManager.Instance != null ? GameManager.Instance.Score : 0;
        float speed = Mathf.Min(baseSpeed + score * speedPerScore, maxSpeed);

        Obstacle obstacle = instance.GetComponent<Obstacle>();
        if (obstacle != null)
        {
            obstacle.Initialize(speed, playerCollider);
        }
    }
}
