# G!Track Mobile App - Video Upload Specification  
**Official Admin Backend Specification**

---

## Endpoint

**Method:** `POST`  
**Endpoint:** `/api/notifications/send` (Official admin endpoint)  
**Content-Type:** `multipart/form-data` ⚠️ (Not JSON - must use multi-part form data)

---

## What the App Sends

### Form Data Fields

```
POST /api/upload-video HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="video"; filename="sos.mp4"
Content-Type: video/mp4

[BINARY VIDEO DATA - 5-6MB MP4 FILE]
------WebKitFormBoundary
Content-Disposition: form-data; name="student_id"

15
------WebKitFormBoundary
Content-Disposition: form-data; name="target"

sos
------WebKitFormBoundary
Content-Disposition: form-data; name="message"

Live Emergency Feed
------WebKitFormBoundary
Content-Disposition: form-data; name="latitude"

10.2952
------WebKitFormBoundary
Content-Disposition: form-data; name="longitude"

123.8955
------WebKitFormBoundary
Content-Disposition: form-data; name="battery_level"

85
------WebKitFormBoundary
Content-Disposition: form-data; name="signal"

WiFi - Good | IP: 192.168.1.1
------WebKitFormBoundary--
```

---

## Field Details (Per Admin Spec)

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| **video** | File | ✅ YES | sos.mp4 | Formats: .mp4, .mov, .avi | Max 20MB (per admin spec) |
| **student_id** | String/Number | ✅ YES | `"15"` or `15` | Student database ID |
| **target** | String | ✅ YES | `"sos"` or `"student_message"` | `sos` for emergencies, `student_message` for normal uploads, `blackout` for outages |
| **message** | String | ✅ YES | `"Emergency - I Need Help"` | **REQUIRED** - Backend will reject if missing. App uses fallback: "Video uploaded" |
| **latitude** | Number | ❌ Optional | `10.2952` | GPS latitude |
| **longitude** | Number | ❌ Optional | `123.8955` | GPS longitude |
| **battery_level** | Number | ❌ Optional | `85` | Battery percentage (0-100) |
| **signal** | String | ❌ Optional | `"WiFi - Good"` | Network signal info |
| **location** | String | ❌ Optional | `"123 Main St, City"` | Human-readable address |

---

## Code Examples from Mobile App

### TypeScript (From `services/api.ts`)

```typescript
export const uploadEmergencyVideo = async (payload: {
  videoUri: string;
  studentId: string;
  message?: string;
  latitude?: string | number;
  longitude?: string | number;
  battery_level?: string | number;
  signal?: string;
}) => {
  const { videoUri, studentId, message, latitude, longitude, battery_level, signal } = payload;

  const formData = new FormData();
  // @ts-ignore
  formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'sos.mp4' });
  formData.append('student_id', studentId);
  formData.append('target', 'sos');
  formData.append('message', message || 'Live Emergency Feed');
  if (latitude !== undefined && latitude !== null) formData.append('latitude', String(latitude));
  if (longitude !== undefined && longitude !== null) formData.append('longitude', String(longitude));
  if (battery_level !== undefined && battery_level !== null) formData.append('battery_level', String(battery_level));
  if (signal) formData.append('signal', signal);

  const uploadUrl = `${API_BASE_URL}/upload-video`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  const responseText = await response.text();
  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  if (!response.ok) {
    console.error('❌ API Error: Video Upload Failed', {
      status: response.status,
      body: responseData,
    });
    return null;
  }

  return responseData;
};
```

---

## When Video is Sent (Call Flow)

```
1. User clicks "I Need Help" button
   ↓
2. App records 5-second video from camera
   ↓
3. App calls uploadEmergencyVideo() with video file
   ↓
4. POST /api/upload-video (multipart form with video + metadata)
   ↓
5. Backend should:
   - Accept multipart/form-data
   - Save video file to local storage
   - Return JSON response
   ↓
6. Then app sends SOS notification via POST /api/location/sos
```

---

## Expected Backend Response (Per Admin Spec)

### Success Response (HTTP 200 OK)
```json
{
  "success": true,
  "message": "Emergency alert received by Admin!",
  "notification_id": 105
}
```

### Error: Invalid Student ID (HTTP 404 Not Found)
```json
{
  "success": false,
  "message": "Invalid Student ID"
}
```

### Error: Validation Error (HTTP 422 Unprocessable Entity)
Occurs when:
- Required field `message` is missing
- Video file exceeds 20MB
- Video format is not .mp4, .mov, or .avi

```json
{
  "success": false,
  "message": "Validation error - check required fields"
}
```

---

## cURL Test Command

```bash
curl -X POST http://192.168.110.48:8007/api/notifications/send \
  -F "video=@sos.mp4" \
  -F "student_id=15" \
  -F "target=sos" \
  -F "message=Emergency - I Need Help" \
  -F "latitude=10.2952" \
  -F "longitude=123.8955" \
  -F "battery_level=85" \
  -F "signal=WiFi - Good"
```

---

## Laravel Backend Implementation Example

```php
// routes/api.php
Route::post('/upload-video', [EmergencyController::class, 'uploadVideo']);

// app/Http/Controllers/EmergencyController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;

class EmergencyController extends Controller
{
    public function uploadVideo(Request $request)
    {
        // Validate incoming data
        $validated = $request->validate([
            'video' => 'required|file|mimes:mp4,mov|max:6144', // 6MB max
            'student_id' => 'required|string',
            'target' => 'required|in:sos',
            'message' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'battery_level' => 'nullable|numeric',
            'signal' => 'nullable|string',
        ]);

        // Store video file locally
        if ($request->hasFile('video')) {
            try {
                $videoFile = $request->file('video');
                
                // Create directory if it doesn't exist
                $storageDir = storage_path('app/sos-videos');
                if (!is_dir($storageDir)) {
                    mkdir($storageDir, 0755, true);
                }

                // Generate unique filename with student ID and timestamp
                $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
                $filename = "student_{$request->student_id}_{$timestamp}.mp4";
                $filePath = "{$storageDir}/{$filename}";

                // Move uploaded file to storage
                $videoFile->move($storageDir, $filename);

                // Optional: Log video metadata to a text file (instead of database)
                $metadataDir = storage_path('app/sos-videos-metadata');
                if (!is_dir($metadataDir)) {
                    mkdir($metadataDir, 0755, true);
                }

                $metadataFile = "{$metadataDir}/{$timestamp}_student_{$request->student_id}.txt";
                $metadata = [
                    'Student ID: ' . $request->student_id,
                    'Video File: ' . $filename,
                    'Message: ' . ($request->message ?? 'Live Emergency Feed'),
                    'Latitude: ' . ($request->latitude ?? 'N/A'),
                    'Longitude: ' . ($request->longitude ?? 'N/A'),
                    'Battery Level: ' . ($request->battery_level ?? 'N/A') . '%',
                    'Signal: ' . ($request->signal ?? 'N/A'),
                    'Uploaded At: ' . $timestamp,
                ];
                file_put_contents($metadataFile, implode("\n", $metadata));

                return response()->json([
                    'success' => true,
                    'message' => 'Video uploaded successfully',
                    'video_file' => $filename,
                    'storage_path' => $filePath,
                    'student_id' => $request->student_id,
                ], 201);
                
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video upload failed: ' . $e->getMessage()
                ], 500);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'No video file provided'
        ], 400);
    }
}
```

---

## Local Storage Structure

Videos will be stored on the admin's local machine in:

```
storage/app/
├── sos-videos/                          # Video files directory
│   ├── student_15_2026-05-02_10-30-45.mp4
│   ├── student_15_2026-05-02_14-22-10.mp4
│   ├── student_22_2026-05-02_15-45-30.mp4
│   └── ...more videos...
│
└── sos-videos-metadata/                 # Video metadata directory (optional)
    ├── 2026-05-02_10-30-45_student_15.txt
    ├── 2026-05-02_14-22-10_student_15.txt
    ├── 2026-05-02_15-45-30_student_22.txt
    └── ...more metadata...
```

**Example metadata text file content:**
```
Student ID: 15
Video File: student_15_2026-05-02_10-30-45.mp4
Message: Live Emergency Feed
Latitude: 10.2952
Longitude: 123.8955
Battery Level: 85%
Signal: WiFi - Good | IP: 192.168.1.1
Uploaded At: 2026-05-02_10-30-45
```

**Access videos from admin panel:**
- Windows: `C:\Laravel\storage\app\sos-videos\`
- Mac/Linux: `/path/to/laravel/storage/app/sos-videos/`

---

## Important Notes for Backend

1. **Accept multipart/form-data** - NOT JSON
2. **File validation** - Ensure it's MP4, max 6MB
3. **Optional fields** - Only `video`, `student_id`, and `target` are required
4. **Timeout** - App waits 30 seconds for response, so ensure endpoint completes within that time
5. **Video storage** - Store locally in `storage/app/sos-videos/` directory
6. **Metadata** - Store metadata in text files in `storage/app/sos-videos-metadata/` (optional but helpful for admin)
7. **Response format** - Must return valid JSON with `success` field
8. **HTTP status** - Use 201 for success, 4xx/5xx for errors
9. **No Database** - Videos are stored as files on the admin's local storage, not in database



---

## Summary

**The app sends:**
- MP4 video file (5 seconds, ~5-6MB)
- Student ID
- Target: "sos"
- Optional: message, location, battery, signal

**Backend should:**
1. ✅ Accept multipart/form-data POST request
2. ✅ Validate video is MP4 and under 6MB
3. ✅ Save video file locally to disk
4. ✅ Save metadata to text file (optional)
5. ✅ Return JSON: `{success: true, video_file: 'filename.mp4', student_id: X}`

That's it! The mobile app is ready to send videos immediately.
