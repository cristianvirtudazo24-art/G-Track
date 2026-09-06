# Push Notification Implementation Guide for Backend

## Overview

This document outlines how to implement push notifications for the GTrack Mobile app so that students receive notifications even when the app is closed. This uses **Expo Push Notification Service**.

---

## What We're Implementing

**Goal**: When an admin sends a message to a student, the student receives a notification on their device's notification bar (even if the app is closed).

**Flow**:
```
1. Admin sends message via Admin Dashboard
   ↓
2. Backend creates message record in database
   ↓
3. Backend retrieves student's push token (device identifier)
   ↓
4. Backend sends push notification via Expo Push Service
   ↓
5. Expo service routes notification to student's phone
   ↓
6. Notification appears in phone's notification bar
   ↓
7. Student taps notification → App opens to message thread
```

---

## Technology Stack

- **Mobile App Framework**: React Native + Expo
- **Push Notification Service**: Expo Push Notification API
- **Protocol**: HTTPS REST API
- **Device Identification**: Expo Push Token (unique per device/student)

---

## Mobile App Implementation (Already Done)

### 1. Push Token Registration
**File**: `services/api.ts`
**Function**: `updatePushToken()`

When the app starts, it:
1. Requests push notification permission from user
2. Gets a unique push token from Expo servers
3. Sends this token to your backend

**What the mobile app sends to backend**:
```
POST /update-push-token
{
  "student_id": "123",
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

### 2. Notification Listeners
**File**: `services/notifications.ts`
**Functions**: `setupNotificationListeners()`, `scheduleLocalNotification()`

The app:
1. Listens for incoming push notifications
2. Displays them in the notification bar with sound/vibration
3. Handles user taps to navigate to the message thread

**Notification Handler Settings**:
- Sound: Enabled ✓
- Vibration: Enabled ✓
- Badge: Disabled
- Alert: Shown ✓

### 3. Auto-Updating Messages
**File**: `app/tabs/(tabs)/alerts.tsx`

When app is open:
- Polls for new messages every 5 seconds on Messages tab
- Shows visual banner when new message arrives
- Uses local notifications for immediate feedback

---

## Backend Implementation Required

### Step 1: Store Push Tokens in Database

**Table**: `students` or `push_tokens` (create if doesn't exist)

**Schema**:
```sql
CREATE TABLE push_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT UNIQUE NOT NULL,
  push_token VARCHAR(500) NOT NULL,
  device_platform VARCHAR(20),  -- "android" or "ios"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

**Alternative**: Add column to existing `students` table:
```sql
ALTER TABLE students ADD COLUMN push_token VARCHAR(500) NULLABLE;
ALTER TABLE students ADD COLUMN push_token_updated_at TIMESTAMP;
```

### Step 2: Handle Push Token Registration Endpoint

**Endpoint**: `POST /update-push-token`

**Request Body**:
```json
{
  "student_id": "123",
  "push_token": "ExponentPushToken[k0jMqW......]",
  "device_platform": "android"
}
```

**What backend should do**:
1. Validate `student_id` exists
2. Validate `push_token` format (starts with `ExponentPushToken[`)
3. Store or update the token in database
4. Return success response

**Response**:
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```

**Implementation Example (PHP/Laravel)**:
```php
Route::post('/update-push-token', function (Request $request) {
    $validated = $request->validate([
        'student_id' => 'required|exists:students,id',
        'push_token' => 'required|string',
    ]);
    
    // Update or create push token record
    PushToken::updateOrCreate(
        ['student_id' => $validated['student_id']],
        [
            'push_token' => $validated['push_token'],
            'device_platform' => $request->device_platform ?? 'unknown',
            'is_active' => true,
            'updated_at' => now(),
        ]
    );
    
    return response()->json(['success' => true]);
});
```

### Step 3: Send Push When Message is Created

**Trigger**: After admin sends message to student

**Process**:
```
1. Admin creates message
2. Message is saved in database
3. Query student's push token
4. Send push via Expo
5. Log push delivery status
```

**Implementation Logic** (Pseudo-code):

```php
// After saving message to database
$message = Message::create([
    'admin_id' => $adminId,
    'student_id' => $studentId,
    'message' => $messageText,
    'created_at' => now(),
]);

// Get student's push token
$pushToken = PushToken::where('student_id', $studentId)
    ->where('is_active', true)
    ->first();

if ($pushToken) {
    // Send push notification
    sendPushNotification(
        pushToken: $pushToken->push_token,
        title: "New Message",
        body: "Message from Admin",
        data: [
            'messageId' => $message->id,
            'studentId' => $studentId,
            'adminId' => $adminId,
            'screen' => 'messages'
        ]
    );
}
```

### Step 4: Implement Push Notification Sending

**Service/Function**: Send to Expo Push Notification API

**Expo Push Service Details**:
- **Endpoint**: `https://exp.host/--/api/v2/push/send`
- **Method**: POST
- **Authentication**: No auth needed (tokens are safe to expose)
- **Content-Type**: application/json

**Implementation** (PHP with cURL):

```php
function sendPushNotification($pushToken, $title, $body, $data = []) {
    $url = 'https://exp.host/--/api/v2/push/send';
    
    $payload = [
        'to' => $pushToken,  // Single token as string, or array for multiple
        'sound' => 'default',
        'title' => $title,
        'body' => $body,
        'data' => $data,
        'badge' => 1,
        'channelId' => 'default',  // For Android
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    // Log the result
    Log::info('Push notification sent', [
        'http_code' => $httpCode,
        'push_token' => substr($pushToken, 0, 20) . '...',
        'title' => $title,
        'success' => $httpCode === 200,
        'response' => $result,
    ]);
    
    return $httpCode === 200;
}
```

**Implementation (Node.js/Express)**:

```javascript
const axios = require('axios');

async function sendPushNotification(pushToken, title, body, data = {}) {
    const url = 'https://exp.host/--/api/v2/push/send';
    
    const payload = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        badge: 1,
        channelId: 'default',
    };
    
    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });
        
        console.log('Push sent successfully:', response.data);
        return response.status === 200;
    } catch (error) {
        console.error('Push notification failed:', error.message);
        return false;
    }
}
```

**Python/Django**:

```python
import requests
import logging

def send_push_notification(push_token, title, body, data=None):
    url = 'https://exp.host/--/api/v2/push/send'
    
    payload = {
        'to': push_token,
        'sound': 'default',
        'title': title,
        'body': body,
        'data': data or {},
        'badge': 1,
        'channelId': 'default',
    }
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            logging.info(f'Push sent successfully: {response.json()}')
            return True
        else:
            logging.error(f'Push failed: {response.status_code} - {response.text}')
            return False
    except Exception as e:
        logging.error(f'Push notification error: {str(e)}')
        return False
```

### Step 5: Handle Failed/Invalid Tokens

**When Expo returns error** (e.g., token expired):

```php
// Check Expo response
if ($result['errors']) {
    foreach ($result['errors'] as $error) {
        if ($error['code'] === 'DeviceNotRegistered' || 
            $error['code'] === 'InvalidCredentials') {
            // Mark token as inactive
            PushToken::where('push_token', $pushToken)
                ->update(['is_active' => false]);
        }
    }
}
```

---

## Notification Content Guidelines

### For Message Notifications

**When admin sends message to student**:

```
Title: "New Message"
Body: "[Admin Name] sent you a message"  
      OR "New message from [Admin Name]"

Data:
{
  "messageId": 123,
  "studentId": 45,
  "adminId": 67,
  "screen": "messages",
  "adminName": "John Smith"
}
```

**Example**:
```
Title: "New Message"
Body: "Admin John Smith: Hello, are you safe?"
```

### For Alert Notifications (Broadcasts)

```
Title: "Campus Alert"
Body: "[Alert Type] - [Message Preview]"

Data:
{
  "alertId": 123,
  "type": "warning",
  "screen": "broadcasts"
}
```

---

## Testing Checklist

- [ ] Push token is sent to backend when app starts
- [ ] Push token is stored in database
- [ ] Admin can send message to student
- [ ] Backend retrieves student's push token
- [ ] Backend sends notification to Expo API
- [ ] Notification appears on student's phone (even if app closed)
- [ ] Tapping notification opens app to message thread
- [ ] Expired tokens are handled gracefully
- [ ] Multiple messages show multiple notifications
- [ ] Works on both Android and iOS

---

## Expo Push Notification API Response Examples

**Success Response**:
```json
{
  "data": [
    {
      "status": "ok",
      "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    }
  ]
}
```

**Failure Response** (Invalid Token):
```json
{
  "data": [
    {
      "status": "error",
      "message": "The Expo push token ...... is not a valid push token",
      "details": {
        "error": "InvalidCredentials"
      }
    }
  ]
}
```

**Multiple Tokens** (Batch):
```json
{
  "data": [
    { "status": "ok", "id": "..." },
    { "status": "error", "details": { "error": "DeviceNotRegistered" } }
  ]
}
```

---

## Best Practices

1. **Token Expiration**: Tokens can expire. Mark them as inactive if Expo returns error
2. **Batch Sending**: For multiple students, batch requests to Expo for efficiency
3. **Rate Limiting**: Don't send too many notifications (annoying to users)
4. **Logging**: Log all push attempts for debugging
5. **Fallback**: Have a local database backup of tokens
6. **Deep Linking**: Ensure notification data includes enough info to navigate correctly
7. **Testing**: Always test on real devices before production (simulators can't receive pushes)

---

## Integration Timeline

1. **Day 1**: Create push_tokens table in database
2. **Day 1-2**: Implement /update-push-token endpoint
3. **Day 2-3**: Implement send push function and trigger from message creation
4. **Day 3-4**: Testing and error handling
5. **Day 4-5**: Production deployment and monitoring

---

## Support

If you need clarification on:
- **Mobile App Side**: Check `services/notifications.ts` and `services/api.ts`
- **Expo Documentation**: https://docs.expo.dev/push-notifications/overview/
- **Error Codes**: https://docs.expo.dev/push-notifications/troubleshooting/

Contact the mobile development team for any app-side questions.

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-29  
**Status**: Ready for Backend Implementation
