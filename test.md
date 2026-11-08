Use http://127.0.0.1:8000 as the base URL.

Health and library

GET /
GET /library/traditions
GET /library/stats
GET /library/traditions/{slug} — e.g. hindu
GET /library/traditions/{slug}/texts
Authentication

POST /auth/signup — JSON: {"name":"Test User","email":"you@example.com","password":"your-password"}
POST /auth/verify-otp — JSON: {"email":"you@example.com","otp":"123456"}
POST /auth/signin — JSON: {"email":"you@example.com","password":"your-password"}
GET /auth/me
Wisdom and chat

POST /wisdom/search — JSON: {"query":"How can I handle stress?","tradition":"hindu"}
POST /chat/{tradition} — e.g. /chat/hindu; JSON: {"message":"How can I handle stress?"}
POST /chat/scripture/{scripture_id} — e.g. /chat/scripture/bg-2-47; JSON: {"message":"What does this teach?","tradition":"hindu"}
Journey

GET /journey/summary
GET /journey/milestones
GET /journey/insights
POST /journey/insights —  JSON: {"source":"Bhagavad Gita","title":"Gita 2.47","quote":"Example quote","note":"My note","tradition":"hindu"}
PATCH /journey/insights/{insight_id}/note — JSON: {"note":"Updated note"}
DELETE /journey/insights/{insight_id}
POST /journey/chat-log?tradition=hindu&message=Example%20message