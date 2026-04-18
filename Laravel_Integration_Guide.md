# G!Track Laravel Integration Guide (Updated)

This document provides the exact technical requirements for the Laravel backend to match the **G!Track-Mobile** application logic.

## 1. Network Requirements
*   **Internal IP Address**: The app connects via your LAN IP (e.g., `192.168.1.XX`).
*   **CORS**: Ensure `config/cors.php` allows requests from the mobile device.

## 2. Global Rule: Student ID Handling
> [!IMPORTANT]
> To improve reliability, the mobile app now uses the **Numeric Database Primary Key (`id`)** for most sync operations. 
> Your controllers should use: `$student = Student::find($request->student_id)` or `$student = Student::where('student_id', $request->student_id)->orWhere('id', $request->student_id)->first();`

---

## 3. Required API Endpoints

### A. Location Sync (Heartbeat)
*   **Method**: `POST`
*   **Path**: `/api/location/update`
*   **Payload**:
    ```json
    {
      "student_id": 15,
      "latitude": 10.2952,
      "longitude": 123.8955,
      "sos_status": "safe|help"
    }
    ```

### B. Student-Admin Messaging (Replies)
*   **Method**: `POST`
*   **Path**: `/api/notifications/send`
*   **Payload for Student Reply**:
    ```json
    {
      "student_id": 15,
      "target": "student_message",
      "message": "Hello admin, I have a question..."
    }
    ```
*   **Controller Logic**: Ensure this creates a record in your `notifications` table with `sender_type = 'student'`.

### C. Fetching Alerts & Messages
*   **Method**: `GET`
*   **Path**: `/api/notifications/{student_db_id}`
*   **Response**:
    ```json
    {
      "success": true,
      "notifications": [
        { "id": 1, "type": "broadcast|personal", "message": "...", "created_at": "...", "sender_type": "admin|student" }
      ]
    }
    ```

### D. Push Token Registration
*   **Method**: `POST`
*   **Path**: `/api/update-push-token`
*   **Payload**:
    ```json
    {
      "student_id": 15,
      "push_token": "Expo-Push-Token[...]"
    }
    ```

---

## 4. Important Database Note
Please ensure your `Student` model allows the following updates:
1.  `$student->status = true` (marking online when GPS is received).
2.  `$student->last_update = now()` (timestamp of the last sync).
