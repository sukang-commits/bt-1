using UnityEngine;

[RequireComponent(typeof(Collider2D))]
public class Obstacle : MonoBehaviour
{
    private float speed;
    private Collider2D playerCollider;
    private Collider2D myCollider;
    private bool scored;
    private float despawnX;

    private void Awake()
    {
        myCollider = GetComponent<Collider2D>();
    }

    private void Start()
    {
        Camera cam = Camera.main;
        float halfWidth = cam != null ? cam.orthographicSize * cam.aspect : 10f;
        despawnX = -halfWidth - 2f;
    }

    public void Initialize(float moveSpeed, Collider2D targetPlayerCollider)
    {
        speed = moveSpeed;
        playerCollider = targetPlayerCollider;
    }

    private void Update()
    {
        transform.Translate(Vector3.left * speed * Time.deltaTime, Space.World);

        if (!scored && playerCollider != null && myCollider.bounds.max.x < playerCollider.bounds.min.x)
        {
            scored = true;
            if (GameManager.Instance != null)
            {
                GameManager.Instance.AddScore();
            }
        }

        if (transform.position.x < despawnX)
        {
            Destroy(gameObject);
        }
    }
}
