import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo' || (Constants as any).executionEnvironment === 'storeClient';

const getNotifications = () => {
  if (isExpoGo) {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};

export async function scheduleLocalNotification(title: string, previewText: string, data: Record<string, any> = {}) {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: previewText,
        data,
        sound: true,
        priority: 'high',
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('Local notification suppressed in Expo Go:', e);
  }
}

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    return null;
  }
  
  try {
    const Notifications = getNotifications();
    if (!Notifications) return null;

    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch (e) {
        console.error('❌ Error getting Expo Push Token:', e);
      }
    }

    return token;
  } catch (e) {
    console.warn('Push notification registration suppressed in Expo Go');
    return null;
  }
}

export function setupNotificationListeners(
  onNotificationReceived: (notification: any) => void,
  onNotificationResponse: (response: any) => void
) {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return () => {};

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const notificationListener = Notifications.addNotificationReceivedListener(onNotificationReceived);
    const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

    return () => {
      notificationListener?.remove?.();
      responseListener?.remove?.();
    };
  } catch (e) {
    console.warn('Push notification listeners suppressed in Expo Go');
    return () => {};
  }
}
