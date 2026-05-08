import * as Network from 'expo-network';
import { useEffect, useState } from 'react';

export interface NetworkInfo {
  type: string;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  signalStrength: string;
  connectionType: string;
  ipAddress: string | null;
}

export const useNetworkInfo = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    type: 'unknown',
    isConnected: false,
    isInternetReachable: null,
    signalStrength: 'Unknown',
    connectionType: 'Unknown',
    ipAddress: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const getNetworkInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get network state
        const state = await Network.getNetworkStateAsync();

        // Get IP address
        let ipAddress: string | null = null;
        if (state?.isConnected) {
          try {
            ipAddress = await Network.getIpAddressAsync();
          } catch (err) {
            console.warn('Failed to get IP address:', err);
          }
        }

        // Determine connection type and signal strength
        const type = state?.type ?? 'UNKNOWN';
        let connectionType = 'Unknown';
        let signalStrength = 'Unknown';

        if (type === Network.NetworkStateType.WIFI) {
          connectionType = 'WiFi';
          signalStrength = state?.isInternetReachable ? 'Good' : 'Fair';
        } else if (type === Network.NetworkStateType.CELLULAR) {
          connectionType = 'Cellular';
          signalStrength = state?.isInternetReachable ? 'Good' : 'Fair';
        } else if (type === Network.NetworkStateType.NONE) {
          connectionType = 'No Connection';
          signalStrength = 'No Signal';
        } else {
          connectionType = 'Unknown';
          signalStrength = 'Unknown';
        }

        if (isMounted) {
          setNetworkInfo({
            type: String(type) ?? 'unknown',
            isConnected: state?.isConnected ?? false,
            isInternetReachable: state?.isInternetReachable ?? null,
            signalStrength,
            connectionType,
            ipAddress,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to get network info');
          console.error('Network info error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getNetworkInfo();

    // Set up interval to check network info periodically
    const interval = setInterval(getNetworkInfo, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /**
   * Get formatted network info string for API submission
   * Returns: "WiFi - Good | IP: 192.168.1.1" format
   */
  const getFormattedNetworkInfo = (): string => {
    if (!networkInfo.isConnected) {
      return 'No Connection';
    }
    const parts = [`${networkInfo.connectionType} - ${networkInfo.signalStrength}`];
    if (networkInfo.ipAddress) {
      parts.push(`IP: ${networkInfo.ipAddress}`);
    }
    return parts.join(' | ');
  };

  return {
    networkInfo,
    loading,
    error,
    getFormattedNetworkInfo,
  };
};
