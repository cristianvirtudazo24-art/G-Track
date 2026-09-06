import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../constants/Network';

interface SOSVideoPlayerProps {
  notificationId: string | number;
}

const SOSVideoPlayer = ({ notificationId }: SOSVideoPlayerProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const player = useVideoPlayer(videoUrl || '', (p) => {
    p.loop = true;
  });

  useEffect(() => {
    let isMounted = true;
    const loadVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the new simple backend endpoint to fetch the clean video URL
        const videoEndpoint = `${API_BASE_URL}/notification/${notificationId}/video`;
        console.log(`🎥 Fetching video URL from: ${videoEndpoint}`);
        
        const response = await fetch(videoEndpoint, {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          if (data.success && data.video_url) {
            setVideoUrl(data.video_url);
          } else {
            setVideoUrl(null);
          }
        }
      } catch (err: any) {
        console.error("Error fetching video URL:", err);
        if (isMounted) {
          setError(err.message || "Failed to load video URL");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [notificationId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        <Text style={styles.loadingText}>Fetching video feed...</Text>
      </View>
    );
  }

  if (error || !videoUrl) {
    return (
      <View style={styles.noVideoContainer}>
        <Text style={styles.noVideoText}>No Video Feed Available</Text>
        <Text style={styles.noVideoSubtext}>
          {error ? `Connection error (${error})` : 'Student device has not uploaded video data'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        {...({ allowsFullscreen: true, allowsPictureInPicture: true } as any)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  noVideoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  noVideoText: {
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  noVideoSubtext: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SOSVideoPlayer;
