# G!Track Mobile App → Backend API Specification
**For Backend Team Implementation**

This document shows **EXACTLY** what the mobile app sends to each endpoint. Backend should implement endpoints to match these specifications.

---

## 1. LOCATION ENDPOINTS

### 1.1 GET - Fetch All Locations & Student Statuses
```
GET /api/status/all
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Response Expected by App:**
```json
[
  {
    "id": 15,
    "student_id": "STU001",
    "student": {
      "id": 15,
      "name": "John Doe",
      "student_id": "STU001"
    },
    "sos_status": "safe",
    "latitude": 10.2952,
    "longitude": 123.8955,
    "recorded_at": "2026-05-02T10:30:00Z"
  }
]
```

---

### 1.2 GET - Fetch All Locations
```
GET /api/location/all
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Response Expected by App:**
```json
[
  {
    "id": 15,
    "student_id": "STU001",
    "student": {
      "id": 15,
      "name": "John Doe",
      "student_id": "STU001"
    },
    "sos_status": "safe|help",
    "latitude": 10.2952,
    "longitude": 123.8955,
    "recorded_at": "2026-05-02T10:30:00Z"
  }
]
```

---

### 1.3 POST - Update Location (Student sends heartbeat)
```
POST /api/location/update
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Request Body (App Sends):**
```json
{
  "student_id": 15,
  "latitude": 10.2952,
  "longitude": 123.8955,
  "sos_status": "safe"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Location updated"
}
```

---

### 1.4 POST - Send SOS Alert
```
POST /api/location/sos
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Request Body (App Sends):**
```json
{
  "student_id": "15",
  "sos_status": "help",
  "battery_level": 85,
  "signal": "WiFi - Good | IP: 192.168.1.1"
}
```

**Note:** `sos_status` can be `"safe"` or `"help"`

**Expected Response:**
```json
{
  "success": true,
  "message": "SOS alert received"
}
```

---

## 2. VIDEO UPLOAD ENDPOINT ⭐ CRITICAL

### 2.1 POST - Emergency Video Upload
```
POST /api/upload-video
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data - App Sends):**
| Field | Type | Value | Optional? |
|-------|------|-------|-----------|
| `video` | file | MP4 video file (5-6MB max, 5 seconds) | ❌ Required |
| `student_id` | string/number | Student database ID (e.g., "15") | ❌ Required |
| `target` | string | Fixed: `"sos"` | ❌ Required |
| `message` | string | Fixed: `"Live Emergency Feed"` | ✅ Optional |
| `latitude` | string/number | Student's latitude (e.g., "10.2952") | ✅ Optional |
| `longitude` | string/number | Student's longitude (e.g., "123.8955") | ✅ Optional |
| `battery_level` | string/number | Battery percentage (e.g., "85") | ✅ Optional |
| `signal` | string | Signal info (e.g., "WiFi - Good \| IP: 192.168.1.1") | ✅ Optional |

**Example cURL (for testing):**
```bash
curl -X POST http://192.168.110.48:8007/api/upload-video \
  -F "video=@video.mp4" \
  -F "student_id=15" \
  -F "target=sos" \
  -F "message=Live Emergency Feed" \
  -F "latitude=10.2952" \
  -F "longitude=123.8955" \
  -F "battery_level=85" \
  -F "signal=WiFi - Good | IP: 192.168.1.1"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "video_id": 123,
  "student_id": 15
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "message": "Video upload failed"
}
```

---

## 3. NOTIFICATION ENDPOINTS

### 3.1 POST - Send Notification/Alert
```
POST /api/notifications/send
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Use Case A: Student sends SOS Help Request**
```json
{
  "student_id": "15",
  "target": "sos",
  "message": "Emergency Help Needed"
}
```

**Use Case B: Student reports Blackout**
```json
{
  "student_id": "15",
  "target": "blackout",
  "message": "Blackout Alert",
  "battery_level": 45,
  "signal": "WiFi - Fair | IP: 192.168.1.1"
}
```

**Use Case C: Student sends message to admin**
```json
{
  "student_id": "15",
  "target": "student_message",
  "message": "Hello admin, I have a question about the app"
}
```

**Use Case D: Admin sends announcement to class**
```json
{
  "target": "2026",
  "message": "Class reminder: Emergency drill tomorrow at 2 PM"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Notification sent"
}
```

---

### 3.2 GET - Fetch Student Notifications
```
GET /api/notifications/{student_id}
```

**Parameters:**
- `student_id` - Student's database ID (e.g., `/api/notifications/15`)

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Expected Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "broadcast|personal",
      "message": "Class reminder: Emergency drill tomorrow",
      "created_at": "2026-05-02T10:30:00Z",
      "sender_type": "admin|student"
    },
    {
      "id": 2,
      "type": "personal",
      "message": "Your SOS was received successfully",
      "created_at": "2026-05-02T11:00:00Z",
      "sender_type": "admin"
    }
  ]
}
```

---

## 4. PUSH NOTIFICATION ENDPOINT

### 4.1 POST - Register/Update Push Token
```
POST /api/update-push-token
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Request Body (App Sends):**
```json
{
  "student_id": 15,
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Push token updated"
}
```

---

## 5. COMPLETE REQUEST/RESPONSE FLOW EXAMPLES

### Example 1: Student Clicks "I Need Help" Button
```
[App] Records 5-second video
↓
[App] POST /api/upload-video (multipart/form-data with video)
→ Backend stores video + creates record
↓
[App] POST /api/location/sos 
{
  "student_id": "15",
  "sos_status": "help",
  "battery_level": 92,
  "signal": "WiFi - Good | IP: 192.168.1.1"
}
→ Backend creates SOS alert
↓
[App] Shows "Help request sent to admin" ✅
```

### Example 2: Blackout Alert Button
```
[App] POST /api/notifications/send
{
  "student_id": "15",
  "target": "blackout",
  "message": "Blackout Alert",
  "battery_level": 15,
  "signal": "Cellular - Fair"
}
→ Backend sends push notification to admins
↓
[App] Shows "Blackout reported" ✅
```

### Example 3: Student Marked Safe
```
[App] POST /api/location/sos
{
  "student_id": "15",
  "sos_status": "safe",
  "battery_level": 88,
  "signal": "WiFi - Good"
}
→ Backend updates status to safe
↓
[App] Shows "You are marked safe" ✅
```

---

## 6. ERROR HANDLING

**What the app expects:**
- ✅ HTTP 200-201: Success (with JSON response)
- ✅ HTTP 400-500: Error (with JSON error message)
- ✅ All responses should contain `success: true/false`

**If endpoint is unreachable:**
```
Error shown to user: "❌ Server unreachable"
Check: IP address, Port, Firewall, Network connection
```

---

## 7. DATA TYPES & VALIDATION

| Field | Type | Validation | Example |
|-------|------|-----------|---------|
| `student_id` | string or number | Must exist in database | `15` or `"15"` |
| `latitude` | number | -90 to 90 | `10.2952` |
| `longitude` | number | -180 to 180 | `123.8955` |
| `battery_level` | number | 0-100 (percentage) | `85` |
| `signal` | string | Any format | `"WiFi - Good"` |
| `sos_status` | string | `"safe"` or `"help"` only | `"safe"` |
| `target` | string | `"sos"`, `"blackout"`, `"student_message"`, class year | `"sos"` |
| `video` | file | MP4, max 6MB | video.mp4 |

---

## 8. QUICK REFERENCE - URLs

```
Base URL: http://192.168.110.48:8007/api

GET    /status/all
GET    /location/all
POST   /location/update
POST   /location/sos
POST   /upload-video          ⭐ MULTIPART
POST   /notifications/send
GET    /notifications/{id}
POST   /update-push-token
```

---

## 9. NOTES FOR BACKEND TEAM

1. **Accept both numeric and string `student_id`** - The app may send `15` or `"15"`
2. **Video is optional** - If upload fails, SOS notification still sends with message "Video feed is not available"
3. **Timeout: 30 seconds** - For video uploads, allow 30+ second timeout
4. **Multipart must work** - Video upload uses `multipart/form-data`, not JSON
5. **CORS headers needed** - The app needs CORS enabled to access the API
6. **Timestamp format** - Use ISO 8601: `2026-05-02T10:30:00Z`
