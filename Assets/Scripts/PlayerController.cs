using UnityEngine;

[RequireComponent(typeof(Rigidbody2D))]
public class PlayerController : MonoBehaviour
{
    public float jumpForce = 7f;

    private Rigidbody2D rb;
    private Vector3 startPosition;
    private int groundContacts;

    private void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        startPosition = transform.position;
    }

    private void Update()
    {
        if (GameManager.Instance == null || GameManager.Instance.CurrentState != GameManager.GameState.Playing)
        {
            return;
        }

        if (groundContacts > 0 && DetectTap())
        {
            Jump();
        }
    }

    private bool DetectTap()
    {
        if (Input.GetMouseButtonDown(0))
        {
            return true;
        }

        for (int i = 0; i < Input.touchCount; i++)
        {
            if (Input.GetTouch(i).phase == TouchPhase.Began)
            {
                return true;
            }
        }

        return false;
    }

    private void Jump()
    {
#if UNITY_6000_0_OR_NEWER
        rb.linearVelocity = new Vector2(rb.linearVelocity.x, 0f);
#else
        rb.velocity = new Vector2(rb.velocity.x, 0f);
#endif
        rb.AddForce(Vector2.up * jumpForce, ForceMode2D.Impulse);
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Ground"))
        {
            groundContacts++;
        }
        else if (collision.gameObject.CompareTag("Obstacle"))
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnPlayerDied();
            }
        }
    }

    private void OnCollisionExit2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Ground"))
        {
            groundContacts = Mathf.Max(0, groundContacts - 1);
        }
    }

    public void ResetPlayer()
    {
        transform.position = startPosition;
        transform.rotation = Quaternion.identity;

#if UNITY_6000_0_OR_NEWER
        rb.linearVelocity = Vector2.zero;
#else
        rb.velocity = Vector2.zero;
#endif
        rb.angularVelocity = 0f;
        groundContacts = 0;
    }
}
