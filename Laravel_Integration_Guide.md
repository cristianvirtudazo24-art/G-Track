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

### E. Emergency Video Upload ⭐ **CRITICAL**
*   **Method**: `POST`
*   **Path**: `/api/upload-video`
*   **Content-Type**: `multipart/form-data`
*   **Form Fields**:
    - `video` (file upload) - MP4 video file (up to 5-6MB, 5 seconds duration)
    - `student_id` (string/number) - Student database ID
    - `target` (string) - Fixed value: `"sos"` (indicates this is an SOS video)
    - `message` (string) - Will be `"Live Emergency Feed"`
    - `latitude` (number, optional) - Student's latitude
    - `longitude` (number, optional) - Student's longitude
    - `battery_level` (number, optional) - Battery percentage (0-100)
    - `signal` (string, optional) - Signal strength info (e.g., "WiFi - Good | IP: 192.168.1.1")

*   **Expected Response** (Success):
    ```json
    {
      "success": true,
      "message": "Video uploaded successfully",
      "video_id": 123,
      "student_id": 15
    }
    ```

*   **Expected Response** (Error):
    ```json
    {
      "success": false,
      "message": "Video upload failed"
    }
    ```

*   **Backend Requirements**:
    1. Accept multipart/form-data with file upload
    2. Store video file to storage (e.g., `storage/app/sos-videos/`)
    3. Create a record in your database linking the video to the student
    4. Return JSON response with success status
    5. Optionally: Process video (compress, convert format, extract frames for thumbnail)

---

## 4. Important Database Note
Please ensure your `Student` model allows the following updates:
1.  `$student->status = true` (marking online when GPS is received).
2.  `$student->last_update = now()` (timestamp of the last sync).

## 5. Video Upload Implementation Example (Laravel)
```php
// routes/api.php
Route::post('/upload-video', [EmergencyController::class, 'uploadVideo']);

// app/Http/Controllers/EmergencyController.php
public function uploadVideo(Request $request)
{
    $validated = $request->validate([
        'video' => 'required|file|mimes:mp4,mov|max:6144', // 6MB max
        'student_id' => 'required|exists:students,id',
        'target' => 'required|in:sos',
        'message' => 'nullable|string',
        'latitude' => 'nullable|numeric',
        'longitude' => 'nullable|numeric',
        'battery_level' => 'nullable|numeric',
        'signal' => 'nullable|string',
    ]);

    $student = Student::find($request->student_id);
    
    if ($request->hasFile('video')) {
        $videoPath = $request->file('video')->store('sos-videos', 'public');
        
        // Create database record
        $video = SOS_Video::create([
            'student_id' => $student->id,
            'video_path' => $videoPath,
            'message' => $request->message,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'battery_level' => $request->battery_level,
            'signal' => $request->signal,
            'uploaded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Video uploaded successfully',
            'video_id' => $video->id,
            'student_id' => $student->id,
        ], 201);
    }

    return response()->json([
        'success' => false,
        'message' => 'Video upload failed',
    ], 400);
}
```
